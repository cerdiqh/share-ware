const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/authMiddleware.js'); // Import our security guard
const Donation = require('../models/Donation.js'); // Import our Donation model
const User = require('../models/User.js');
const Notification = require('../models/Notification.js');
const mailer = require('../utils/mailer');
const logger = require('../logger');

const router = express.Router();

// === Endpoint: Create a new donation ===
// @route   POST /api/donations
// @desc    Creates a new donation item
// @access  Private (because we use the 'protect' middleware)

// === Endpoint: Get all available donations ===
// @route   GET /api/donations
// @desc    Fetches all donations with the status 'available'
// @access  Public
// === Endpoint: Get all available donations ===
// @route   GET /api/donations
// @desc    Fetches all donations with the status 'available'
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Support simple search and filters via query params
    const search = req.query.search ? req.query.search.toString().trim() : '';
    const category = req.query.category ? req.query.category.toString().trim() : '';
    const condition = req.query.condition ? req.query.condition.toString().trim() : '';

    const query = { status: 'available' };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const donations = await Donation.find(query)
      .populate('donor', 'fullname email')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Get donations for the logged-in user ===
// @route   GET /api/donations/mydonations
// @desc    Fetches all donations created by the logged-in user
// @access  Private
router.get('/mydonations', protect, async (req, res) => {
  try {
    // Find all donations where the 'donor' field matches the logged-in user's ID
    const donations = await Donation.find({ donor: req.user._id })
      .populate('requestedBy', 'fullname email')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Get items requested by the logged-in user ===
// @route   GET /api/donations/myrequests
// @desc    Fetches all donations requested by the logged-in user
// @access  Private
router.get('/myrequests', protect, async (req, res) => {
  try {
    const requestedDonations = await Donation.find({ requestedBy: req.user._id })
      .populate('donor', 'fullname')
      .sort({ updatedAt: -1 });

    res.json(requestedDonations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.post('/', protect, async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    category: Joi.string().valid('Electronics','Furniture','Clothing','Books','Other').required(),
    condition: Joi.string().valid('New','Like New','Good','Fair').required(),
    imagePath: Joi.string().allow('', null),
  });

  try {
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { title, description, category, condition, imagePath } = value;

    // 2. Create a new donation instance
    const donation = new Donation({
      title,
      description,
      category,
      condition,
      imagePath,
      donor: req.user._id,
    });

    // 3. Save the new donation to the database
    const createdDonation = await donation.save();
    logger.info('Donation created: %s by %s', createdDonation._id, req.user._id);

    // 4. Send back the newly created donation
    res.status(201).json(createdDonation);
  } catch (err) {
    logger.error('Donation creation error: %o', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// === Endpoint: Request a donation ===
// @route   PUT /api/donations/:id/request
// @desc    Updates a donation's status to 'requested'
// @access  Private
router.put('/:id/request', protect, async (req, res) => {
  try {
    // First, find the donation by its ID from the URL parameter
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if the donation is still available
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Donation is no longer available' });
    }

    // Update the status to 'requested'
    donation.status = 'requested';

    // Track who requested this donation
    donation.requestedBy = req.user._id;

    // Save the updated donation
    const updatedDonation = await donation.save();

    // Notify donor by email if available
    try {
      const donor = await User.findById(updatedDonation.donor).select('email fullname');
      if (donor && donor.email) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@share-wear.local',
          to: donor.email,
          subject: 'Your item has been requested',
          text: `Hi ${donor.fullname || 'there'},\n\nYour donation "${updatedDonation.title}" has been requested by a user. Please check your dashboard.`,
        });
        logger.info('Notification sent to donor %s for donation %s', donor.email, updatedDonation._id);
          try {
            await Notification.create({
              user: donor._id,
              type: 'request',
              title: 'Item requested',
              body: `Your donation \"${updatedDonation.title}\" was requested.`,
              link: `/donations/${updatedDonation._id}`,
              meta: { donationId: updatedDonation._id },
            });
          } catch (nErr) {
            logger.error('Failed to create notification record for donor: %o', nErr);
          }
      }
    } catch (notifyErr) {
      logger.error('Failed to send notification: %o', notifyErr);
    }

    res.json(updatedDonation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Approve a requested donation ===
// @route   PUT /api/donations/:id/approve
// @desc    Donor approves a pending request
// @access  Private (donor only)
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    // Only the donor who created the donation can approve
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve this donation' });
    }

    if (!donation.requestedBy) {
      return res.status(400).json({ message: 'No requester found for this donation' });
    }

    donation.status = 'approved';
    donation.approvedAt = new Date();

    const approved = await donation.save();

    // Notify requester
    try {
      const requester = await User.findById(approved.requestedBy).select('email fullname');
      if (requester && requester.email) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@share-wear.local',
          to: requester.email,
          subject: 'Your request was approved',
          text: `Hi ${requester.fullname || 'there'},\n\nYour request for "${approved.title}" has been approved by the donor. Please contact them to arrange pickup.`,
        });
        try {
          await Notification.create({
            user: requester._id,
            type: 'approval',
            title: 'Request approved',
            body: `Your request for \"${approved.title}\" was approved.`,
            link: `/donations/${approved._id}`,
            meta: { donationId: approved._id },
          });
        } catch (nErr) {
          logger.error('Failed to create notification record for requester: %o', nErr);
        }
      }
    } catch (notifyErr) {
      logger.error('Failed to notify requester: %o', notifyErr);
    }

    res.json(approved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Get donation details ===
// @route   GET /api/donations/:id
// @desc    Fetch a single donation with donor and requester info
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'fullname email')
      .populate('requestedBy', 'fullname email');

    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Cancel a request (by requester) ===
// @route   PUT /api/donations/:id/cancel
// @access  Private (requester)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (!donation.requestedBy || donation.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    // Reset request fields
    donation.requestedBy = undefined;
    donation.status = 'available';
    donation.canceledAt = new Date();
    donation.approvedAt = undefined;

    const updated = await donation.save();

    // Notify donor
    try {
      const donor = await User.findById(updated.donor).select('email fullname');
      if (donor && donor.email) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@share-wear.local',
          to: donor.email,
          subject: 'A request was cancelled',
          text: `Hi ${donor.fullname || 'there'},\n\nThe request for your donation "${updated.title}" was cancelled by the requester. The item is available again.`,
        });
        try {
          await Notification.create({
            user: donor._id,
            type: 'cancellation',
            title: 'Request cancelled',
            body: `The request for \"${updated.title}\" was cancelled by the requester.`,
            link: `/donations/${updated._id}`,
            meta: { donationId: updated._id },
          });
        } catch (nErr) {
          logger.error('Failed to create notification record for donor (cancel): %o', nErr);
        }
      }
    } catch (notifyErr) {
      logger.error('Failed to notify donor of cancellation: %o', notifyErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Reject a request (by donor) ===
// @route   PUT /api/donations/:id/reject
// @access  Private (donor)
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (!donation.requestedBy) {
      return res.status(400).json({ message: 'No active request to reject' });
    }

    const requesterId = donation.requestedBy;
    donation.requestedBy = undefined;
    donation.status = 'available';
    donation.rejectedAt = new Date();
    donation.approvedAt = undefined;

    const updated = await donation.save();

    // Notify requester
    try {
      const requester = await User.findById(requesterId).select('email fullname');
      if (requester && requester.email) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@share-wear.local',
          to: requester.email,
          subject: 'Your request was rejected',
          text: `Hi ${requester.fullname || 'there'},\n\nUnfortunately your request for "${updated.title}" was rejected by the donor.`,
        });
        try {
          await Notification.create({
            user: requester._id,
            type: 'rejection',
            title: 'Request rejected',
            body: `Your request for \"${updated.title}\" was rejected by the donor.`,
            link: `/donations/${updated._id}`,
            meta: { donationId: updated._id },
          });
        } catch (nErr) {
          logger.error('Failed to create notification record for requester (reject): %o', nErr);
        }
      }
    } catch (notifyErr) {
      logger.error('Failed to notify requester of rejection: %o', notifyErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Mark donation as completed/picked-up ===
// @route   PUT /api/donations/:id/complete
// @access  Private (donor)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this donation' });
    }

    donation.status = 'donated';
    donation.completedAt = new Date();

    const updated = await donation.save();

    // Notify requester
    try {
      const requester = await User.findById(updated.requestedBy).select('email fullname');
      if (requester && requester.email) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@share-wear.local',
          to: requester.email,
          subject: 'Your donation has been marked as picked up',
          text: `Hi ${requester.fullname || 'there'},\n\nThe donor has marked "${updated.title}" as picked up/donated. Thank you for using Share-Wear.`,
        });
        try {
          await Notification.create({
            user: requester._id,
            type: 'completion',
            title: 'Donation completed',
            body: `The donor marked \"${updated.title}\" as picked up/donated.`,
            link: `/donations/${updated._id}`,
            meta: { donationId: updated._id },
          });
        } catch (nErr) {
          logger.error('Failed to create notification record for requester (complete): %o', nErr);
        }
      }
    } catch (notifyErr) {
      logger.error('Failed to notify requester of completion: %o', notifyErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
