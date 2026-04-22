const { db, createRecord, getCollection, getById, updateRecord } = require('./firebaseDb');

const NOTIFICATION_SCOPES = {
  admin: 'admin',
  user: 'user'
};

const sortNotifications = (items) => [...items].sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0));

const createNotification = async (payload) =>
  createRecord('notifications', {
    scope: payload.scope === NOTIFICATION_SCOPES.admin ? NOTIFICATION_SCOPES.admin : NOTIFICATION_SCOPES.user,
    targetUserId: payload.scope === NOTIFICATION_SCOPES.user ? String(payload.targetUserId || '').trim() : '',
    referenceType: String(payload.referenceType || '').trim(),
    referenceId: String(payload.referenceId || '').trim(),
    referenceLabel: String(payload.referenceLabel || '').trim(),
    title: String(payload.title || '').trim(),
    message: String(payload.message || '').trim(),
    isRead: false,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  });

const createNotifications = async (payloads = []) => Promise.all(payloads.map((payload) => createNotification(payload)));

const listAdminNotifications = async () => {
  const notifications = await getCollection('notifications');
  return sortNotifications(notifications.filter((notification) => notification.scope === NOTIFICATION_SCOPES.admin));
};

const listUserNotifications = async (userId) => {
  const notifications = await getCollection('notifications');
  return sortNotifications(
    notifications.filter(
      (notification) => notification.scope === NOTIFICATION_SCOPES.user && notification.targetUserId === userId
    )
  );
};

const markNotificationRead = async (id) => {
  const existing = await getById('notifications', id);
  if (!existing) return null;
  if (existing.isRead) return existing;
  return updateRecord('notifications', id, { isRead: true });
};

const markAllNotificationsRead = async ({ scope, userId }) => {
  const snapshot = await db.ref('notifications').once('value');
  const notifications = Object.values(snapshot.val() || {});

  const matches = notifications.filter((notification) => {
    if (scope === NOTIFICATION_SCOPES.admin) {
      return notification.scope === NOTIFICATION_SCOPES.admin && !notification.isRead;
    }
    return notification.scope === NOTIFICATION_SCOPES.user && notification.targetUserId === userId && !notification.isRead;
  });

  if (!matches.length) {
    return { updatedCount: 0 };
  }

  await Promise.all(matches.map((notification) => updateRecord('notifications', notification._id || notification.id, { isRead: true })));

  return { updatedCount: matches.length };
};

module.exports = {
  NOTIFICATION_SCOPES,
  createNotification,
  createNotifications,
  listAdminNotifications,
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
