const mongoose = require('mongoose');

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
      
      // ✅ Added: Track if they accepted the invite
      accepted: { type: Boolean, default: false }, 
      
      // Track if a viewer requested edit access
      requestedEdit: { type: Boolean, default: false }
    }],
    
    // Share Token for public links
    shareToken: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true,
  }
);

// Auto-generate shareToken if missing
TreeSchema.pre('save', async function() {
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
  }
});

module.exports = mongoose.model('Tree', TreeSchema);