const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord, updateRecord, getById, removeRecord } = require('../utils/firebaseDb');
const { createNotifications } = require('../utils/notifications');
const { sendOrderReceiptEmail } = require('../utils/mailer');
const { getMenuAdditions } = require('../utils/menuAdditions');

const router = express.Router();

const generateOrderNumber = () => `SF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

router.post(
  '/',
  authJWT,
  [
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.menuItem').notEmpty().withMessage('Menu item id required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('orderType').isIn(['pickup', 'dine-in', 'delivery']).withMessage('Invalid order type'),
    body('scheduledDate').notEmpty().withMessage('Date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { items, orderType, scheduledDate, timeSlot, notes, address, phone, guestCount, tablePreference } = req.body;

      if (orderType === 'delivery' && (!address || !phone)) {
        return res.status(400).json({ message: 'Delivery requires address and phone' });
      }
      if (orderType === 'dine-in' && !guestCount) {
        return res.status(400).json({ message: 'Dine-in requires guest count' });
      }

      const menuItems = await getCollection('menuItems');
      const menuMap = new Map([...getMenuAdditions(), ...menuItems].map((item) => [item.id || item._id, item]));

      const orderItems = items.map((item) => {
        const menuItem = menuMap.get(item.menuItem);
        if (!menuItem) return null;
        return {
          menuItem: menuItem.id || menuItem._id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: item.quantity
        };
      });

      if (orderItems.some((item) => !item)) {
        return res.status(400).json({ message: 'One or more menu items are invalid' });
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = Number((subtotal * 0.1).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      const scheduledAt = new Date(`${scheduledDate}T${timeSlot}:00`);
      if (isNaN(scheduledAt.getTime())) {
        return res.status(400).json({ message: 'Invalid schedule date or time' });
      }

      const order = await createRecord('orders', {
        userId: req.user.uid,
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        items: orderItems,
        orderType,
        scheduledAt: scheduledAt.toISOString(),
        timeSlot,
        notes: notes || '',
        address: address || '',
        phone: phone || '',
        guestCount: guestCount || undefined,
        tablePreference: tablePreference || '',
        status: 'Pending',
        orderNumber: generateOrderNumber(),
        subtotal,
        tax,
        total
      });

      try {
        await createNotifications([
          {
            scope: 'admin',
            referenceType: 'order',
            referenceId: order._id,
            referenceLabel: order.orderNumber,
            title: 'New food order placed',
            message: `${order.userName || order.userEmail || 'A guest'} placed ${order.orderNumber} for ${order.orderType}.`,
            metadata: {
              status: order.status,
              orderType: order.orderType
            }
          },
          {
            scope: 'user',
            targetUserId: order.userId,
            referenceType: 'order',
            referenceId: order._id,
            referenceLabel: order.orderNumber,
            title: 'Order received',
            message: `Your order ${order.orderNumber} has been received and is now ${order.status}.`,
            metadata: {
              status: order.status,
              orderType: order.orderType
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create order notifications', notificationError);
      }

      sendOrderReceiptEmail(order)
        .then((result) => {
          if (!result?.sent) {
            console.warn(`Order receipt email skipped for ${order.orderNumber}: ${result?.reason || 'unknown-reason'}`);
          }
        })
        .catch((mailError) => {
          console.error('Failed to send order receipt email', mailError);
        });

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/my', authJWT, async (req, res, next) => {
  try {
    const orders = await getCollection('orders');
    const filtered = orders.filter((order) => order.userId === req.user.uid);
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.get('/', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const orders = await getCollection('orders');
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/status',
  authJWT,
  requireRole('admin'),
  [body('status').isIn(['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'])],
  validate,
  async (req, res, next) => {
    try {
      const existing = await getById('orders', req.params.id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === req.body.status) return res.json(existing);

      const updated = await updateRecord('orders', req.params.id, { status: req.body.status });
      if (!updated) return res.status(404).json({ message: 'Order not found' });

      try {
        await createNotifications([
          {
            scope: 'user',
            targetUserId: updated.userId,
            referenceType: 'order',
            referenceId: updated._id,
            referenceLabel: updated.orderNumber,
            title: 'Order status updated',
            message: `Your order ${updated.orderNumber} is now ${updated.status}.`,
            metadata: {
              previousStatus: existing.status,
              status: updated.status
            }
          }
        ]);
      } catch (notificationError) {
        console.error('Failed to create order status notification', notificationError);
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeRecord('orders', req.params.id);
    if (!removed) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted', order: removed });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
