//models/item.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, default: 'Other' },
  type: { type: String, enum: ['lost', 'found'], required: true }, // Changed from 'status'
  location: { type: String, required: true },
  date: { type: Date, required: true },
  contactInfo: { type: String, required: true },

  schoolId: { type: String }, // Changed from 'contact'
  imageUrl: { type: String }, // Changed from 'image'
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  foundBySecurity: {
  type: Boolean,
  default: false
},
securityNote: { // Optional note
  type: String
},

  submittedBy: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  moderatedBy: { type: String },
  moderatedAt: { type: Date },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: String, default: null },
  resolvedAt: { type: Date },

  // Keep old fields for backward compatibility
  contact: { type: String }, // Deprecated, use contactInfo
  image: { type: String }, // Deprecated, use imageUrl
  approved: { type: Boolean, default: false } ,// Deprecated, use status
  userEmail: { type: String },
  phone: { type: String },
  claimedInfo: {
  name: { type: String },
  email: { type: String },
  rollNo: { type: String },
  }

});

// Pre-save middleware to handle backward compatibility
itemSchema.pre('save', function(next) {
  // Map old fields to new fields if they exist
  if (this.contact && !this.contactInfo) {
    this.contactInfo = this.contact;
  }
  if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  if (this.approved !== undefined && this.status === 'pending') {
    this.status = this.approved ? 'approved' : 'pending';
  }
  next();
});

module.exports = mongoose.model("Item", itemSchema);
