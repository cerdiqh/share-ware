const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Rating = require('../models/Rating');
const Donation = require('../models/Donation');
const router = express.Router();

// Submit a rating for a donation
router.post('/', protect, async (req, res) => {
  try {
    const { donationId, stars, comment } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    // Ensure rater was requester and donation status is donated
    if (!donation.requestedBy || donation.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can rate this donation' });
    }
    if (donation.status !== 'donated') return res.status(400).json({ message: 'Donation not marked as donated yet' });

    // Prevent duplicate rating by same user for same donation
    const existing = await Rating.findOne({ donation: donationId, rater: req.user._id });
    if (existing) return res.status(400).json({ message: 'You have already rated this donation' });

    const rating = new Rating({ donation: donationId, rater: req.user._id, donor: donation.donor, stars, comment });
    const saved = await rating.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get ratings for a donation
router.get('/donation/:donationId', async (req, res) => {
  try {
    const ratings = await Rating.find({ donation: req.params.donationId }).populate('rater', 'fullname');
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get ratings and average for a donor
router.get('/donor/:donorId', async (req, res) => {
  try {
    const ratings = await Rating.find({ donor: req.params.donorId }).populate('rater', 'fullname');
    const avg = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) : 0;
    res.json({ average: avg, count: ratings.length, ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
