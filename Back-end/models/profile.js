const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  founderName: {
    type: String,
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    enum: ['technology', 'healthcare', 'fintech', 'ecommerce', 'education', 'food', 'other'],
    required: true
  },
  stage: {
    type: String,
    enum: ['idea', 'validation', 'mvp', 'launch', 'growth'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  website: {
    type: String,
    default: ''
  },
  foundedYear: {
    type: Number,
    min: 2000,
    max: 2025
  },
  teamSize: {
    type: String,
    enum: ['1', '2-5', '6-10', '11-25', '25+']
  },
  monthlyRevenue: {
    type: String,
    enum: ['pre-revenue', 'under-1k', '1k-10k', '10k-50k', '50k-100k', '100k+']
  },
  isIncorporated: {
    type: String,
    default: ''
  },
  competitiveAdvantage: {
    type: String,
    default: ''
  },
  customerBase: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);