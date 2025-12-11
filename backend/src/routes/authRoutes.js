const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  searchUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Route (Requires Token)
// Useful for the frontend to check if the user is still logged in on page refresh
router.get('/me', protect, getMe);
router.get('/search', protect, searchUsers);

module.exports = router;