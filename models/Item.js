const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  claimedAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, default: 'Other' },
  type: { type: String, enum: ['lost', 'found'], required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  contactInfo: { type: String },
  schoolId: { type: String },
  imageUrl: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  foundBySecurity: { type: Boolean, default: false },
  securityNote: { type: String },
  submittedBy: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  moderatedBy: { type: String },
  moderatedAt: { type: Date },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: String, default: null },
  resolvedAt: { type: Date },
  userEmail: { type: String },
  phone: { type: String },

  // ✅ New claims array
  claims: [claimSchema],

  // Deprecated fields for backward compatibility
  contact: { type: String },
  image: { type: String },
  approved: { type: Boolean, default: false },
});

itemSchema.pre('save', function (next) {
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
