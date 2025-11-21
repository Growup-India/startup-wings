// backend/Routes/upgradeRequestRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const UpgradeRequest = require('../models/upgradeRequest');
const mongoose = require('mongoose');

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Administrator access required' 
    });
  }
  next();
};

// ============== USER ENDPOINTS ==============

// Submit upgrade request (for users)
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { planType, paymentMethod, transactionId, notes } = req.body;
    
    // Validate required fields
    if (!planType) {
      return res.status(400).json({
        success: false,
        message: 'Plan type is required'
      });
    }

    // Check if user already has a pending request
    const existingRequest = await UpgradeRequest.findOne({
      userId: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending upgrade request'
      });
    }

    // Check if user is already Pro
    if (req.user.accountType === 'pro') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already Pro'
      });
    }

    // Create upgrade request
    const upgradeRequest = await UpgradeRequest.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      planType,
      paymentMethod: paymentMethod || 'offline',
      transactionId,
      notes,
      status: 'pending'
    });

    console.log(`[UPGRADE] New request submitted: ${req.user.email} - ${planType}`);

    res.json({
      success: true,
      message: 'Upgrade request submitted successfully. An administrator will review it soon.',
      request: upgradeRequest
    });
  } catch (error) {
    console.error('[UPGRADE] Submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit upgrade request'
    });
  }
});

// Get user's own upgrade requests
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const requests = await UpgradeRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('[UPGRADE] Fetch user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upgrade requests'
    });
  }
});

// Cancel own pending request
router.delete('/my-requests/:id', requireAuth, async (req, res) => {
  try {
    const request = await UpgradeRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found'
      });
    }

    await UpgradeRequest.findByIdAndDelete(req.params.id);

    console.log(`[UPGRADE] Request cancelled by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Upgrade request cancelled successfully'
    });
  } catch (error) {
    console.error('[UPGRADE] Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel request'
    });
  }
});

// ============== ADMIN ENDPOINTS ==============

// Get all upgrade requests (admin only)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await UpgradeRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[ADMIN] ${req.user.email} retrieved ${requests.length} upgrade requests`);

    res.json({
      success: true,
      requests,
      count: requests.length
    });
  } catch (error) {
    console.error('[ADMIN] Fetch requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upgrade requests'
    });
  }
});

// Approve upgrade request (admin only)
router.post('/admin/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID'
      });
    }

    session.startTransaction();

    // Find the request
    const request = await UpgradeRequest.findById(req.params.id).session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    if (request.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Calculate expiry date based on plan type
    let expiryDate = new Date();
    switch (request.planType) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'yearly':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Update user to Pro status
    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      {
        accountType: 'pro',
        proExpiryDate: expiryDate,
        planType: request.planType
      },
      { new: true, session }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save({ session });

    await session.commitTransaction();

    console.log(`[ADMIN] ${req.user.email} approved upgrade for ${updatedUser.email} - ${request.planType}`);

    res.json({
      success: true,
      message: 'Upgrade request approved successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        accountType: updatedUser.accountType,
        proExpiryDate: updatedUser.proExpiryDate
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[ADMIN] Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve upgrade request'
    });
  } finally {
    session.endSession();
  }
});

// Reject upgrade request (admin only)
router.post('/admin/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID'
      });
    }

    const request = await UpgradeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    request.status = 'rejected';
    request.rejectedBy = req.user._id;
    request.rejectedAt = new Date();
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    console.log(`[ADMIN] ${req.user.email} rejected upgrade for ${request.userEmail}`);

    res.json({
      success: true,
      message: 'Upgrade request rejected successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject upgrade request'
    });
  }
});

// Delete upgrade request (admin only)
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID'
      });
    }

    const request = await UpgradeRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    console.log(`[ADMIN] ${req.user.email} deleted upgrade request for ${request.userEmail}`);

    res.json({
      success: true,
      message: 'Upgrade request deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete upgrade request'
    });
  }
});

// Get upgrade request statistics (admin only)
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      UpgradeRequest.countDocuments({ status: 'pending' }),
      UpgradeRequest.countDocuments({ status: 'approved' }),
      UpgradeRequest.countDocuments({ status: 'rejected' }),
      UpgradeRequest.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        total
      }
    });
  } catch (error) {
    console.error('[ADMIN] Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;