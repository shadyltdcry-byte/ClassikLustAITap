/** 
 * routes.ts - Modular Game Routes Orchestrator
 * Last Edited: 2025-10-22 by Assistant
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
import { registerUpgradeRoutes } from './routes/upgradeRoutes.js';
//import { registerDebuggerRoutes } from './routes/debuggerRoutes.js';

// ... inside registerRoutes()
//registerDebuggerRoutes(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
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
  console.log('📡[SYSTEM] Registering Modular Routing Architecture...');
  
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
  registerUpgradeRoutes(app);

  console.log('📡[SYSTEM] Modular Routing Architecture initialized SUCCESSFULLY.');

  // Settings endpoint
  app.get("/api/settings", (req: Request, res: Response) => {
    res.json({
      nsfwEnabled: true,
      vipEnabled: false,
      eventEnabled: false,
      autoSave: true,
      soundEnabled: true,
      notifications: true,
      gameVersion: '2.1.0',
      modularRoutes: true
    });
  });


  // Setup Vite dev server for development or serve static files for production
  if (process.env.NODE_ENV === "production") {
    // Production: serve static files
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  } else {
    // Development: use Vite dev server
    const { setupViteDevServer } = await import("./vite");
    await setupViteDevServer(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🎮[SERVER] Game started successfully, running on port ${port}`);
  });

  return server;
}
