const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');
const Donation = require('../models/Donation');

const router = express.Router();

// Create or get conversation for a donation between two users
router.post('/for-donation/:donationId', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId).select('donor');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const other = donation.donor.toString() === req.user._id.toString() ? null : donation.donor;
    if (!other && req.user._id.toString() === donation.donor.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // participants: requester and donor
    const participants = [req.user._id, donation.donor].map(id => id.toString());
    // try find
    let conv = await Conversation.findOne({ donation: donation._id, participants: { $all: participants } });
    if (!conv) {
      conv = new Conversation({ participants, donation: donation._id, messages: [] });
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get conversations for current user
router.get('/', protect, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'fullname email')
      .populate('donation', 'title imagePath');
    res.json(convs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get single conversation by id
router.get('/:id', protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id)
      .populate('participants', 'fullname email')
      .populate('donation', 'title imagePath');
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!conv.participants.map(p => p._id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Post a message to a conversation
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!conv.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not a participant' });
    }
    const { text } = req.body;
    const message = { sender: req.user._id, text };
    conv.messages.push(message);
    await conv.save();
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
