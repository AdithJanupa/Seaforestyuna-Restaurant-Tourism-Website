const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { db, getCollection, getById, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');
const { createNotifications } = require('../utils/notifications');
const { sendRoomBookingReceiptEmail } = require('../utils/mailer');

const router = express.Router();

const generateBookingRef = () => `RM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const USER_EDITABLE_STATUSES = new Set(['Pending', 'Confirmed']);

const canUserManageBooking = (booking) => USER_EDITABLE_STATUSES.has(String(booking?.status || 'Pending'));

const validateRoomBookingInput = async ({ roomId, checkIn, checkOut, guests, bookingIdToIgnore = null }) => {
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const checkOutDate = new Date(`${checkOut}T00:00:00`);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return { error: 'Invalid booking dates' };
  }

  if (checkInDate >= checkOutDate) {
    return { error: 'Check-out must be after check-in' };
  }

  const room = await getById('rooms', roomId);
  if (!room) {
    return { error: 'Room not found', status: 404 };
  }

  if (Number(guests) > Number(room.capacity || 0)) {
    return { error: 'Guest count exceeds room capacity' };
  }

  const snapshot = await db
    .ref('roomBookings')
    .orderByChild('roomId')
    .equalTo(roomId)
    .once('value');

  const existing = Object.values(snapshot.val() || {});
  const overlap = existing.find((booking) => {
    if (booking.status === 'Cancelled') return false;
    if (bookingIdToIgnore && (booking._id === bookingIdToIgnore || booking.id === bookingIdToIgnore)) return false;

    const existingCheckIn = new Date(`${booking.checkIn}T00:00:00`);
    const existingCheckOut = new Date(`${booking.checkOut}T00:00:00`);
    return existingCheckIn < checkOutDate && existingCheckOut > checkInDate;
  });

  if (overlap) {
    return { error: 'Room is already booked for selected dates', status: 409 };
  }

  const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalPrice = Number((totalNights * Number(room.pricePerNight || 0)).toFixed(2));

  return {
    room,
    totalNights,
    totalPrice
  };
};

router.post(
  '/',
  authJWT,
  [
    body('roomId').notEmpty().withMessage('Room id required'),
    body('checkIn').notEmpty().withMessage('Check-in date required'),
    body('checkOut').notEmpty().withMessage('Check-out date required'),
    body('guests').isInt({ min: 1 }).withMessage('Guest count required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;
      const result = await validateRoomBookingInput({ roomId, checkIn, checkOut, guests });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      const booking = await createRecord('roomBookings', {
        userId: req.user.uid,
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        roomId,
        roomName: result.room.name || '',
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests || '',
        status: 'Pending',
        bookingRef: generateBookingRef(),
        totalNights: result.totalNights,
        totalPrice: result.totalPrice
      });

      try {
        await createNotifications([
          {
            scope: 'admin',
            referenceType: 'roomBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'New room booking created',
            message: `${booking.userName || booking.userEmail || 'A guest'} booked ${booking.roomName || 'a room'}.`,
            metadata: {
              status: booking.status,
              roomName: booking.roomName
            }
          },
          {
            scope: 'user',
            targetUserId: booking.userId,
            referenceType: 'roomBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'Room booking received',
            message: `Your room booking ${booking.bookingRef} for ${booking.roomName || 'your stay'} is now ${booking.status}.`,
            metadata: {
              status: booking.status,
              roomName: booking.roomName
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create room booking notifications', notificationError);
      }

      sendRoomBookingReceiptEmail({
        booking,
        room: result.room
      })
        .then((mailResult) => {
          if (!mailResult?.sent) {
            console.warn(`Room booking receipt email skipped for ${booking.bookingRef}: ${mailResult?.reason || 'unknown-reason'}`);
          }
        })
        .catch((mailError) => {
          console.error('Failed to send room booking receipt email', mailError);
        });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/my', authJWT, async (req, res, next) => {
  try {
    const bookings = await getCollection('roomBookings');
    const filtered = bookings.filter((booking) => booking.userId === req.user.uid);
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id',
  authJWT,
  [
    body('roomId').optional().notEmpty().withMessage('Room plan required'),
    body('checkIn').optional().notEmpty().withMessage('Check-in date required'),
    body('checkOut').optional().notEmpty().withMessage('Check-out date required'),
    body('guests').optional().isInt({ min: 1 }).withMessage('Guest count required'),
    body('specialRequests').optional().isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      const booking = await getById('roomBookings', req.params.id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.userId !== req.user.uid) return res.status(403).json({ message: 'You can only edit your own booking' });
      if (!canUserManageBooking(booking)) {
        return res.status(400).json({ message: 'This booking can no longer be edited' });
      }

      const nextRoomId = req.body.roomId || booking.roomId;
      const nextCheckIn = req.body.checkIn || booking.checkIn;
      const nextCheckOut = req.body.checkOut || booking.checkOut;
      const nextGuests = req.body.guests !== undefined ? Number(req.body.guests) : Number(booking.guests);
      const nextSpecialRequests =
        Object.prototype.hasOwnProperty.call(req.body, 'specialRequests') ? req.body.specialRequests || '' : booking.specialRequests || '';

      const result = await validateRoomBookingInput({
        roomId: nextRoomId,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        guests: nextGuests,
        bookingIdToIgnore: req.params.id
      });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      const updated = await updateRecord('roomBookings', req.params.id, {
        roomId: nextRoomId,
        roomName: result.room.name || booking.roomName || '',
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        guests: nextGuests,
        specialRequests: nextSpecialRequests,
        totalNights: result.totalNights,
        totalPrice: result.totalPrice
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authJWT, async (req, res, next) => {
  try {
    const booking = await getById('roomBookings', req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.uid) return res.status(403).json({ message: 'You can only delete your own booking' });
    if (!canUserManageBooking(booking)) {
      return res.status(400).json({ message: 'This booking can no longer be deleted' });
    }

    const removed = await removeRecord('roomBookings', req.params.id);
    res.json({ message: 'Booking deleted', booking: removed });
  } catch (error) {
    next(error);
  }
});

router.get('/', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const bookings = await getCollection('roomBookings');
    bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/status',
  authJWT,
  requireRole('admin'),
  [body('status').isIn(['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'])],
  validate,
  async (req, res, next) => {
    try {
      const existing = await getById('roomBookings', req.params.id);
      if (!existing) return res.status(404).json({ message: 'Booking not found' });
      if (existing.status === req.body.status) return res.json(existing);

      const booking = await updateRecord('roomBookings', req.params.id, { status: req.body.status });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      try {
        await createNotifications([
          {
            scope: 'user',
            targetUserId: booking.userId,
            referenceType: 'roomBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'Room booking status updated',
            message: `Your room booking ${booking.bookingRef} is now ${booking.status}.`,
            metadata: {
              previousStatus: existing.status,
              status: booking.status,
              roomName: booking.roomName
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create room booking status notification', notificationError);
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
