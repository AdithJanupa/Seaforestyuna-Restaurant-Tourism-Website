const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

dotenv.config({ path: path.join(__dirname, '.env') });
require('./config/firebase');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const roomRoutes = require('./routes/rooms');
const roomBookingRoutes = require('./routes/roomBookings');
const boatRoutes = require('./routes/boats');
const boatBookingRoutes = require('./routes/boatBookings');
const contentRoutes = require('./routes/content');
const contactRoutes = require('./routes/contact');
const inquiryRoutes = require('./routes/inquiries');
const notificationRoutes = require('./routes/notifications');
const ratingRoutes = require('./routes/ratings');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch (error) {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === 'null' ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        isLocalDevOrigin(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later.'
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-bookings', roomBookingRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/boat-bookings', boatBookingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
