const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { db, getCollection, getById, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');
const { createNotifications } = require('../utils/notifications');
const { sendBoatBookingReceiptEmail } = require('../utils/mailer');

const router = express.Router();

const generateBookingRef = () => `BT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const USER_EDITABLE_STATUSES = new Set(['Pending', 'Confirmed']);

const canUserManageBooking = (booking) => USER_EDITABLE_STATUSES.has(String(booking?.status || 'Pending'));

const validateBoatBookingInput = async ({ boatId, date, timeSlot, guests, bookingIdToIgnore = null }) => {
  const boat = await getById('boats', boatId);
  if (!boat) {
    return { error: 'Boat ride not found', status: 404 };
  }

  if (boat.timeSlots && boat.timeSlots.length && !boat.timeSlots.includes(timeSlot)) {
    return { error: 'Invalid time slot for this boat ride' };
  }

  if (Number(guests) > Number(boat.maxCapacity || 0)) {
    return { error: 'Guest count exceeds boat capacity' };
  }

  const bookingDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) {
    return { error: 'Invalid date' };
  }

  const snapshot = await db
    .ref('boatBookings')
    .orderByChild('boatId')
    .equalTo(boatId)
    .once('value');

  const existing = Object.values(snapshot.val() || {});
  const conflict = existing.find((booking) => {
    if (booking.status === 'Cancelled') return false;
    if (bookingIdToIgnore && (booking._id === bookingIdToIgnore || booking.id === bookingIdToIgnore)) return false;
    return booking.date === date && booking.timeSlot === timeSlot;
  });

  if (conflict) {
    return { error: 'Selected time slot is already booked', status: 409 };
  }

  const totalPrice = Number((Number(boat.price || 0) * Number(guests)).toFixed(2));

  return {
    boat,
    totalPrice
  };
};

router.post(
  '/',
  authJWT,
  [
    body('boatId').notEmpty().withMessage('Boat id required'),
    body('date').notEmpty().withMessage('Date required'),
    body('timeSlot').notEmpty().withMessage('Time slot required'),
    body('guests').isInt({ min: 1 }).withMessage('Guest count required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { boatId, date, timeSlot, guests, specialNotes } = req.body;
      const result = await validateBoatBookingInput({ boatId, date, timeSlot, guests });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      const booking = await createRecord('boatBookings', {
        userId: req.user.uid,
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        boatId,
        boatName: result.boat.name || '',
        date,
        timeSlot,
        guests,
        specialNotes: specialNotes || '',
        status: 'Pending',
        bookingRef: generateBookingRef(),
        totalPrice: result.totalPrice
      });

      try {
        await createNotifications([
          {
            scope: 'admin',
            referenceType: 'boatBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'New boat booking created',
            message: `${booking.userName || booking.userEmail || 'A guest'} reserved ${booking.boatName || 'a boat ride'}.`,
            metadata: {
              status: booking.status,
              boatName: booking.boatName
            }
          },
          {
            scope: 'user',
            targetUserId: booking.userId,
            referenceType: 'boatBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'Boat booking received',
            message: `Your boat booking ${booking.bookingRef} for ${booking.boatName || 'your ride'} is now ${booking.status}.`,
            metadata: {
              status: booking.status,
              boatName: booking.boatName
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create boat booking notifications', notificationError);
      }

      sendBoatBookingReceiptEmail({
        booking,
        boat: result.boat
      })
        .then((mailResult) => {
          if (!mailResult?.sent) {
            console.warn(`Boat booking receipt email skipped for ${booking.bookingRef}: ${mailResult?.reason || 'unknown-reason'}`);
          }
        })
        .catch((mailError) => {
          console.error('Failed to send boat booking receipt email', mailError);
        });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/my', authJWT, async (req, res, next) => {
  try {
    const bookings = await getCollection('boatBookings');
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
    body('boatId').optional().notEmpty().withMessage('Ride plan required'),
    body('date').optional().notEmpty().withMessage('Date required'),
    body('timeSlot').optional().notEmpty().withMessage('Time slot required'),
    body('guests').optional().isInt({ min: 1 }).withMessage('Guest count required'),
    body('specialNotes').optional().isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      const booking = await getById('boatBookings', req.params.id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.userId !== req.user.uid) return res.status(403).json({ message: 'You can only edit your own booking' });
      if (!canUserManageBooking(booking)) {
        return res.status(400).json({ message: 'This booking can no longer be edited' });
      }

      const nextBoatId = req.body.boatId || booking.boatId;
      const nextDate = req.body.date || booking.date;
      const nextTimeSlot = req.body.timeSlot || booking.timeSlot;
      const nextGuests = req.body.guests !== undefined ? Number(req.body.guests) : Number(booking.guests);
      const nextSpecialNotes =
        Object.prototype.hasOwnProperty.call(req.body, 'specialNotes') ? req.body.specialNotes || '' : booking.specialNotes || '';

      const result = await validateBoatBookingInput({
        boatId: nextBoatId,
        date: nextDate,
        timeSlot: nextTimeSlot,
        guests: nextGuests,
        bookingIdToIgnore: req.params.id
      });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      const updated = await updateRecord('boatBookings', req.params.id, {
        boatId: nextBoatId,
        boatName: result.boat.name || booking.boatName || '',
        date: nextDate,
        timeSlot: nextTimeSlot,
        guests: nextGuests,
        specialNotes: nextSpecialNotes,
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
    const booking = await getById('boatBookings', req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.uid) return res.status(403).json({ message: 'You can only delete your own booking' });
    if (!canUserManageBooking(booking)) {
      return res.status(400).json({ message: 'This booking can no longer be deleted' });
    }

    const removed = await removeRecord('boatBookings', req.params.id);
    res.json({ message: 'Booking deleted', booking: removed });
  } catch (error) {
    next(error);
  }
});

router.get('/', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const bookings = await getCollection('boatBookings');
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
  [body('status').isIn(['Pending', 'Confirmed', 'Completed', 'Cancelled'])],
  validate,
  async (req, res, next) => {
    try {
      const existing = await getById('boatBookings', req.params.id);
      if (!existing) return res.status(404).json({ message: 'Booking not found' });
      if (existing.status === req.body.status) return res.json(existing);

      const booking = await updateRecord('boatBookings', req.params.id, { status: req.body.status });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      try {
        await createNotifications([
          {
            scope: 'user',
            targetUserId: booking.userId,
            referenceType: 'boatBooking',
            referenceId: booking._id,
            referenceLabel: booking.bookingRef,
            title: 'Boat booking status updated',
            message: `Your boat booking ${booking.bookingRef} is now ${booking.status}.`,
            metadata: {
              previousStatus: existing.status,
              status: booking.status,
              boatName: booking.boatName
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create boat booking status notification', notificationError);
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
