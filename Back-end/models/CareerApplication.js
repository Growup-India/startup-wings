// models/career.js
const mongoose = require('mongoose');

const careerApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  jobRole:   { type: String, required: true, trim: true },
  address:   { type: String, required: true, trim: true },
  pincode:   { type: String, required: true, trim: true },

  // Store file in MongoDB as binary. Hide data by default to avoid accidental large responses.
  cv: {
    data: { type: Buffer, select: false },    // raw file bytes (not selected by default)
    contentType: { type: String },            // e.g. 'application/pdf'
    originalName: { type: String },           // original filename
    size: { type: Number }                    // file size in bytes
  },

  // Keep original name for quick listing & backward compatibility
  cvOriginalName: { type: String },

  // More detailed statuses used in your app
  status: {
    type: String,
    enum: ['pending', 'reviewed','approved', 'shortlisted', 'rejected'],
    default: 'pending'
  },

  // Admin processing metadata (optional but useful)
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Optional: create index for email to speed lookups
careerApplicationSchema.index({ email: 1 });

module.exports = mongoose.model('CareerApplication', careerApplicationSchema);
