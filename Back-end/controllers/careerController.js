// ==================== controllers/careerController.js ====================
const CareerApplication = require('../models/CareerApplication');

exports.submitApplication = async (req, res) => {
  try {
    const { firstName, lastName, email, jobRole, address, pincode } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !jobRole || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be 6 digits"
      });
    }

    // Ensure a CV is uploaded
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "CV file is required"
      });
    }

    // Save application WITH CV BUFFER (DB ONLY)
    const application = new CareerApplication({
      firstName,
      lastName,
      email,
      jobRole,
      address,
      pincode,
      cv: {
        data: req.file.buffer,          // Binary data
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      },
      cvOriginalName: req.file.originalname
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: {
        id: application._id,
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        jobRole: application.jobRole
      }
    });

  } catch (error) {
    console.error("Error submitting application:", error);

    return res.status(500).json({
      success: false,
      message: "Error submitting application. Please try again.",
      error: error.message
    });
  }
};
