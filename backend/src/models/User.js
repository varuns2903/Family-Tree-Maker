const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // ✅ Removed 'required: true' to allow OAuth users (Google/GitHub) to exist without a password
      minlength: 6,
      select: false, // Don't return password by default
    },
    
    // ✅ OTP & Verification System
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false, // Security: Don't expose OTP in queries
    },
    otpExpires: {
      type: Date,
      select: false,
    },

    // ✅ Forgot Password System
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },

    // ✅ OAuth Provider IDs
    googleId: {
      type: String,
    },
    githubId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  // 1. If password is NOT modified OR password doesn't exist (OAuth), exit early.
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  // 2. Otherwise, hash the password.
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Helper Method: Match user entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // Guard clause: If user has no password (OAuth), return false
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);