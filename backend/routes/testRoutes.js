const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test route to see all users (REMOVE IN PRODUCTION!)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username email totalStars');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
