// connectDatabase.js
const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://localhost:27017/startupbridge';

/**
 * Mask password in URI for logging
 */
function maskMongoUri(uri = '') {
  try {
    // handle mongodb+srv and standard URIs
    const url = new URL(uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
    if (url.password) {
      url.password = '*****';
    }
    return uri.startsWith('mongodb+srv://')
      ? uri.replace('mongodb+srv://', 'mongodb+srv://').replace(url.password, '*****')
      : uri.replace(url.password ? `:${url.password}@` : '', url.password ? ':*****@' : '');
  } catch {
    return uri;
  }
}

// Global mongoose settings
mongoose.set('bufferCommands', false); // fail fast when no connection
// mongoose.set('debug', true); // enable for query logging while debugging

const connectDatabase = async (opts = {}) => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

  // sensible defaults; can be overridden via opts
  const defaultOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // how long to try selecting a server (ms)
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    // keepAlive and poolSize help for long-running servers (tune as needed)
    keepAlive: true,
    maxPoolSize: 10,
  };

  const connectionOptions = Object.assign({}, defaultOptions, opts);

  // simple exponential backoff retry loop
  const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : Infinity;
  let attempt = 0;
  let delay = 2000; // start with 2s

  while (attempt <= maxRetries) {
    try {
      attempt += 1;
      console.log(`[MongoDB] Attempt ${attempt} - connecting to ${maskMongoUri(mongoURI)}`);
      const conn = await mongoose.connect(mongoURI, connectionOptions);
      console.log('✅ MongoDB Connected Successfully');
      console.log(`📦 Database: ${conn.connection.name}`);
      console.log(`🔗 Host(s): ${conn.connection.host || conn.connection.hosts || conn.connection._connectionString}`);

      // return connection once connected
      return conn;
    } catch (err) {
      console.error(`❌ MongoDB Connection attempt ${attempt} failed: ${err.message}`);

      // Helpful hints for common errors
      if (err.name === 'MongoServerSelectionError') {
        console.error('💡 Tip: Check MongoDB server reachable, Atlas IP whitelist, SRV DNS resolution, or credentials.');
      } else if (err.message && /Authentication failed/i.test(err.message)) {
        console.error('💡 Tip: Check username/password and authSource in your connection string.');
      }

      // if maxRetries is finite and exhausted, throw
      if (attempt > maxRetries) {
        console.error('[MongoDB] Max retries exceeded — throwing error');
        throw err;
      }

      // backoff and retry
      console.log(`[MongoDB] Retrying in ${Math.round(delay / 1000)}s...`);
      await new Promise((res) => setTimeout(res, delay));
      // exponential backoff with cap
      delay = Math.min(delay * 2, 30000);
    }
  }
};

// Connection event handlers (keeps them for runtime visibility)
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('🔴 Mongoose connection error:', error && error.message ? error.message : error);
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
    await mongoose.connection.close(false); // false -> do not force close in-progress ops
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

module.exports = connectDatabase;
