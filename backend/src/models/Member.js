const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
  treeId: { type: Schema.Types.ObjectId, ref: 'Tree', required: true, index: true },
  
  // Relationships
  mid: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
  fid: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
  pids: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  
  // Bio Info
  name: { type: String, required: true },
  
  // Updated Gender Enum
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true 
  },
  
  birthDate: { type: String }, // Format: YYYY-MM-DD
  deathDate: { type: String, default: null },
  isAlive: { type: Boolean, default: true },

  // New Field
  contactNo: { type: String, default: null },

  // Visuals
  img: { type: String, default: 'https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png' }, 
  
  // Extra Data
  data: { type: Map, of: String }
}, { timestamps: true });

MemberSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

MemberSchema.set('toJSON', { virtuals: true });
MemberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', MemberSchema);