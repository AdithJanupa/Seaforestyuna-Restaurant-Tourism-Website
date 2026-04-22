const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { db, getCollection } = require('../utils/firebaseDb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const blocks = await getCollection('contentBlocks');
    res.json(blocks);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/',
  authJWT,
  requireRole('admin'),
  [
    body('blocks').optional().isArray(),
    body('key').optional().isString(),
    body('title').optional().isString(),
    body('body').optional().isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      let blocks = req.body.blocks;
      if (!blocks) {
        blocks = [{ key: req.body.key, title: req.body.title, body: req.body.body }];
      }

      const results = [];
      for (const block of blocks) {
        if (!block.key) continue;
        const ref = db.ref(`contentBlocks/${block.key}`);
        const payload = {
          id: block.key,
          _id: block.key,
          key: block.key,
          title: block.title || '',
          body: block.body || '',
          updatedAt: Date.now()
        };
        await ref.update(payload);
        results.push(payload);
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
