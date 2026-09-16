const mongoose = require('mongoose');
const dns = require('dns');

function usePublicDns() {
  try {
    const publicDns = ['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1'];
    const existing = dns.getServers().filter((s) => !publicDns.includes(s));
    dns.setServers([...publicDns, ...existing]);
  } catch (err) {
    console.warn('Could not set custom DNS servers:', err.message);
  }
}

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
  retryWrites: true,
};

async function connectWithRetry(attempt = 1) {
  const MAX_ATTEMPTS = 5;
  try {
    await mongoose.connect(process.env.MONGODB_URL, CONNECT_OPTIONS);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
    if (attempt >= MAX_ATTEMPTS) throw err;
    const delay = Math.min(2000 * attempt, 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(attempt + 1);
  }
}

async function connectDB() {
  usePublicDns();

  mongoose.connection.on('connected', () => {
    setInterval(() => {
      mongoose.connection.db.command({ ping: 1 }).catch(() => {});
    }, 25 * 60 * 1000);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — attempting to reconnect…');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });

  await connectWithRetry();
}

module.exports = connectDB;
