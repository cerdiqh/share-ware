const mongoose = require('mongoose');

// This is the blueprint for a Donation
const donationSchema = new mongoose.Schema({
  // This creates a link to the User model.
  // It tells us which user created this donation.
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This 'ref' must match the name we gave our User model ('User')
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true, // Removes whitespace from the beginning and end
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Furniture', 'Clothing', 'Books', 'Other'],
    default: 'Other',
  },
  // --- ADD THIS NEW FIELD ---
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair'],
  },
  // --- NEW: who requested this donation (optional) ---
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // Primary legacy image path (kept for backward compatibility)
  imagePath: {
    type: String,
    required: false,
  },
  // Support multiple images with optional thumbnails
  images: [{
    image: { type: String },
    thumbnail: { type: String },
  }],
  status: {
    type: String,
    required: true,
    enum: ['available', 'requested', 'approved', 'donated'], // Status must be one of these
    default: 'available', // The default status when a new donation is created
  },
  // When a donor approves a request, record the timestamp
  approvedAt: {
    type: Date,
    required: false,
  },
  // When a requester cancels their request
  canceledAt: {
    type: Date,
    required: false,
  },
  // When a donor rejects a request
  rejectedAt: {
    type: Date,
    required: false,
  },
  // When the donation is marked as picked up / completed
  completedAt: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Create the model and export it
const Donation = mongoose.model('Donation', donationSchema);
module.exports = Donation;
