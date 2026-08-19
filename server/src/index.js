import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns/promises';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const { default: app } = await import('./app.js');
const { setupLiveInterviewSocket } = await import('./websocket/liveInterviewSocket.js');

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-coach';

function startServer(port) {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  setupLiveInterviewSocket(io);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error('Server startup error:', error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`WebSocket ready on ws://localhost:${port}`);
  });
}

async function checkSrvResolutionIfNeeded(uri) {
  try {
    const m = uri.match(/mongodb\+srv:\/\/(?:[^@]+@)?([^\/\?]+)/i);
    const host = m && m[1];
    if (!host) return;

    const srvName = `_mongodb._tcp.${host}`;
    console.log(`Checking SRV record for ${srvName} ...`);
    try {
      const records = await dns.resolveSrv(srvName);
      console.log('SRV records:', records);
    } catch (dnsErr) {
      console.warn(`SRV lookup failed for ${srvName}:`, dnsErr.code || dnsErr.message || dnsErr);
    }
  } catch (err) {
    console.warn('SRV check error:', err?.message || err);
  }
}

async function connectDatabaseWithRetry(uri, maxAttempts = 5, delayMs = 2000) {
  await checkSrvResolutionIfNeeded(uri);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${attempt}/${maxAttempts})...`);
      await mongoose.connect(uri);
      console.log('Connected to MongoDB');
      return;
    } catch (error) {
      console.error(`MongoDB connection failed (attempt ${attempt}):`, error.message || error);

      // Helpful diagnostics for common SRV/DNS issues
      if (error.message && error.message.includes('querySrv')) {
        console.error('SRV DNS lookup failed. Possible causes: incorrect connection string, DNS resolution blocked, or cluster host is incorrect.');
        console.error('- Verify your MONGODB_URI starts with mongodb+srv:// and includes correct credentials and host.');
        console.error("- Check that your network/DNS allows SRV queries (port 53). Try: nslookup -type=SRV _mongodb._tcp.<your-host>");
        console.error("- Alternatively create a standard connection string (mongodb://host1:port,host2:port/<dbname>?replicaSet=...) from Atlas connection string wizard and use that.");
      }

      if (attempt < maxAttempts) {
        console.log(`Retrying in ${delayMs}ms...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting process.');
        process.exit(1);
      }
    }
  }
}

connectDatabaseWithRetry(MONGODB_URI).then(() => {
  startServer(DEFAULT_PORT);
});
