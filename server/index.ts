/**
 * index.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 */


import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { WebSocketServer } from 'ws';
import { SupabaseStorage } from '../shared/SupabaseStorage';
import TelegramBot from 'node-telegram-bot-api';
import cors from 'cors';

// Use only Supabase - no PostgreSQL connection needed
export { SupabaseStorage };

function main() {
  console.log("[Main] Server loaded and started successfully... ");
  console.log("[SupabaseStorage] Using Supabase for all database operations");

  // Initialize Supabase storage singleton
  const storage = SupabaseStorage.getInstance();
  console.log("[Storage] Supabase storage system initialized successfully");
}

main();

// In-memory token storage (replace with database later)
const telegramTokens = new Map<string, {
  telegramId: string,
  username: string,
  expiresAt: Date,
  used: boolean
}>();

// Generate temporary auth token (6-12 chars alphanumeric)
function generateAuthToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 7) + 6; // 6-12 chars
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Store persistent token (no expiration)
function storeAuthToken(telegramId: string, username: string): string {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (essentially permanent)

  telegramTokens.set(token, {
    telegramId,
    username,
    expiresAt,
    used: false
  });

  console.log(`Generated persistent token ${token} for Telegram user ${telegramId} (${username})`);
  return token;
}

// Validate token
export function validateAuthToken(token: string, telegramId: string): boolean {
  const tokenData = telegramTokens.get(token);
  if (!tokenData) {
    console.log(`Token ${token} not found`);
    return false;
  }

  if (tokenData.used) {
    console.log(`Token ${token} already used`);
    return false;
  }

  if (new Date() > tokenData.expiresAt) {
    console.log(`Token ${token} expired`);
    telegramTokens.delete(token);
    return false;
  }

  if (tokenData.telegramId !== telegramId) {
    console.log(`Token ${token} telegram_id mismatch`);
    return false;
  }

  // Mark as used
  tokenData.used = true;
  console.log(`Token ${token} validated successfully for ${telegramId}`);
  return true;
}

// Set global reference for routes to access
global.validateAuthToken = validateAuthToken;

// Store recent successful authentications for frontend polling
global.recentTelegramAuth = new Map<string, {
  user: any,
  token: string,
  timestamp: number
}>();

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
  console.log("[Telegram] Initializing Telegram bot...");
  try {
    const bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg: any) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;
      const telegram_id = msg.from.id.toString();
      const username = msg.from.username;
      const timestamp = new Date().toISOString();

      // Only respond to /start or /login commands
      if (messageText !== '/start' && messageText !== '/login') {
        return;
      }

      try {
        console.log(`[${timestamp}] Telegram auth initiated for user: ${telegram_id} (${username}) with command: ${messageText}`);

        // 1. Generate temporary authentication token
        const token = storeAuthToken(telegram_id, username);
        console.log(`[${timestamp}] Generated token: ${token} for telegram_id: ${telegram_id}`);

        // 2. POST to game backend auth endpoint with token
        const authResponse = await fetch('http://localhost:5000/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegram_id,
            username,
            token
          })
        });

        // 3. Wait for backend response and log it
        const responseData = await authResponse.json();
        console.log(`[${timestamp}] Backend response for ${telegram_id}: ${authResponse.status} - ${JSON.stringify(responseData)}`);

        if (authResponse.ok) {
          // 4. Send success confirmation message with game link
          const gameUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}?telegram_id=${telegram_id}`;
          bot.sendMessage(chatId, `You're logged in! 🎮\n\nClick here to play: ${gameUrl}`);
          console.log(`[${timestamp}] Success message sent to ${telegram_id} with game link: ${gameUrl}`);
        } else {
          // 5. Send failure message
          bot.sendMessage(chatId, 'Authentication failed. Please try again.');
          console.log(`[${timestamp}] Failure message sent to ${telegram_id}`);
        }
      } catch (error) {
        console.error(`[${timestamp}] Bot auth error for ${telegram_id}:`, error);
        bot.sendMessage(chatId, 'Service temporarily unavailable.');
      }
    });

    bot.on('error', (error: any) => {
      console.error('[Telegram] Bot error:', error);
    });

    console.log("[Telegram] Bot initialized successfully!");
  } catch (error) {
    console.error('[Telegram] Failed to initialize bot:', error);
  }
} else {
  console.warn('[Telegram] TELEGRAM_BOT_TOKEN not found, bot disabled');
}

// --- Start of Express App Configuration ---

// Create Express app directly
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://*.repl.co', 'https://*.replit.dev'],
  credentials: true
}));

// Serve static files from client dist directory
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;



  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const routes = await registerRoutes(app);



  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error:', err);
    res.status(status).json({ message });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });


  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = process.env.PORT || 5000;

  // WebSocket server for real-time features - using different port to avoid conflicts
  let wss;
  try {
    wss = new WebSocketServer({
      port: 8082,
      host: '0.0.0.0'
    });

    wss.on('error', (error: any) => {
      console.error('WebSocket server error:', error.message);
    });
  } catch (error: any) {
    console.warn('WebSocket server failed to start:', error.message);
  }

  // Register modular routes
  app.use("/api", routes);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  // Serve React app static files (when built)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } else {
    // In development, serve a simple status page
    app.get('*', (req, res) => {
      res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Character Tap Game</title>
          <meta charset="utf-8">
          <script type="module" src="http://localhost:5173/@vite/client"></script>
          <script type="module" src="http://localhost:5173/src/main.tsx"></script>
        </head>
        <body>
          <div id="root">Loading...</div>
        </body>
      </html>
    `);
    });
  }

  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`🎮 Character Tap Game server running on port ${PORT}`);
      console.log(`📡 Modular route architecture loaded successfully`);
      console.log(`serving on port ${PORT}`);
    },
  );
})();

// Initialize storage for server operations
// Using shared storage from routes.ts - no duplicate instance needed