// This is the complete and correct code for userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User.js');
const logger = require('../logger');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

router.post('/register', async (req, res) => {
  const schema = Joi.object({
    fullname: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('donor', 'recipient').required(),
  });

  try {
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let { fullname, email, password, role } = value;
    fullname = fullname.trim();
    email = email.toLowerCase();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({ fullname, email, password, role });
    const savedUser = await user.save();
    logger.info('New user registered: %s', savedUser.email);
    res.status(201).json({
      _id: savedUser._id,
      fullname: savedUser.fullname,
      email: savedUser.email,
      role: savedUser.role,
      token: generateToken(savedUser._id),
    });
  } catch (err) {
    logger.error('Registration error: %o', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.json({
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      }
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Get current user's profile ===
// @route GET /api/users/profile
// @access Private
const { protect } = require('../middleware/authMiddleware');
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Update current user's profile ===
// @route PUT /api/users/profile
// @access Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const schema = Joi.object({
      fullname: Joi.string().min(2).max(100),
      email: Joi.string().email(),
      password: Joi.string().min(6).allow('', null),
      phone: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (value.fullname) user.fullname = value.fullname.trim();
    if (value.email && value.email !== user.email) {
      const exists = await User.findOne({ email: value.email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = value.email.toLowerCase();
    }
    if (value.password) user.password = value.password;
    if (value.phone !== undefined) user.phone = value.phone;
    if (value.address !== undefined) user.address = value.address;

    const saved = await user.save();

    res.json({
      _id: saved._id,
      fullname: saved.fullname,
      email: saved.email,
      role: saved.role,
      phone: saved.phone,
      address: saved.address,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Get saved items for the user ===
// @route GET /api/users/saved
// @access Private
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: 'savedItems', populate: { path: 'donor', select: 'fullname' } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.savedItems || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Add a saved item ===
// @route POST /api/users/saved/:id
// @access Private
router.post('/saved/:id', protect, async (req, res) => {
  try {
    const donationId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.savedItems) user.savedItems = [];
    if (user.savedItems.find(id => id.toString() === donationId)) {
      return res.status(200).json({ message: 'Already saved' });
    }
    user.savedItems.push(donationId);
    await user.save();
    res.status(201).json({ message: 'Saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// === Endpoint: Remove a saved item ===
// @route DELETE /api/users/saved/:id
// @access Private
router.delete('/saved/:id', protect, async (req, res) => {
  try {
    const donationId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.savedItems = (user.savedItems || []).filter(id => id.toString() !== donationId);
    await user.save();
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
