// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Profile = require('../models/profile');
const CareerApplication = require('../models/CareerApplication'); // <- ensure path/filename matches your model
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { verifyToken, isAdmin } = require('../middlewares/authmiddlewares');

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

router.use(adminLimiter);

// ============== APPLY JWT MIDDLEWARE TO ALL ADMIN ROUTES ==============
router.use(verifyToken);
router.use(isAdmin);

// Verify admin status
router.get('/check-admin', (req, res) => {
  try {
    console.log(`[ADMIN] Check-admin request from ${req.user.email}`);
    res.json({
      success: true,
      isAdmin: req.user.role === 'admin',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('[ADMIN] Check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin status',
      error: error.message
    });
  }
});

// Retrieve all registered users with pagination
router.get('/users', async (req, res) => {
  try {
    console.log(`[ADMIN] ${req.user.email} requesting users list`);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      User.find()
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments().exec()
    ]);
    
    console.log(`[ADMIN] Retrieved ${users.length} users out of ${totalCount} total`);
    
    res.json({
      success: true,
      users: users,
      count: users.length,
      total: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] User retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve user data',
      error: error.message
    });
  }
});

// Retrieve all startup profiles with user information and pagination
router.get('/profiles', async (req, res) => {
  try {
    console.log(`[ADMIN] ${req.user.email} requesting profiles list`);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [profiles, totalCount] = await Promise.all([
      Profile.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Profile.countDocuments().exec()
    ]);
    
    console.log(`[ADMIN] Found ${profiles.length} profiles out of ${totalCount} total`);
    
    // Enrich profiles with associated user data
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const user = await User.findById(profile.userId)
            .select('name email photo picture')
            .lean()
            .exec();
          
          return {
            ...profile,
            userName: user?.name || 'Unknown User',
            userPhoto: user?.photo || user?.picture || null
          };
        } catch (err) {
          console.error(`[ADMIN] Error enriching profile ${profile._id}:`, err);
          return {
            ...profile,
            userName: 'Unknown User',
            userPhoto: null
          };
        }
      })
    );
    
    console.log(`[ADMIN] Successfully enriched ${enrichedProfiles.length} profiles`);
    
    res.json({
      success: true,
      profiles: enrichedProfiles,
      count: enrichedProfiles.length,
      total: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve startup profiles',
      error: error.message
    });
  }
});

// Retrieve single profile by ID
router.get('/profiles/:id', async (req, res) => {
  try {
    console.log(`[ADMIN] Fetching profile ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile ID format'
      });
    }

    const profile = await Profile.findById(req.params.id).lean().exec();
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Startup profile not found'
      });
    }
    
    const user = await User.findById(profile.userId)
      .select('name email photo picture')
      .lean()
      .exec();
    
    const enrichedProfile = {
      ...profile,
      userName: user?.name || 'Unknown User',
      userPhoto: user?.photo || user?.picture || null
    };
    
    res.json({
      success: true,
      profile: enrichedProfile
    });
  } catch (error) {
    console.error('[ADMIN] Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve profile',
      error: error.message
    });
  }
});

// Delete user and associated profiles with transaction
router.delete('/users/:id', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const targetUserId = req.params.id;
    
    console.log(`[ADMIN] ${req.user.email} attempting to delete user: ${targetUserId}`);
    
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    if (targetUserId === req.user.id.toString()) {
      console.log('[ADMIN] Attempted self-deletion blocked');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own administrator account'
      });
    }
    
    session.startTransaction();
    
    const userToDelete = await User.findById(targetUserId).session(session);
    
    if (!userToDelete) {
      await session.abortTransaction();
      console.log(`[ADMIN] User not found: ${targetUserId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        alreadyDeleted: true
      });
    }
    
    console.log(`[ADMIN] Deleting user: ${userToDelete.email}`);
    
    const profileDeletion = await Profile.deleteMany(
      { userId: targetUserId },
      { session }
    );
    console.log(`[ADMIN] Deleted ${profileDeletion.deletedCount} profile(s)`);
    
    await User.findByIdAndDelete(targetUserId, { session });
    console.log(`[ADMIN] User ${userToDelete.email} deleted successfully`);
    
    await session.commitTransaction();
    
    const [updatedUserCount, updatedProfileCount] = await Promise.all([
      User.countDocuments().exec(),
      Profile.countDocuments().exec()
    ]);
    
    console.log(`[ADMIN] Updated counts - Users: ${updatedUserCount}, Profiles: ${updatedProfileCount}`);
    
    res.json({
      success: true,
      message: 'User and associated data successfully removed',
      deletedUser: {
        id: userToDelete._id.toString(),
        email: userToDelete.email,
        name: userToDelete.name
      },
      deletedProfiles: profileDeletion.deletedCount,
      updatedCounts: {
        totalUsers: updatedUserCount,
        totalProfiles: updatedProfileCount
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[ADMIN] User deletion error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Unable to delete user. Please try again.',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// Clean up orphaned profiles
router.delete('/profiles/cleanup-orphaned', async (req, res) => {
  try {
    console.log(`[ADMIN] ${req.user.email} initiated orphaned profile cleanup`);
    
    const profiles = await Profile.find().lean().exec();
    const users = await User.find().select('_id').lean().exec();
    const validUserIds = new Set(users.map(u => u._id.toString()));
    
    const orphanedProfiles = profiles.filter(p => !validUserIds.has(p.userId.toString()));
    
    if (orphanedProfiles.length === 0) {
      console.log('[ADMIN] No orphaned profiles found');
      return res.json({
        success: true,
        message: 'No orphaned profiles found',
        deletedCount: 0
      });
    }
    
    const orphanedIds = orphanedProfiles.map(p => p._id);
    const result = await Profile.deleteMany({ _id: { $in: orphanedIds } });
    
    console.log(`[ADMIN] Cleaned up ${result.deletedCount} orphaned profile(s)`);
    
    res.json({
      success: true,
      message: `Successfully removed ${result.deletedCount} orphaned profile(s)`,
      deletedCount: result.deletedCount,
      orphanedProfiles: orphanedProfiles.map(p => ({
        id: p._id,
        startupName: p.startupName,
        founderName: p.founderName,
        userId: p.userId
      }))
    });
  } catch (error) {
    console.error('[ADMIN] Orphaned profile cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to clean up orphaned profiles',
      error: error.message
    });
  }
});

// Retrieve comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log(`[ADMIN] ${req.user.email} requesting stats`);
    
    const [
      totalUsers,
      totalProfiles,
      completedProfiles,
      revenueGenerating,
      recentUsers,
      industryDistribution,
      stageDistribution
    ] = await Promise.all([
      User.countDocuments().exec(),
      Profile.countDocuments().exec(),
      Profile.countDocuments({
        founderName: { $exists: true, $ne: '' },
        startupName: { $exists: true, $ne: '' },
        industry: { $exists: true, $ne: '' },
        stage: { $exists: true, $ne: '' },
        description: { $exists: true, $ne: '' }
      }).exec(),
      Profile.countDocuments({
        monthlyRevenue: { 
          $exists: true, 
          $nin: ['', null, 'pre-revenue']
        }
      }).exec(),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).exec(),
      Profile.aggregate([
        { $match: { industry: { $exists: true, $ne: '' } } },
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Profile.aggregate([
        { $match: { stage: { $exists: true, $ne: '' } } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    console.log(`[ADMIN] Stats calculated - Users: ${totalUsers}, Profiles: ${totalProfiles}`);
    
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          recentRegistrations: recentUsers
        },
        startups: {
          total: totalProfiles,
          completed: completedProfiles,
          incomplete: totalProfiles - completedProfiles
        },
        revenue: {
          generating: revenueGenerating,
          preRevenue: totalProfiles - revenueGenerating
        },
        distribution: {
          byIndustry: industryDistribution,
          byStage: stageDistribution
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] Statistics calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to calculate statistics',
      error: error.message
    });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    console.log(`[ADMIN] ${req.user.email} changing role for user ${req.params.id} to ${role}`);
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "user" or "admin"'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`[ADMIN] Role updated: ${updatedUser.email} is now ${role}`);
    
    res.json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('[ADMIN] Role update error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update user role',
      error: error.message
    });
  }
});

// Search users and profiles
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    console.log(`[ADMIN] Search request: query="${query}", type="${type}"`);
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(sanitizedQuery, 'i');
    let results = {};
    
    if (!type || type === 'users') {
      results.users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('-password').limit(20).exec();
    }
    
    if (!type || type === 'profiles') {
      results.profiles = await Profile.find({
        $or: [
          { startupName: searchRegex },
          { founderName: searchRegex },
          { userEmail: searchRegex }
        ]
      }).limit(20).exec();
    }
    
    console.log(`[ADMIN] Search results: ${results.users?.length || 0} users, ${results.profiles?.length || 0} profiles`);
    
    res.json({
      success: true,
      results: results,
      query: query
    });
  } catch (error) {
    console.error('[ADMIN] Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/* ---------------------------
   Career application admin endpoints
   --------------------------- */

// Get all career applications (admin listing)
router.get('/career/all', async (req, res) => {
  try {
    console.log(`[ADMIN] ${req.user.email} requesting career applications list`);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [apps, total] = await Promise.all([
      CareerApplication.find()
        .select('-cv.data') // exclude binary by default
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      CareerApplication.countDocuments().exec()
    ]);

    res.json({
      success: true,
      applications: apps,
      count: apps.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] Career applications list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch career applications', error: error.message });
  }
});

// Get single career application details (no binary)
router.get('/career/:id', async (req, res) => {
  try {
    const appId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    console.log(`[ADMIN] ${req.user.email} fetching career application ${appId}`);

    const app = await CareerApplication.findById(appId)
      .select('-cv.data')
      .lean()
      .exec();

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const hasCv = !!(app.cv && (app.cv.size || app.cv.originalName || app.cv.contentType || app.cvOriginalName));
    res.json({
      success: true,
      application: {
        ...app,
        hasCv,
        cvOriginalName: app.cvOriginalName || app.cv?.originalName || null
      }
    });
  } catch (error) {
    console.error('[ADMIN] Fetch career application error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
  }
});

// Download CV binary (streams file). Requires admin auth.
router.get('/career/:id/cv', async (req, res) => {
  try {
    const appId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    console.log(`[ADMIN] ${req.user.email} requesting CV for application ${appId}`);

    // explicitly select cv.data (select:false in schema)
    const app = await CareerApplication.findById(appId).select('+cv.data +cv.contentType +cv.originalName +cv.size cvOriginalName').exec();

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!app.cv || !app.cv.data) {
      return res.status(404).json({ success: false, message: 'CV not found for this application' });
    }

    const filename = app.cvOriginalName || app.cv.originalName || `cv_${appId}`;
    const fallbackName = filename.replace(/"/g, '');
    res.setHeader('Content-Type', app.cv.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fallbackName}"`);
    res.send(app.cv.data);
  } catch (error) {
    console.error('[ADMIN] CV download error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve CV', error: error.message });
  }
});

// Approve a career application
router.post('/career/:id/approve', async (req, res) => {
  try {
    const appId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    console.log(`[ADMIN] ${req.user.email} approving career application ${appId}`);

    const app = await CareerApplication.findById(appId).exec();
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.status === 'approved') {
      return res.json({ success: true, message: 'Application already approved', application: app });
    }

    app.status = 'approved';
    app.processedBy = req.user.id;
    app.processedAt = new Date();
    await app.save();

    console.log(`[ADMIN] Application ${appId} approved by ${req.user.email}`);

    res.json({ success: true, message: 'Application approved', application: app });
  } catch (error) {
    console.error('[ADMIN] Approve career application error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
  }
});

// Reject a career application
router.post('/career/:id/reject', async (req, res) => {
  try {
    const appId = req.params.id;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    console.log(`[ADMIN] ${req.user.email} rejecting career application ${appId} with reason: ${reason || 'none'}`);

    const app = await CareerApplication.findById(appId).exec();
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.status === 'rejected') {
      return res.json({ success: true, message: 'Application already rejected', application: app });
    }

    app.status = 'rejected';
    app.rejectionReason = reason || '';
    app.processedBy = req.user.id;
    app.processedAt = new Date();
    await app.save();

    console.log(`[ADMIN] Application ${appId} rejected by ${req.user.email}`);

    res.json({ success: true, message: 'Application rejected', application: app });
  } catch (error) {
    console.error('[ADMIN] Reject career application error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject application', error: error.message });
  }
});

// Delete a career application
router.delete('/career/:id', async (req, res) => {
  try {
    const appId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    console.log(`[ADMIN] ${req.user.email} deleting career application ${appId}`);

    const result = await CareerApplication.findByIdAndDelete(appId).exec();
    if (!result) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, message: 'Application deleted', deletedId: appId });
  } catch (error) {
    console.error('[ADMIN] Delete career application error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete application', error: error.message });
  }
});

module.exports = router;
