const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// @route   POST /api/profile
// @desc    Create or update profile
// @access  Private
router.post('/', profileController.saveProfile);

// @route   GET /api/profile/:userId
// @desc    Get profile by user ID
// @access  Private
router.get('/:userId', profileController.getProfile);

// @route   DELETE /api/profile/:userId
// @desc    Delete profile
// @access  Private
router.delete('/:userId', profileController.deleteProfile);

module.exports = router;