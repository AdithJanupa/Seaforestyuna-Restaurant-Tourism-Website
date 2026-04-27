const express = require('express');
const { admin } = require('../config/firebase');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const normalizeUserRecord = (userRecord) => {
  const claims = userRecord.customClaims || {};
  const role = claims.role || (claims.admin ? 'admin' : 'user');
  const providers = Array.isArray(userRecord.providerData)
    ? userRecord.providerData.map((provider) => provider.providerId).filter(Boolean)
    : [];
  const joinedAt = userRecord.metadata?.creationTime || '';
  const lastLoginAt = userRecord.metadata?.lastSignInTime || '';

  return {
    uid: userRecord.uid,
    name: userRecord.displayName || '',
    email: userRecord.email || '',
    phone: userRecord.phoneNumber || '',
    role,
    disabled: Boolean(userRecord.disabled),
    emailVerified: Boolean(userRecord.emailVerified),
    providers,
    joinedAt,
    lastLoginAt,
    hasLoggedIn: Boolean(lastLoginAt)
  };
};

const listAllUsers = async (pageToken = undefined, collected = []) => {
  const page = await admin.auth().listUsers(1000, pageToken);
  collected.push(...page.users.map(normalizeUserRecord));

  if (page.pageToken) {
    return listAllUsers(page.pageToken, collected);
  }

  return collected;
};

router.get('/', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await listAllUsers();
    users.sort((left, right) => {
      const leftTime = new Date(left.lastLoginAt || left.joinedAt || 0).getTime();
      const rightTime = new Date(right.lastLoginAt || right.joinedAt || 0).getTime();
      return rightTime - leftTime;
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
