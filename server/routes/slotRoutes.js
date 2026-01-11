const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const PickupSlot = require('../models/PickupSlot');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const router = express.Router();

// Propose a pickup slot for a donation (by requester)
// POST /api/slots/propose
router.post('/propose', protect, async (req, res) => {
  try {
    const { donationId, proposedTime, message } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.donor.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Donor cannot propose a pickup for their own item' });
    }

    const slot = new PickupSlot({
      donation: donationId,
      proposer: req.user._id,
      donor: donation.donor,
      proposedTime: new Date(proposedTime),
      message,
    });
    const saved = await slot.save();

    // create notification for donor
    try {
      await Notification.create({
        user: donation.donor,
        type: 'pickup_proposed',
        title: 'Pickup proposed',
        body: `A pickup time was proposed for ${donation.title}`,
        link: `/donations/${donation._id}`,
        meta: { donationId: donation._id, slotId: saved._id },
      });
    } catch (nerr) { console.error('notif err', nerr); }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get slots for a donation (donor or requester)
// GET /api/slots/donation/:donationId
router.get('/donation/:donationId', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    // allow only donor or participants
    if (![donation.donor.toString(), (donation.requestedBy && donation.requestedBy.toString())].includes(req.user._id.toString())) {
      // still allow donor to see
      if (donation.donor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    }
    const slots = await PickupSlot.find({ donation: donation._id }).populate('proposer', 'fullname email').sort({ createdAt: -1 });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Donor accepts a proposed slot
// PUT /api/slots/:id/accept
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const slot = await PickupSlot.findById(req.params.id).populate('donation');
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.donor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    slot.status = 'accepted';
    await slot.save();

    try {
      await Notification.create({
        user: slot.proposer,
        type: 'pickup_accepted',
        title: 'Pickup accepted',
        body: `Your proposed pickup for ${slot.donation.title} was accepted.`,
        link: `/donations/${slot.donation._id}`,
        meta: { slotId: slot._id },
      });
    } catch (nerr) { console.error('notif err', nerr); }

    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Donor or requester confirm pickup (mark confirmed)
// PUT /api/slots/:id/confirm
router.put('/:id/confirm', protect, async (req, res) => {
  try {
    const slot = await PickupSlot.findById(req.params.id).populate('donation');
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    // either donor or proposer can confirm
    const uid = req.user._id.toString();
    if (slot.donor.toString() !== uid && slot.proposer.toString() !== uid) return res.status(403).json({ message: 'Not authorized' });
    slot.status = 'confirmed';
    await slot.save();

    try {
      await Notification.create({
        user: slot.proposer,
        type: 'pickup_confirmed',
        title: 'Pickup confirmed',
        body: `Pickup for ${slot.donation.title} is confirmed.`,
        link: `/donations/${slot.donation._id}`,
        meta: { slotId: slot._id },
      });
    } catch (nerr) { console.error('notif err', nerr); }

    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Cancel a slot (by proposer or donor)
// DELETE /api/slots/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const slot = await PickupSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    const uid = req.user._id.toString();
    if (slot.donor.toString() !== uid && slot.proposer.toString() !== uid) return res.status(403).json({ message: 'Not authorized' });
    slot.status = 'cancelled';
    await slot.save();
    res.json({ message: 'Cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
