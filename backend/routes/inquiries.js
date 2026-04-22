const express = require('express');
const { body } = require('express-validator');
const authJWT = require('../middleware/authJWT');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { getCollection, createRecord, updateRecord, removeRecord } = require('../utils/firebaseDb');
const { createNotifications } = require('../utils/notifications');

const router = express.Router();

const INQUIRY_STATUSES = ['New', 'In Progress', 'Replied', 'Closed'];
const INQUIRY_TYPES = ['General Inquiry', 'Dining', 'Stay', 'Boat Ride', 'Private Event', 'Website'];

const buildInquiryPayload = (body, { isAdmin = false } = {}) => ({
  name: String(body.name || '').trim(),
  email: String(body.email || '').trim(),
  phone: String(body.phone || '').trim(),
  subject: String(body.subject || '').trim(),
  type: INQUIRY_TYPES.includes(body.type) ? body.type : 'General Inquiry',
  source: String(body.source || (isAdmin ? 'Admin Dashboard' : 'Contact Page')).trim(),
  message: String(body.message || '').trim(),
  status: isAdmin && INQUIRY_STATUSES.includes(body.status) ? body.status : 'New'
});

const inquiryValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('phone').optional().isString(),
  body('source').optional().isString(),
  body('type').optional().isIn(INQUIRY_TYPES).withMessage('Invalid inquiry type'),
  body('status').optional().isIn(INQUIRY_STATUSES).withMessage('Invalid status')
];

router.post('/', inquiryValidators, validate, async (req, res, next) => {
  try {
    const inquiry = await createRecord('inquiries', buildInquiryPayload(req.body));
    try {
      await createNotifications([
        {
          scope: 'admin',
          referenceType: 'inquiry',
          referenceId: inquiry._id,
          referenceLabel: inquiry.subject || inquiry._id,
          title: 'New inquiry received',
          message: `${inquiry.name || inquiry.email || 'A guest'} submitted "${inquiry.subject || 'New inquiry'}".`,
          metadata: {
            status: inquiry.status,
            source: inquiry.source,
            type: inquiry.type
          }
        }
      ]);
    } catch (notificationError) {
      console.error('Failed to create inquiry notification', notificationError);
    }
    res.status(201).json({ message: 'Inquiry received', data: inquiry });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const inquiries = await getCollection('inquiries');
    inquiries.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    res.json(inquiries);
  } catch (error) {
    next(error);
  }
});

router.post('/admin', authJWT, requireRole('admin'), inquiryValidators, validate, async (req, res, next) => {
  try {
    const inquiry = await createRecord('inquiries', buildInquiryPayload(req.body, { isAdmin: true }));
    res.status(201).json(inquiry);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authJWT, requireRole('admin'), inquiryValidators, validate, async (req, res, next) => {
  try {
    const updated = await updateRecord('inquiries', req.params.id, buildInquiryPayload(req.body, { isAdmin: true }));
    if (!updated) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeRecord('inquiries', req.params.id);
    if (!removed) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
