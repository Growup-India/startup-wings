const mongoose = require('mongoose');

/**
 * Database connection configuration
 * Handles MongoDB connection with proper error handling and event listeners
 */
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/startupbridge';
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const connection = await mongoose.connect(mongoURI, connectionOptions);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${connection.connection.name}`);
    console.log(`🔗 Host: ${connection.connection.host}`);
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    
    // Log specific connection errors
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Tip: Check if MongoDB is running and accessible');
    }
    
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('🔴 Mongoose connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to database');
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received: Closing database connection...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts

module.exports = connectDatabase;