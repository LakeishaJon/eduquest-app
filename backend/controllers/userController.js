const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with that email or username' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        totalStars: user.totalStars,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Login user (supports BOTH username and email)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for:', username);

    // Try to find user by EITHER username OR email
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username }  // Allow email in username field
      ]
    }).select('+password');

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ 
        message: 'No account found with that username or email' 
      });
    }

    const isPasswordMatch = await user.matchPassword(password);
    console.log('Password match:', isPasswordMatch);

    if (isPasswordMatch) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        totalStars: user.totalStars,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ 
        message: 'Incorrect password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      totalStars: user.totalStars,
      badges: user.badges
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user stars
// @route   PUT /api/users/stars
// @access  Private
const updateStars = async (req, res) => {
  try {
    const { stars } = req.body;
    const user = await User.findById(req.user._id);

    user.totalStars += stars;
    await user.save();

    res.json({
      totalStars: user.totalStars
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateStars
};