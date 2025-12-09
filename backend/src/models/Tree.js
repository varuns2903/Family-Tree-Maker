const mongoose = require('mongoose');

const TreeSchema = mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Establishes relationship with the User model
    },
    name: {
      type: String,
      required: [true, 'Please name your family tree'], // e.g., "The Gupta Family"
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tree', TreeSchema);