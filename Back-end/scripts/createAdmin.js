// backend/scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../../admin-backend/models/user');

const createAdminUser = async (email) => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Looking for user: ${email}`);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('💡 Please make sure the user has signed up first via Google OAuth');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin:', user.email);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log('✅ Successfully promoted user to admin!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Error: Email address is required');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/createAdmin.js <email>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/createAdmin.js john@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^\S+@\S+\.\S+$/;
if (!emailRegex.test(email)) {
  console.log('❌ Error: Invalid email format');
  process.exit(1);
}

createAdminUser(email);