const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const items = await getCollection('menuItems');
    const filtered = req.query.category
      ? items.filter((item) => item.category === req.query.category)
      : items;
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authJWT,
  requireRole('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('image').optional().isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await createRecord('menuItems', req.body);
      res.status(201).json(item);
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
    body('name').optional().notEmpty(),
    body('price').optional().isFloat({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const updated = await updateRecord('menuItems', req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'Menu item not found' });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeRecord('menuItems', req.params.id);
    if (!removed) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
