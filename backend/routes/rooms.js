const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rooms = await getCollection('rooms');
    rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authJWT,
  requireRole('admin'),
  [
    body('name').notEmpty(),
    body('description').notEmpty(),
    body('pricePerNight').isFloat({ min: 0 }),
    body('capacity').isInt({ min: 1 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const room = await createRecord('rooms', req.body);
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authJWT,
  requireRole('admin'),
  [
    body('pricePerNight').optional().isFloat({ min: 0 }),
    body('capacity').optional().isInt({ min: 1 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const room = await updateRecord('rooms', req.params.id, req.body);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const room = await removeRecord('rooms', req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
