const Profile = require('../models/profile');

// Create or Update Profile
exports.saveProfile = async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      founderName,
      startupName,
      industry,
      stage,
      location,
      description,
      website,
      foundedYear,
      teamSize,
      monthlyRevenue,
      isIncorporated,
      competitiveAdvantage,
      customerBase
    } = req.body;

    // Validate required fields
    if (!userId || !founderName || !startupName || !industry || !stage || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Check if profile exists
    let profile = await Profile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId },
        {
          userEmail,
          founderName,
          startupName,
          industry,
          stage,
          location,
          description,
          website,
          foundedYear,
          teamSize,
          monthlyRevenue,
          isIncorporated,
          competitiveAdvantage,
          customerBase
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile
      });
    } else {
      // Create new profile
      profile = await Profile.create({
        userId,
        userEmail,
        founderName,
        startupName,
        industry,
        stage,
        location,
        description,
        website,
        foundedYear,
        teamSize,
        monthlyRevenue,
        isIncorporated,
        competitiveAdvantage,
        customerBase
      });

      return res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        profile
      });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Profile by User ID
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Profile
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};