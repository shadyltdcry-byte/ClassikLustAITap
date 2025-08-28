/**
 * index.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 */


import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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

// Serve static files from client directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, '../client')));

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

  // Let routes.ts handle the server startup
  const server = await registerRoutes(app);
  console.log("Server initialized via routes.ts");
  
  // Remove duplicate frontend serving since routes.ts handles it
  return;



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

  // WebSocket removed to prevent port conflicts

  // Modular routes are already registered by registerRoutes(app)

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  // Serve React app static files (when built)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } else {
    // Serve a simple working game interface
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Character Tap Game</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            min-height: 100vh;
        }
        .container { max-width: 400px; margin: 0 auto; text-align: center; }
        .stats { background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .tap-button { 
            background: #ff6b6b; 
            color: white; 
            border: none; 
            padding: 30px; 
            border-radius: 50%; 
            font-size: 24px; 
            cursor: pointer; 
            width: 150px; 
            height: 150px; 
            margin: 20px;
            transition: transform 0.1s;
        }
        .tap-button:hover { transform: scale(1.1); }
        .tap-button:active { transform: scale(0.95); }
        .action-btn { 
            background: #4ecdc4; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            margin: 10px; 
            cursor: pointer; 
        }
        .character { font-size: 60px; margin: 20px; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .error { background: rgba(255,0,0,0.2); padding: 15px; border-radius: 8px; margin: 10px 0; }
        .success { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Character Tap Game</h1>
        
        <div id="auth-section">
            <div class="spinner"></div>
            <p>Loading your game...</p>
        </div>
        
        <div id="game-section" style="display:none;">
            <div class="character">👤</div>
            <div class="stats">
                <div><strong>LP:</strong> <span id="lp">0</span></div>
                <div><strong>Energy:</strong> <span id="energy">0</span>/<span id="maxEnergy">0</span></div>
                <div><strong>Level:</strong> <span id="level">1</span></div>
            </div>
            
            <button class="tap-button" id="tapBtn" onclick="tapCharacter()">TAP</button>
            
            <div>
                <button class="action-btn" onclick="spinWheel()">🎰 Spin Wheel</button>
                <button class="action-btn" onclick="showStats()">📊 Stats</button>
            </div>
            
            <div id="message"></div>
        </div>
    </div>

    <script>
        let user = null;
        let gameState = {
            lp: 0,
            energy: 1000,
            maxEnergy: 1000,
            level: 1,
            lpPerTap: 1.5
        };

        async function initGame() {
            try {
                // Check auth
                const storedId = localStorage.getItem('telegram_id');
                if (storedId) {
                    const authRes = await fetch('/api/auth/telegram/check?telegram_id=' + storedId);
                    const authData = await authRes.json();
                    
                    if (authData.authenticated) {
                        user = authData.user;
                        await loadUserData();
                        showGame();
                        return;
                    }
                }
                
                // Simple auth for demo
                const telegramId = prompt('Enter your Telegram ID (or any number for demo):') || '123456';
                localStorage.setItem('telegram_id', telegramId);
                
                const authRes = await fetch('/api/auth/telegram/check?telegram_id=' + telegramId);
                const authData = await authRes.json();
                
                if (authData.authenticated) {
                    user = authData.user;
                    await loadUserData();
                    showGame();
                } else {
                    showMessage('Authentication failed. Please refresh and try again.', 'error');
                }
                
            } catch (error) {
                console.error('Init error:', error);
                showMessage('Failed to connect to game server', 'error');
            }
        }

        async function loadUserData() {
            try {
                const res = await fetch('/api/user/' + user.id);
                const userData = await res.json();
                
                gameState.lp = userData.lp || 0;
                gameState.energy = userData.energy || 1000;
                gameState.maxEnergy = userData.maxEnergy || 1000;
                gameState.level = userData.level || 1;
                gameState.lpPerTap = userData.lpPerTap || 1.5;
                
                updateUI();
            } catch (error) {
                console.error('Load user data error:', error);
            }
        }

        async function tapCharacter() {
            if (gameState.energy <= 0) {
                showMessage('Not enough energy!', 'error');
                return;
            }
            
            try {
                const res = await fetch('/api/tap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                
                const result = await res.json();
                
                if (result.success) {
                    gameState.lp = result.newLp;
                    gameState.energy = result.newEnergy;
                    
                    showMessage('+' + result.lpGain.toFixed(1) + ' LP!', 'success');
                    updateUI();
                    
                    // Tap animation
                    const btn = document.getElementById('tapBtn');
                    btn.style.transform = 'scale(0.9)';
                    setTimeout(() => btn.style.transform = '', 100);
                } else {
                    showMessage(result.error || 'Tap failed', 'error');
                }
            } catch (error) {
                showMessage('Network error', 'error');
            }
        }

        async function spinWheel() {
            try {
                const res = await fetch('/api/wheel/spin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                
                const result = await res.json();
                
                if (result.success) {
                    showMessage('🎉 Won: ' + result.prize.name + '!', 'success');
                    await loadUserData(); // Refresh user data
                } else {
                    showMessage(result.error || 'Wheel spin failed', 'error');
                }
            } catch (error) {
                showMessage('Wheel unavailable', 'error');
            }
        }

        async function showStats() {
            try {
                const res = await fetch('/api/stats/' + user.id);
                const stats = await res.json();
                
                showMessage(
                    'Total Taps: ' + (stats.totalTaps || 0) + '\\n' +
                    'Total LP Earned: ' + (stats.totalLpEarned || 0) + '\\n' +
                    'Time Played: ' + Math.floor((stats.timeSpent || 0) / 60) + ' min',
                    'success'
                );
            } catch (error) {
                showMessage('Stats unavailable', 'error');
            }
        }

        function showGame() {
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('game-section').style.display = 'block';
            updateUI();
        }

        function updateUI() {
            document.getElementById('lp').textContent = Math.floor(gameState.lp);
            document.getElementById('energy').textContent = Math.floor(gameState.energy);
            document.getElementById('maxEnergy').textContent = gameState.maxEnergy;
            document.getElementById('level').textContent = gameState.level;
        }

        function showMessage(text, type = '') {
            const msg = document.getElementById('message');
            msg.innerHTML = '<div class="' + type + '">' + text + '</div>';
            setTimeout(() => msg.innerHTML = '', 3000);
        }

        // Energy regeneration
        setInterval(() => {
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy = Math.min(gameState.energy + 5, gameState.maxEnergy);
                updateUI();
            }
        }, 5000);

        // Initialize game
        initGame();
    </script>
</body>
</html>
      `);
    });
  }

  // Server startup is handled by routes.ts - no duplicate listen() needed
})();

console.log('[Index] Setup complete - server startup handled by routes.ts');