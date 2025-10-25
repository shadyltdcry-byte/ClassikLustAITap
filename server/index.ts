/**
 * server/index.ts - Main Server with Auto-Repair System
 */

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { LunaErrorMonitor, setupLunaErrorHandlers } from './services/LunaErrorMonitor.js';
import { registerRoutes } from "./routes";
import { createAutoRepairRouter } from './routes/auto-repair';
import { createLogStreamRouter } from './routes/log-stream';
import { WebSocketServer } from 'ws';
import { SupabaseStorage } from 'shared/SupabaseStorage';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import TelegramBot from 'node-telegram-bot-api';

// Initialize database
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

let isInitialized = false;
function main() {
  if (isInitialized) return;
  isInitialized = true;
  console.log("[Main] Server loaded with auto-repair system");
  console.log("🤖 [AUTO-REPAIR] Boot diagnostic system enabled");
}
main();

// Token management
const telegramTokens = new Map();
function generateAuthToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 7) + 6;
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function storeAuthToken(telegramId: string, username: string): string {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  telegramTokens.set(token, { telegramId, username, expiresAt, used: false });
  console.log(`Generated token ${token} for ${telegramId} (${username})`);
  return token;
}

export function validateAuthToken(token: string, telegramId: string): boolean {
  const tokenData = telegramTokens.get(token);
  if (!tokenData || tokenData.used || new Date() > tokenData.expiresAt || tokenData.telegramId !== telegramId) {
    return false;
  }
  tokenData.used = true;
  console.log(`Token ${token} validated for ${telegramId}`);
  return true;
}

(global as any).validateAuthToken = validateAuthToken;
(global as any).lunaMonitorEnabled = false;
(global as any).recentTelegramAuth = new Map();

// Luna monitoring
const lunaMonitor = LunaErrorMonitor.getInstance();
lunaMonitor.enableForAdmin('telegram_5134006535');
setupLunaErrorHandlers();
console.log('🌙 Luna Error Monitor Enabled.');

// Telegram bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (botToken) {
  const bot = new TelegramBot(botToken, { polling: true });
  bot.on('message', async (msg: any) => {
    const { chat: { id: chatId }, text, from: { id: telegramId, username } } = msg;
    if (text !== '/start' && text !== '/login') return;
    
    try {
      const token = storeAuthToken(telegramId.toString(), username);
      const authResponse = await fetch('http://localhost:5000/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: telegramId.toString(), username, token })
      });
      
      if (authResponse.ok) {
        const gameUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}?telegramId=${telegramId}`;
        bot.sendMessage(chatId, `You're logged in! 🎮\n\nClick here to play: ${gameUrl}`);
      } else {
        bot.sendMessage(chatId, 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Bot auth error:', error);
      bot.sendMessage(chatId, 'Service temporarily unavailable.');
    }
  });
  console.log("[Telegram] Bot initialized");
}

// Express app
const app = express();
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Mount auto-repair and log streaming
  app.use(createAutoRepairRouter());
  app.use(createLogStreamRouter());
  console.log('🔧 [AUTO-REPAIR] System mounted at /auto-repair/');
  console.log('📊 [LOG-STREAM] Streaming at /logs/stream');
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error:', err);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
  });

  const PORT = process.env.PORT || 5000;
  
  server.listen({ port: PORT, host: "0.0.0.0", reusePort: true }, () => {
    console.log(`🚀 [SERVER] ClassikLustAITap serving on port ${PORT}`);
    console.log(`🔧 [AUTO-REPAIR] Live repair at http://localhost:${PORT}/auto-repair/status`);
    console.log(`📊 [LOG-STREAM] Live logs at http://localhost:${PORT}/logs/stream`);
  });
})();
