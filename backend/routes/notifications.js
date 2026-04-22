const express = require('express');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const { getById } = require('../utils/firebaseDb');
const {
  NOTIFICATION_SCOPES,
  listAdminNotifications,
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../utils/notifications');

const router = express.Router();

router.get('/admin', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const notifications = await listAdminNotifications();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.get('/my', authJWT, async (req, res, next) => {
  try {
    const notifications = await listUserNotifications(req.user.uid);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', authJWT, async (req, res, next) => {
  try {
    const requestedScope = String(req.query.scope || NOTIFICATION_SCOPES.user).toLowerCase();
    const scope = requestedScope === NOTIFICATION_SCOPES.admin ? NOTIFICATION_SCOPES.admin : NOTIFICATION_SCOPES.user;

    if (scope === NOTIFICATION_SCOPES.admin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await markAllNotificationsRead({
      scope,
      userId: req.user.uid
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authJWT, async (req, res, next) => {
  try {
    const notification = await getById('notifications', req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.scope === NOTIFICATION_SCOPES.admin) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
    } else if (notification.targetUserId !== req.user.uid) {
      return res.status(403).json({ message: 'You can only manage your own notifications' });
    }

    const updated = await markNotificationRead(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
