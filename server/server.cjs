// server.cjs - CommonJS entrypoint
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const userRoutes = require('./routes/userRoutes.js');
const donationRoutes = require('./routes/donationRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');
const slotRoutes = require('./routes/slotRoutes.js');
const ratingRoutes = require('./routes/ratingRoutes.js');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Logging
app.use(morgan('dev'));

// Body parser
app.use(express.json());

// CORS - allow client origin configured via env when provided
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: clientOrigin, optionsSuccessStatus: 200 }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
// Configure trust proxy. Set to true so express-rate-limit can read X-Forwarded-For when present.
// Default to trusting first proxy. To explicitly disable, set TRUST_PROXY=false.
if (process.env.TRUST_PROXY === 'false') {
  console.warn('TRUST_PROXY is false — not trusting proxy headers');
} else {
  app.set('trust proxy', 1);
}

app.use(limiter);

mongoose.set('strictQuery', true);
mongoConnect();

async function mongoConnect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/ratings', ratingRoutes);

const appDir = path.resolve();
app.use('/uploads', express.static(path.join(appDir, '/uploads')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
