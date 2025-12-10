const mongoose = require('mongoose');

// 1. Fixed: Added 'new' before mongoose.Schema
const TreeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Please name your family tree'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    
    // --- Sharing Logic ---
    collaborators: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
      requestedEdit: { type: Boolean, default: false }
    }],
    
    // Share Token
    shareToken: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true,
  }
);

// 2. Fixed: Use 'async function' and REMOVE 'next' parameter entirely.
// Mongoose 6/7/8+ handles async functions automatically.
TreeSchema.pre('save', async function() {
  // 'this' refers to the document being saved
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
  }
});

module.exports = mongoose.model('Tree', TreeSchema);