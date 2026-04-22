const express = require('express');
const { body } = require('express-validator');
const { admin } = require('../config/firebase');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, getById, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');

const router = express.Router();

const RATING_STATUSES = ['Pending', 'Published', 'Hidden'];
const VISIT_TYPES = ['Dining', 'Stay', 'Boat Ride', 'Website', 'General'];

const optionalAuthJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.displayName || '',
      role: decoded.role || (decoded.admin ? 'admin' : 'user')
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

const isRatingOwner = (rating, user) => {
  if (!rating || !user) return false;
  if (rating.userId) return rating.userId === user.uid;
  return Boolean(rating.email && user.email && String(rating.email).toLowerCase() === String(user.email).toLowerCase());
};

const buildRatingPayload = (body, { mode = 'public', user = null, existing = null } = {}) => ({
  name: String(body.name || existing?.name || user?.name || '').trim(),
  email: String(body.email || existing?.email || user?.email || '').trim(),
  title: String(body.title || '').trim(),
  visitType: VISIT_TYPES.includes(body.visitType) ? body.visitType : 'General',
  rating: Number(body.rating) || 0,
  message: String(body.message || '').trim(),
  source: String(body.source || existing?.source || (mode === 'admin' ? 'Admin Dashboard' : 'Ratings Page')).trim(),
  status:
    mode === 'admin'
      ? RATING_STATUSES.includes(body.status)
        ? body.status
        : existing?.status || 'Published'
      : existing?.status === 'Hidden'
        ? 'Hidden'
        : 'Published',
  isFeatured: mode === 'admin' ? Boolean(body.isFeatured) : Boolean(existing?.isFeatured),
  userId: user?.uid || existing?.userId || '',
  ownerEmail: String(existing?.ownerEmail || user?.email || body.email || '').trim()
});

const sanitizeRatingForPublic = (rating, user) => {
  const canManage = isRatingOwner(rating, user);

  return {
    id: rating.id || rating._id,
    _id: rating._id || rating.id,
    name: rating.name,
    email: canManage ? rating.email : '',
    title: rating.title,
    visitType: rating.visitType,
    rating: rating.rating,
    message: rating.message,
    isFeatured: Boolean(rating.isFeatured),
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
    canManage
  };
};

const ratingValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('title').notEmpty().withMessage('Feedback title is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Star rating must be between 1 and 5'),
  body('message').notEmpty().withMessage('Feedback message is required'),
  body('visitType').optional().isIn(VISIT_TYPES).withMessage('Invalid visit type'),
  body('source').optional().isString(),
  body('status').optional().isIn(RATING_STATUSES).withMessage('Invalid rating status'),
  body('isFeatured').optional().isBoolean().withMessage('Featured flag must be true or false')
];

const ratingVisibilityValidators = [body('status').isIn(['Published', 'Hidden']).withMessage('Invalid visibility status')];

router.get('/', optionalAuthJWT, async (req, res, next) => {
  try {
    const ratings = await getCollection('ratings');
    const published = ratings
      .filter((rating) => rating.status === 'Published')
      .sort((a, b) => {
        const featuredDelta = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
        if (featuredDelta !== 0) return featuredDelta;
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      })
      .map((rating) => sanitizeRatingForPublic(rating, req.user));
    res.json(published);
  } catch (error) {
    next(error);
  }
});

router.post('/', optionalAuthJWT, ratingValidators, validate, async (req, res, next) => {
  try {
    const rating = await createRecord('ratings', buildRatingPayload(req.body, { user: req.user }));
    res.status(201).json({ message: 'Rating published successfully', data: sanitizeRatingForPublic(rating, req.user) });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const ratings = await getCollection('ratings');
    ratings.sort((a, b) => {
      const featuredDelta = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      if (featuredDelta !== 0) return featuredDelta;
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
    res.json(ratings);
  } catch (error) {
    next(error);
  }
});

router.post('/admin', authJWT, requireRole('admin'), ratingValidators, validate, async (req, res, next) => {
  return res.status(403).json({ message: 'Admin cannot create ratings from the dashboard' });
});

router.patch('/:id/visibility', authJWT, requireRole('admin'), ratingVisibilityValidators, validate, async (req, res, next) => {
  try {
    const existing = await getById('ratings', req.params.id);
    if (!existing) return res.status(404).json({ message: 'Rating not found' });

    const updated = await updateRecord('ratings', req.params.id, {
      status: req.body.status,
      isFeatured: existing.isFeatured
    });
    if (!updated) return res.status(404).json({ message: 'Rating not found' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authJWT, ratingValidators, validate, async (req, res, next) => {
  try {
    const existing = await getById('ratings', req.params.id);
    if (!existing) return res.status(404).json({ message: 'Rating not found' });
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admin cannot edit rating details' });
    }
    if (!isRatingOwner(existing, req.user)) {
      return res.status(403).json({ message: 'You can only edit your own ratings' });
    }

    const updated = await updateRecord('ratings', req.params.id, buildRatingPayload(req.body, { user: req.user, existing }));
    res.json(sanitizeRatingForPublic(updated, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authJWT, async (req, res, next) => {
  try {
    const existing = await getById('ratings', req.params.id);
    if (!existing) return res.status(404).json({ message: 'Rating not found' });

    if (req.user.role !== 'admin' && !isRatingOwner(existing, req.user)) {
      return res.status(403).json({ message: 'You can only delete your own ratings' });
    }

    const removed = await removeRecord('ratings', req.params.id);
    if (!removed) return res.status(404).json({ message: 'Rating not found' });
    res.json({ message: 'Rating deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
