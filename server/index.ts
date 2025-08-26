/**
 * index.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 *
 */


import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { WebSocketServer } from 'ws';
import { SupabaseStorage } from '../shared/SupabaseStorage';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { registerAdminApi } from '../debugger/modules/adminAPI'; // adjust import as needed
import DebuggerCore from '../debugger/DebuggerCore';
import DebuggerAssist from '../debugger/modules/CharactersPlugin';
import AdminUIPlugin from '../debugger/modules/adminUI';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

// Initialize database connection only if DATABASE_URL is provided
let db: any = null;
const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  try {
    const sql = postgres(connectionString);
    db = drizzle(sql);
    console.log('Database connection established');
  } catch (error) {
    console.warn('Database connection fail, running in mock mode:', error);
  }
} else {
  console.warn('DATABASE_URL not provided, running in mock mode');
}

export { db };

function main() {
  console.log("[Main] Server loaded and started successfully... ");
  if (db) {
    console.log("[SupabaseDB] Database connected and loaded successfully...");
  } else {
    console.log("Running in mock mode without database");
  }
  
  // Initialize storage
  console.log("[Storage] Initialized SupabaseDB local storage system... ");
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

// Store token with expiration (5-10 minutes)
function storeAuthToken(telegramId: string, username: string): string {
  const token = generateAuthToken();
  const expirationMinutes = Math.floor(Math.random() * 6) + 5; // 5-10 minutes
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  
  telegramTokens.set(token, {
    telegramId,
    username,
    expiresAt,
    used: false
  });
  
  console.log(`Generated token ${token} for Telegram user ${telegramId} (${username}), expires at ${expiresAt}`);
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

      try {
        // 1. Generate temporary authentication token
        const token = storeAuthToken(telegram_id, username);
        
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

        // 3. Wait for backend validation
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log(`Telegram user authenticated: ${username} (${telegram_id})`);
          
          // 4. Send confirmation message
          if (messageText === '/start') {
            bot.sendMessage(chatId, `Welcome ${username || `User${telegram_id}`}!\nYou're logged in!`);
          } else if (messageText) {
            bot.sendMessage(chatId, `${username || `User${telegram_id}`} said: ${messageText}\nYou're logged in!`);
          }
        } else {
          // 5. If validation fails, ask to try again
          bot.sendMessage(chatId, 'Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Bot auth error:', error);
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

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

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
  const server = await registerRoutes(app);


  
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

  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`serving on port ${PORT}`);
    },
  );
})();

// Initialize storage for server operations
const storage = new SupabaseStorage();