const express = require('express');
const { body } = require('express-validator');
const { admin } = require('../config/firebase');
const validate = require('../middleware/validate');
const authJWT = require('../middleware/authJWT');

const router = express.Router();

const createUserPayload = (user, role = 'user') => ({
  uid: user.uid,
  name: user.displayName || '',
  email: user.email || '',
  role
});

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const user = await admin.auth().createUser({
        email,
        password,
        displayName: name
      });
      const token = await admin.auth().createCustomToken(user.uid, { role: 'user' });
      res.status(201).json({ token, user: createUserPayload(user, 'user') });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'Email already in use' });
      }
      next(error);
    }
  }
);

router.get('/me', authJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
