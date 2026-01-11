const mongoose = require('mongoose');

const pickupSlotSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // requester
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proposedAt: { type: Date, default: Date.now },
  proposedTime: { type: Date, required: true },
  message: { type: String },
  status: { type: String, enum: ['proposed','accepted','confirmed','cancelled'], default: 'proposed' },
}, { timestamps: true });

module.exports = mongoose.model('PickupSlot', pickupSlotSchema);
