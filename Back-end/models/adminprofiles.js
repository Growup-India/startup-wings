// models/profile.js - Fixed version
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    trim: true,
    lowercase: true
  },
  founderName: {
    type: String,
    required: [true, 'Founder name is required'],
    trim: true
  },
  startupName: {
    type: String,
    required: [true, 'Startup name is required'],
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: {
      values: ['technology', 'healthcare', 'fintech', 'ecommerce', 'education', 'food', 'other'],
      message: '{VALUE} is not a valid industry'
    }
  },
  stage: {
    type: String,
    required: [true, 'Startup stage is required'],
    enum: {
      values: ['idea', 'validation', 'mvp', 'launch', 'growth'],
      message: '{VALUE} is not a valid stage'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    trim: true
  },
  foundedYear: {
    type: Number,
    min: [2000, 'Founded year cannot be before 2000'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  isIncorporated: {
    type: String,
    enum: ['yes', 'no', 'in-progress', ''],
    default: ''
  },
  teamSize: {
    type: String,
    enum: ['1', '2-5', '6-10', '11-25', '25+', ''],
    default: ''
  },
  competitiveAdvantage: {
    type: String,
    trim: true,
    maxlength: [500, 'Competitive advantage cannot exceed 500 characters']
  },
  monthlyRevenue: {
    type: String,
    enum: ['pre-revenue', 'under-1k', '1k-10k', '10k-50k', '50k-100k', '100k+', ''],
    default: ''
  },
  customerBase: {
    type: String,
    trim: true
  },
  fundingStage: {
    type: String,
    enum: ['bootstrapped', 'seed', 'series-a', 'series-b', 'series-c+', ''],
    default: ''
  },
  fundingAmount: {
    type: String,
    trim: true
  },
  lookingForFunding: {
    type: Boolean,
    default: false
  },
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
profileSchema.index({ userId: 1, startupName: 1 });
profileSchema.index({ industry: 1, stage: 1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ userEmail: 1 });

// Calculate profile completion percentage before saving
profileSchema.pre('save', function(next) {
  const requiredFields = [
    'founderName',
    'startupName',
    'industry',
    'stage',
    'location',
    'description',
    'website',
    'foundedYear',
    'teamSize',
    'monthlyRevenue'
  ];
  
  const filledFields = requiredFields.filter(field => {
    const value = this[field];
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }).length;
  
  this.profileCompletion = Math.round((filledFields / requiredFields.length) * 100);
  next();
});

// Virtual for formatted revenue
profileSchema.virtual('formattedRevenue').get(function() {
  const revenueMap = {
    'pre-revenue': 'Pre-Revenue',
    'under-1k': 'Under $1,000',
    '1k-10k': '$1,000 - $10,000',
    '10k-50k': '$10,000 - $50,000',
    '50k-100k': '$50,000 - $100,000',
    '100k+': 'Over $100,000'
  };
  return revenueMap[this.monthlyRevenue] || 'Not specified';
});

// Virtual for formatted stage
profileSchema.virtual('formattedStage').get(function() {
  const stageMap = {
    'idea': 'Idea Stage',
    'validation': 'Validation',
    'mvp': 'MVP',
    'launch': 'Launch',
    'growth': 'Growth'
  };
  return stageMap[this.stage] || this.stage;
});

module.exports = mongoose.model('Profile', profileSchema);