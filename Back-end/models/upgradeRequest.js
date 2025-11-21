// models/upgradeRequest.js
const mongoose = require('mongoose');

const upgradeRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  planType: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'bank_transfer', 'cash', 'offline', 'other'],
    default: 'offline'
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
upgradeRequestSchema.index({ userId: 1, status: 1 });
upgradeRequestSchema.index({ createdAt: -1 });
upgradeRequestSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted plan type
upgradeRequestSchema.virtual('formattedPlan').get(function() {
  const planMap = {
    'monthly': 'Monthly ($50/month)',
    'quarterly': 'Quarterly ($120/3 months)',
    'yearly': 'Yearly ($400/year)'
  };
  return planMap[this.planType] || this.planType;
});

// Virtual for status badge color
upgradeRequestSchema.virtual('statusColor').get(function() {
  const colorMap = {
    'pending': 'yellow',
    'approved': 'green',
    'rejected': 'red'
  };
  return colorMap[this.status] || 'gray';
});

/**
 * Instance method: approve the request
 * - sets status to 'approved', approvedBy, approvedAt
 * - clears rejected fields if present
 */
upgradeRequestSchema.methods.approve = async function(adminId) {
  if (!adminId) throw new Error('adminId is required to approve');
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  // clear any previous rejection data
  this.rejectedBy = undefined;
  this.rejectedAt = undefined;
  this.rejectionReason = undefined;
  return this.save();
};

/**
 * Instance method: reject the request
 * - sets status to 'rejected', rejectedBy, rejectedAt, and optional reason
 * - clears approved fields if present
 */
upgradeRequestSchema.methods.reject = async function(adminId, reason) {
  if (!adminId) throw new Error('adminId is required to reject');
  this.status = 'rejected';
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  if (reason && reason.trim()) this.rejectionReason = reason.trim();
  else this.rejectionReason = undefined;
  // clear any previous approval data
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

/**
 * Static helper: get count of pending requests
 */
upgradeRequestSchema.statics.getPendingCount = function() {
  return this.countDocuments({ status: 'pending' }).exec();
};

module.exports = mongoose.model('UpgradeRequest', upgradeRequestSchema);
