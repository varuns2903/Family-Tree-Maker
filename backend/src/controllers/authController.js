const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Tree = require('../models/Tree'); // Required for deleteAccount
const Member = require('../models/Member'); // Required for deleteAccount
const sendEmail = require('../utils/sendEmail');
const getEmailTemplate = require('../utils/emailTemplates')

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user & Send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    let user = await User.findOne({ email });

    // If user exists and is already verified, block registration
    if (user && user.isVerified) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    if (user && !user.isVerified) {
      // Update existing unverified user with new details & OTP
      user.name = name;
      user.password = password; // Will be hashed by pre-save hook
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpires,
        isVerified: false
      });
    }

    // Send Verification Email
    const htmlMessage = getEmailTemplate(
      'Verify Your Email',
      'Thank you for joining! To complete your registration, please enter the code below:',
      'otp',
      otp
    );
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your email - Family Tree App',
        html: htmlMessage
      });
      
      res.status(200).json({ 
        message: 'Verification code sent to email', 
        email: user.email 
      });
    } catch (emailError) {
      // If email fails, don't delete user, just let them retry
      console.error(emailError);
      res.status(500);
      throw new Error('Email could not be sent. Please try again.');
    }

  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Verify OTP and Login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with matching email, OTP, and check expiration
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email, explicitly select password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('User does not exist');
    }

    // Check password
    if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check verification status
    if (!user.isVerified) {
      // Optional: Logic to resend OTP could go here
      res.status(401);
      throw new Error('Email not verified. Please verify your account.');
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send Reset Link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Generate Reset Token (raw token sent to user, hashed stored in DB)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    // Create Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const htmlMessage = getEmailTemplate(
      'Password Reset Request',
      'We received a request to reset your password. Click the button below to choose a new password:',
      'link',
      resetUrl
    );

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        html: htmlMessage
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired token');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Password (Authenticated)
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // OAuth users might not have a password
    if (!user.password) {
        return res.status(400).json({ message: "Please reset password via email or set a new one." });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {    
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Account & All Data
// @route   DELETE /api/auth/me
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find all trees owned by user
    const ownedTrees = await Tree.find({ owner: userId });
    const ownedTreeIds = ownedTrees.map(t => t._id);

    // 2. Delete all members associated with those trees
    if (ownedTreeIds.length > 0) {
      await Member.deleteMany({ treeId: { $in: ownedTreeIds } });
    }

    // 3. Delete the trees themselves
    await Tree.deleteMany({ owner: userId });

    // 4. Remove user from 'collaborators' list in OTHER trees
    await Tree.updateMany(
      { "collaborators.user": userId },
      { $pull: { collaborators: { user: userId } } }
    );

    // 5. Delete the User
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account and data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

// @desc    Search for users
// @route   GET /api/auth/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude self
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email _id').limit(5);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  generateToken, // Exported for OAuth usage in routes
};