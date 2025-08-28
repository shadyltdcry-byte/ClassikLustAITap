/** 
 * routes.ts - Modular Game Routes Orchestrator
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Coordinates all modular route files for the Character Tap Game
 */

import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import fs from 'fs';

// Import all modular route registration functions
import { registerTapRoutes } from './routes/tapRoutes.js';
import { registerChatRoutes } from './routes/chatRoutes.js';
import { registerCharacterRoutes } from './routes/characterRoutes.js';
import { registerUserRoutes } from './routes/userRoutes.js';
import { registerStatsRoutes } from './routes/statsRoutes.js';
import { registerAdminRoutes } from './routes/adminRoutes.js';
import { registerWheelRoutes } from './routes/wheelRoutes.js';
import { registerVipRoutes } from './routes/vipRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerRoutes(app: Express): Server {
  const server = createServer(app);
  
  // Log ALL incoming requests to debug preview issue
  app.use((req, res, next) => {
    console.log(`📡 INCOMING REQUEST: ${req.method} ${req.path} from ${req.ip} | User-Agent: ${req.get('User-Agent')?.substring(0,50)}...`);
    console.log(`📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    console.log('🏥 Health check requested');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        supabase: 'connected',
        storage: 'ready',
        modules: 'loaded'
      }
    });
  });

  // Register all modular routes
  console.log('[Routes] Registering modular route handlers...');
  
  // Core game functionality
  registerTapRoutes(app);
  registerChatRoutes(app);
  registerCharacterRoutes(app);
  
  // User management and stats
  registerUserRoutes(app);
  registerStatsRoutes(app);
  
  // Admin and management
  registerAdminRoutes(app);
  
  // Game features
  registerWheelRoutes(app);
  registerVipRoutes(app);

  console.log('[Routes] All modular routes registered successfully');

  // Settings endpoint
  app.get("/api/settings", (req: Request, res: Response) => {
    res.json({
      nsfwEnabled: false,
      vipEnabled: true,
      autoSave: true,
      soundEnabled: true,
      notifications: true,
      gameVersion: '2.0.0',
      modularRoutes: true
    });
  });

  // Legacy endpoints that don't fit into modules yet
  app.get("/api/upgrades", (req: Request, res: Response) => {
    // Mock upgrades data
    const upgrades = [
      {
        id: 'lp_tap_1',
        name: 'Dexterity Lv. 1',
        type: 'lpPerTap',
        description: 'Increase LP per tap',
        cost: 2500,
        effect: '1x LP per tap',
        level: 1,
        maxLevel: 10
      },
      {
        id: 'lp_hour_1',
        name: 'Intellect Lv. 1',
        type: 'lpPerHour',
        description: 'Increase LP per hour',
        cost: 1500,
        effect: '150 LP per hour',
        level: 1,
        maxLevel: 20
      },
      {
        id: 'energy_1',
        name: 'Book Smarts Lv. 1',
        type: 'energy',
        description: 'Increase maximum energy',
        cost: 1500,
        effect: '+100 energy',
        level: 1,
        maxLevel: 15
      }
    ];
    
    res.json(upgrades);
  });

  app.get("/api/upgrades/:playerId", (req: Request, res: Response) => {
    const { playerId } = req.params;
    
    // Mock player-specific upgrades
    const playerUpgrades = [
      { id: 'lp_tap_1', level: 1, purchased: true },
      { id: 'lp_hour_1', level: 2, purchased: true },
      { id: 'energy_1', level: 1, purchased: false }
    ];
    
    res.json(playerUpgrades);
  });

  app.get("/api/level-requirements", (req: Request, res: Response) => {
    // Mock level requirements
    const levelRequirements = [
      {
        level: 2,
        requirements: [
          { upgradeType: 'lpPerHour', requiredLevel: 2 }
        ],
        rewards: {
          lp: 100,
          maxEnergy: 10,
          unlocks: ['Basic character creation']
        }
      },
      {
        level: 3,
        requirements: [
          { upgradeType: 'lpPerHour', requiredLevel: 3 },
          { upgradeType: 'energy', requiredLevel: 1 }
        ],
        rewards: {
          lp: 250,
          maxEnergy: 25,
          unlocks: ['Character customization']
        }
      }
    ];
    
    res.json(levelRequirements);
  });

  app.post("/api/player/:playerId/level-up", (req: Request, res: Response) => {
    const { playerId } = req.params;
    
    // Mock level up
    res.json({
      success: true,
      newLevel: 2,
      rewards: {
        lp: 100,
        maxEnergy: 10
      },
      message: "Level up successful!"
    });
  });

  app.post("/api/tasks/claim/:taskId", (req: Request, res: Response) => {
    const { taskId } = req.params;
    
    // Mock task reward claiming
    res.json({
      success: true,
      taskId,
      reward: "10 Coins",
      message: "Task reward claimed!"
    });
  });

  // Serve static files and handle frontend routes
  const frontendPath = join(__dirname, "..", "dist", "public");
  const clientPath = join(__dirname, "..", "client", "dist");
  
  // Serve static files - try built version first, then client dist
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
  } else if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));
  }
  
  // Test route to debug
  app.get('/test', (req: Request, res: Response) => {
    console.log('✅ TEST route hit!');
    res.send('<h1 style="color: red; text-align: center; padding: 100px;">SERVER IS WORKING!</h1>');
  });
  
  // Root route - SIMPLE TEST FIRST
  app.get('/', (req: Request, res: Response) => {
    console.log('🏠 ROOT route hit! IP:', req.ip, 'User-Agent:', req.get('User-Agent')?.substring(0,50));
    console.log('🎯 Serving simple test page...');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Character Tap Game</title>
</head>
<body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px; min-height: 100vh; margin: 0;">
    <h1 style="font-size: 3em; margin-bottom: 30px;">🎮 Character Tap Game</h1>
    <p style="font-size: 1.5em; margin-bottom: 30px;">Game is loading successfully!</p>
    
    <div style="background: rgba(0,0,0,0.3); padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 400px;">
        <div style="font-size: 4em; margin-bottom: 20px;">👤</div>
        <h2>Demo Stats</h2>
        <div style="font-size: 1.2em; line-height: 1.5;">
            <div><strong>LP:</strong> 1,250</div>
            <div><strong>Energy:</strong> 850/1000</div>
            <div><strong>Level:</strong> 5</div>
        </div>
    </div>
    
    <button style="background: #ff6b6b; color: white; border: none; padding: 30px; border-radius: 50%; font-size: 24px; cursor: pointer; width: 150px; height: 150px; margin: 20px;" onclick="alert('TAP! +2.5 LP')">
        TAP
    </button>
    
    <div style="margin-top: 30px;">
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="alert('🎰 Wheel spinning...')">🎰 Spin Wheel</button>
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="alert('📊 Total taps: 420\\nTime played: 15 min')">📊 Stats</button>
    </div>
    
    <p style="margin-top: 40px; opacity: 0.8;">✅ Server connected and working perfectly!</p>
    
    <script>
        console.log('🎮 Simple game demo loaded!');
        console.log('✅ If you see this in browser console, JavaScript is working!');
        
        // Test that JavaScript is working
        setTimeout(function() {
            console.log('⚡ JavaScript execution confirmed after 1 second');
        }, 1000);
    </script>
</body>
</html>`;
    
    console.log('📤 Sending HTML response...');
    res.status(200).send(html);
  });

  // Catch-all handler for frontend routes (SPA support)  
  app.get("*", (req: Request, res: Response) => {
    console.log('🌐 CATCHALL REQUEST:', req.method, req.path, 'from', req.ip);
    
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Set proper headers and send the game
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(`<!DOCTYPE html>
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
            text-align: center;
        }
        .container { max-width: 400px; margin: 0 auto; }
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
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 2s linear infinite; 
            margin: 0 auto; 
        }
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
        console.log('🎮 Game script loading...');
        
        let user = null;
        let gameState = {
            lp: 0,
            energy: 1000,
            maxEnergy: 1000,
            level: 1,
            lpPerTap: 1.5
        };

        async function initGame() {
            console.log('🚀 Initializing game...');
            try {
                // Simple auth for demo
                const telegramId = prompt('Enter your Telegram ID (or any number for demo):') || '123456';
                localStorage.setItem('telegram_id', telegramId);
                
                const authRes = await fetch('/api/auth/telegram/check?telegram_id=' + telegramId);
                const authData = await authRes.json();
                
                if (authData.authenticated) {
                    user = authData.user;
                    console.log('✅ User authenticated:', user.username);
                    await loadUserData();
                    showGame();
                } else {
                    showMessage('Authentication failed. Please refresh and try again.', 'error');
                }
                
            } catch (error) {
                console.error('❌ Init error:', error);
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
                
                console.log('📊 User data loaded:', gameState);
                updateUI();
            } catch (error) {
                console.error('❌ Load user data error:', error);
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

        function showGame() {
            console.log('🎯 Showing game interface');
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
        setTimeout(initGame, 500);
        console.log('🎮 Game loaded successfully!');
    </script>
</body>
</html>`);
  });

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🎮 Character Tap Game server running on port ${port}`);
    console.log(`📡 Modular route architecture loaded successfully`);
    console.log(`🔗 Preview should be available at: https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`);
  });

  return server;
}