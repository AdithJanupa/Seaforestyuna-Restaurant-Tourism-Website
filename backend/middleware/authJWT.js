const { admin } = require('../config/firebase');

const authJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.displayName || '',
      role: decoded.role || (decoded.admin ? 'admin' : 'user')
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authJWT;
