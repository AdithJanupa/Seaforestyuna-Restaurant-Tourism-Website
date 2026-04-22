const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const boats = await getCollection('boats');
    boats.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(boats);
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
    body('durationHours').isFloat({ min: 0.5 }),
    body('maxCapacity').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const boat = await createRecord('boats', req.body);
      res.status(201).json(boat);
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
    body('durationHours').optional().isFloat({ min: 0.5 }),
    body('maxCapacity').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const boat = await updateRecord('boats', req.params.id, req.body);
      if (!boat) return res.status(404).json({ message: 'Boat ride not found' });
      res.json(boat);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const boat = await removeRecord('boats', req.params.id);
    if (!boat) return res.status(404).json({ message: 'Boat ride not found' });
    res.json({ message: 'Boat ride removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
