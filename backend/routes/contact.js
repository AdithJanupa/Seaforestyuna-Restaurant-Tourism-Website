const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord } = require('../utils/firebaseDb');

const router = express.Router();

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const message = await createRecord('contactMessages', req.body);
      res.status(201).json({ message: 'Message received', data: message });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const messages = await getCollection('contactMessages');
    messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
