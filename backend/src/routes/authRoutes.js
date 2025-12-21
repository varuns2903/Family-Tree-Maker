const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  loginUser,
  getMe,
  searchUsers,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  generateToken // Imported to generate tokens for OAuth users
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// --- 1. AUTHENTICATION ---
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);

// --- 2. PASSWORD MANAGEMENT ---
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// --- 3. GOOGLE OAUTH ---
// Trigger Google Login
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate token for the authenticated user
    const token = generateToken(req.user._id);
    
    // Redirect to Frontend with token
    // Ensure FRONTEND_URL is set in .env (e.g., http://localhost:5173)
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
    }))}`);
  }
);

// --- 4. GITHUB OAUTH ---
// Trigger GitHub Login
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub Callback
router.get('/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
    }))}`);
  }
);

// --- 5. PROTECTED ROUTES ---
router.get('/me', protect, getMe);
router.get('/search', protect, searchUsers);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.delete('/me', protect, deleteAccount); // ✅ Account Deletion

module.exports = router;