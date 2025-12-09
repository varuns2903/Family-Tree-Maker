const mongoose = require('mongoose');

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
      lowercase: true, // Ensures email is always saved in lowercase
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please add a password'],
    },
  },
  {
    timestamps: true, // Automatically creates 'createdAt' and 'updatedAt'
  }
);

module.exports = mongoose.model('User', UserSchema);