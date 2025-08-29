/**
 * ClassikLust Game Server - With Vite Development Support
 */

import express from 'express';
import cors from 'cors';
import { setupViteDevServer, log } from './vite.js';

const app = express();
const PORT = 5000;

console.log('🎮 Starting ClassikLust Game Server...');

// Basic middleware
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Test route
app.get('/test', (req, res) => {
  log('✅ TEST route hit!');
  res.send('<h1 style="color: #ff4081; text-align: center; padding: 100px;">🎮 ClassikLust Server is Working!</h1>');
});

// Setup Vite development server for React frontend
async function startServer() {
  try {
    log('🔧 Setting up Vite development server...');
    await setupViteDevServer(app);
    log('✅ Vite development server configured!');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      log(`🚀 ClassikLust server running on port ${PORT}`);
      log(`🔗 Preview URL: https://05822bd3-d68c-4746-801b-bfd0933e7027-00-1rtxwdutqu2w1.picard.replit.dev`);
      log('✅ ClassikLust is ready to play!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();