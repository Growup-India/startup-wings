// back-end/routes/careerRoutes.js
const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const CareerApplication = require('../models/CareerApplication');

// NOTE: ensure this matches your project middleware file (single 'middleware' folder)
const { verifyToken, isAdmin } = require('../middlewares/authmiddlewares');

// Use memory storage so CVs are kept in memory and saved to MongoDB (Atlas)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public route for career application — stores CV buffer into DB via controller
router.post('/apply', upload.single('cv'), careerController.submitApplication);

// ---------------------- Admin routes (protected) ----------------------
// All admin routes require a valid JWT + admin role
router.use('/admin', verifyToken, isAdmin);

// List all applications (exclude binary data from list responses)
// GET /api/career/admin/all
router.get('/admin/all', async (req, res) => {
  try {
    console.log('[CAREER ADMIN] Fetching all applications...');
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 500);
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      CareerApplication.find()
        .select('-cv.data') // don't return binary blob in list
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      CareerApplication.countDocuments().exec()
    ]);

    console.log(`[CAREER ADMIN] Found ${applications.length} applications (total ${total})`);

    res.json({
      success: true,
      applications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[CAREER ADMIN] Fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
  }
});

// Get single application (without binary CV by default)
// GET /api/career/admin/:id
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }

    const application = await CareerApplication.findById(id).select('-cv.data').lean().exec();
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    res.json({ success: true, application });
  } catch (error) {
    console.error('[CAREER ADMIN] Get single error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
  }
});

// Approve / shortlist an application
// POST /api/career/admin/:id/approve
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }

    const updated = await CareerApplication.findByIdAndUpdate(
      id,
      { status: 'shortlisted' },
      { new: true, runValidators: true }
    ).select('-cv.data').exec();

    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });

    console.log(`[CAREER ADMIN] Application ${id} approved/shortlisted`);
    res.json({ success: true, message: 'Application approved (shortlisted)', application: updated });
  } catch (error) {
    console.error('[CAREER ADMIN] Approve error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
  }
});

// Reject an application (optional reason in body)
// POST /api/career/admin/:id/reject
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason ? String(req.body.reason).trim() : undefined;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }

    const payload = { status: 'rejected' };
    if (reason) payload.rejectionReason = reason;

    const updated = await CareerApplication.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true }
    ).select('-cv.data').exec();

    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });

    console.log(`[CAREER ADMIN] Application ${id} rejected${reason ? ` (reason: ${reason})` : ''}`);
    res.json({ success: true, message: 'Application rejected', application: updated });
  } catch (error) {
    console.error('[CAREER ADMIN] Reject error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject application', error: error.message });
  }
});

// Delete application (removes document and its stored CV from DB)
// DELETE /api/career/admin/:id
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[CAREER ADMIN] Deleting application: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }

    const application = await CareerApplication.findByIdAndDelete(id).exec();
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    res.json({ success: true, message: 'Application deleted successfully', deletedId: id });
  } catch (error) {
    console.error('[CAREER ADMIN] Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete application', error: error.message });
  }
});

// Download CV from DB (DB-only storage)
// GET /api/career/admin/download/:id
router.get('/admin/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }

    const application = await CareerApplication.findById(id).select('cv cvOriginalName').exec();
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (!application.cv || !application.cv.data) {
      return res.status(404).json({ success: false, message: 'CV not found in DB' });
    }

    // application.cv.data might be a Buffer or a BSON Binary; handle both
    let buf;
    if (Buffer.isBuffer(application.cv.data)) {
      buf = application.cv.data;
    } else if (application.cv.data && application.cv.data.buffer) {
      buf = Buffer.from(application.cv.data.buffer);
    } else {
      buf = Buffer.from(application.cv.data);
    }

    // prefer cv.originalName inside cv, else fallback to cvOriginalName
    const filename = application.cv.originalName || application.cvOriginalName || 'cv';
    const contentType = application.cv.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buf);
  } catch (error) {
    console.error('[CAREER ADMIN] Download error:', error);
    res.status(500).json({ success: false, message: 'Failed to download CV', error: error.message });
  }
});

module.exports = router;
