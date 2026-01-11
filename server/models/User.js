const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This is the blueprint for a User
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Every email must be unique
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['donor', 'recipient'], // The role must be one of these two values
  },
  // Optional contact fields
  phone: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  // Saved/bookmarked donation ids for quick access
  savedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }],
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// IMPORTANT: This function runs *before* a user document is saved
// It automatically hashes the password for security
userSchema.pre('save', async function (next) {
  // Only run this function if the password was actually modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash the password with a cost factor of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create the model from the schema and export it
const User = mongoose.model('User', userSchema);
module.exports = User;
