const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
  treeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tree', 
    required: true, 
    index: true 
  },
  
  // Relationships
  mid: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
  fid: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
  pids: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  
  // ✅ NEW: Wedding Details (for Anniversaries)
  weddings: [{
    spouseId: { type: Schema.Types.ObjectId, ref: 'Member' },
    date: { type: Date }
  }],
  
  // Bio Info
  name: { type: String, required: true },
  
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true, 
    default: 'male'
  },
  
  // ✅ CHANGED: Using Date type allows for better sorting & "Upcoming" queries
  birthDate: { type: Date }, 
  deathDate: { type: Date, default: null },
  isAlive: { type: Boolean, default: true },

  contactNo: { type: String, default: null },

  // ✅ NEW: Description / Bio field
  description: { type: String, default: "" },

  // Visuals
  img: { type: String, default: 'https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png' }, 
  
  // Extra Data (Changed to Object to allow storing any type of custom data)
  data: { type: Object, default: {} }
}, { timestamps: true });

// Virtual for id (useful for frontend mapping)
MemberSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
MemberSchema.set('toJSON', { virtuals: true });
MemberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', MemberSchema);