/** 
 * routes.ts - Custom Game Routes
 * Last Edited: 2025-08-18 by Assistant
 * 
 * Your custom plugin routes without database dependency
 */

import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Game state endpoint (mock data for now)
  app.get("/api/game/state", (req, res) => {
    res.json({
      player: {
        id: "player1",
        name: "Player1",
        level: 1,
        lp: 5000,
        energy: 800,
        maxEnergy: 1000,
        charisma: 150,
        lpPerHour: 125,
        lpPerTap: 1.5
      },
      characters: [{
        id: "seraphina",
        name: "Seraphina",
        personality: "playful",
        mood: "flirty",
        level: 1,
        isNSFW: false,
        isVIP: false
      }]
    });
  });

  // Character tap endpoint
  app.post("/api/game/tap", (req, res) => {
    try {
      const { playerId } = req.body;
      const lpGain = Math.floor(1.5); // Base LP per tap
      const newTotal = 5000 + lpGain; // This would normally come from database
      
      res.json({
        success: true,
        lpGain,
        newTotal,
        energyUsed: 1,
        playerId
      });
    } catch (error) {
      console.error('Tap endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // User initialization endpoint
  app.post("/api/user/init", (req, res) => {
    res.json({
      success: true,
      user: {
        id: "default-player",
        name: "Player1",
        level: 1,
        lp: 5000,
        energy: 800,
        maxEnergy: 1000,
        charisma: 150,
        lpPerHour: 125,
        lpPerTap: 1.5,
        createdAt: new Date().toISOString()
      }
    });
  });

  // Settings endpoint
  app.get("/api/settings", (req, res) => {
    res.json({
      nsfwEnabled: false,
      vipEnabled: false,
      autoSave: true,
      soundEnabled: true,
      notifications: true
    });
  });

  // Character endpoints
  app.get("/api/character/selected/:playerId", (req, res) => {
    const { playerId } = req.params;
    res.json({
      id: "seraphina",
      name: "Seraphina",
      personality: "playful",
      mood: "flirty",
      level: 1,
      isNSFW: false,
      isVIP: false,
      playerId
    });
  });

  // Player stats endpoint
  app.get("/api/stats/:playerId", (req, res) => {
    const { playerId } = req.params;
    res.json({
      playerId,
      level: 1,
      totalLp: 5000,
      totalTaps: 0,
      totalEnergy: 800,
      maxEnergy: 1000,
      lpPerHour: 125,
      lpPerTap: 1.5,
      charisma: 150,
      upgrades: {
        intellect: 1,
        dexterity: 1,
        booksmarts: 1
      }
    });
  });

  // Player upgrades endpoint
  app.get("/api/upgrades/:playerId", (req, res) => {
    const { playerId } = req.params;
    res.json([
      { id: "intellect", name: "Increase Intellect", category: "lpPerHour", level: 1, cost: 1500, effect: 150, playerId },
      { id: "dexterity", name: "Dexterity", category: "lpPerTap", level: 1, cost: 2500, effect: 1, playerId },
      { id: "booksmarts", name: "Book Smarts", category: "energy", level: 1, cost: 1500, effect: 100, playerId }
    ]);
  });

  // Plugin endpoints for your custom plugins
  app.get("/api/plugins/upgrades", (req, res) => {
    res.json([
      { id: "intellect", name: "Increase Intellect", category: "lpPerHour", level: 1, cost: 1500, effect: 150 },
      { id: "dexterity", name: "Dexterity", category: "lpPerTap", level: 1, cost: 2500, effect: 1 },
      { id: "booksmarts", name: "Book Smarts", category: "energy", level: 1, cost: 1500, effect: 100 }
    ]);
  });

  app.get("/api/plugins/boosters", (req, res) => {
    res.json([]);
  });

  app.get("/api/plugins/achievements", (req, res) => {
    res.json([
      { id: "first_tap", name: "First Tap", description: "Tap your first character", unlocked: true },
      { id: "level_up", name: "Level Up", description: "Reach level 2", unlocked: false }
    ]);
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const distPath = join(__dirname, "../dist/public");
    app.use(express.static(distPath));
    
    // Handle client-side routing
    app.get("*", (req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  } else {
    // Development: integrate with Vite
    const { setupViteDevServer } = await import("./vite");
    await setupViteDevServer(app);
  }

  const server = createServer(app);
  return server;
}