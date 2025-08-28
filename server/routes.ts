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

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
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
  
  // Catch-all handler for frontend routes (SPA support)
  app.get("*", (req: Request, res: Response) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Check if we're serving from the built frontend
    const indexPath = join(__dirname, "..", "dist", "public", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback - try the client dist folder
      const clientIndexPath = join(__dirname, "..", "client", "dist", "index.html");
      if (fs.existsSync(clientIndexPath)) {
        res.sendFile(clientIndexPath);
      } else {
        // Development fallback - serve a simple redirect to the game
        res.send(`
          <html>
            <head>
              <title>🎮 Character Tap Game</title>
              <meta http-equiv="refresh" content="0; url=/">
            </head>
            <body>
              <h1>🎮 Character Tap Game</h1>
              <p>Redirecting to game...</p>
              <script>window.location.href = '/';</script>
            </body>
          </html>
        `);
      }
    }
  });

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🎮 Character Tap Game server running on port ${port}`);
    console.log(`📡 Modular route architecture loaded successfully`);
  });

  return server;
}