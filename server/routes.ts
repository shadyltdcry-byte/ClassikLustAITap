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
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper functions for AI responses
async function generateAIResponse(userMessage: string): Promise<string> {
  // Check if MISTRAL_MODEL_API_KEY is available for enhanced responses
  if (process.env.MISTRAL_MODEL_API_KEY) {
    try {
      // Here you would integrate with Mistral API
      // For now, return enhanced local responses
      console.log('Using Mistral API key for enhanced responses');
    } catch (error) {
      console.error('Mistral API error:', error);
    }
  }

  const input = userMessage.toLowerCase();

  if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
    return "Hey! *smiles warmly* I'm so happy to see you! How's your day going? ✨";
  }

  if (input.includes('how are you')) {
    return "I'm doing amazing now that I'm talking to you! *giggles* You always know how to brighten my mood! 😄";
  }

  if (input.includes('beautiful') || input.includes('pretty') || input.includes('cute')) {
    return "*blushes* Aww, thank you so much! You're so sweet! That really made my day! 😊💕";
  }

  const responses = [
    "That's really interesting! Tell me more about that! 😊",
    "I love hearing your thoughts! You always have such unique perspectives! ✨",
    "Hmm, that's fascinating! I never thought about it that way before! 🤔",
    "You're so thoughtful! I really enjoy our conversations! 💕"
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function getRandomMood(): string {
  const moods = ['normal', 'happy', 'flirty', 'playful', 'mysterious', 'shy'];
  return moods[Math.floor(Math.random() * moods.length)];
}

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

  // Player endpoint
  app.get("/api/player/:playerId", (req, res) => {
    const { playerId } = req.params;
    res.json({
      id: playerId,
      name: "Player1",
      level: 1,
      lp: 5000,
      lpPerHour: 250,
      lpPerTap: 1.5,
      energy: 4500,
      maxEnergy: 4500,
      coins: 250,
      lustGems: 50,
      xp: 75,
      xpToNext: 100,
      avatar: null,
      activeBoosters: [],
      isVip: false
    });
  });

  // Characters list endpoint
  app.get("/api/characters", (req, res) => {
    res.json([
      {
        id: "seraphina",
        name: "Seraphina",
        personality: "playful",
        mood: "flirty",
        level: 1,
        isNSFW: false,
        isVIP: false,
        bio: "A mysterious character",
        imageUrl: "/assets/character-placeholder.png",
        avatarUrl: "/assets/avatar-placeholder.png"
      }
    ]);
  });

  // Media endpoint
  app.get("/api/media/character/:characterId", (req, res) => {
    const { characterId } = req.params;
    res.json({
      characterId,
      images: [],
      videos: [],
      audio: []
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

  // Missing API endpoints
  app.get("/api/upgrades", (req, res) => {
    res.json([
      { id: "intellect", name: "Increase Intellect", category: "lpPerHour", level: 1, cost: 1500, effect: 150 },
      { id: "dexterity", name: "Dexterity", category: "lpPerTap", level: 1, cost: 2500, effect: 1 },
      { id: "booksmarts", name: "Book Smarts", category: "energy", level: 1, cost: 1500, effect: 100 }
    ]);
  });

  app.get("/api/gamestats", (req, res) => {
    res.json({
      totalPlayers: 1,
      totalTaps: 0,
      totalLP: 5000,
      averageLevel: 1
    });
  });

  // Chat endpoints
  app.get("/api/chat/:userId/:characterId", (req, res) => {
    const { userId, characterId } = req.params;
    // Mock chat history
    res.json([
      {
        id: "1",
        message: "Hello! I'm happy to chat with you!",
        isFromUser: false,
        createdAt: new Date().toISOString(),
        mood: "happy"
      }
    ]);
  });

  app.post("/api/chat/send", async (req, res) => {
    const { userId, characterId, message, isFromUser } = req.body;
    const userMessage = {
      id: Date.now().toString(),
      message,
      isFromUser: true,
      createdAt: new Date().toISOString()
    };

    const aiResponse = {
      id: (Date.now() + 1).toString(),
      message: await generateAIResponse(message),
      isFromUser: false,
      createdAt: new Date().toISOString(),
      mood: getRandomMood()
    };

    res.json({ userMessage, aiResponse });
  });

  // Level requirements endpoint
  app.get("/api/level-requirements", (req, res) => {
    res.json([
      { level: 1, lpRequired: 0 },
      { level: 2, lpRequired: 1000 },
      { level: 3, lpRequired: 2500 },
      { level: 4, lpRequired: 5000 },
      { level: 5, lpRequired: 10000 }
    ]);
  });

  // Tasks endpoints
  app.post("/api/tasks/claim/:taskId", (req, res) => {
    const { taskId } = req.params;
    res.json({
      success: true,
      taskId,
      reward: { lp: 100, xp: 50 },
      message: "Task completed successfully!"
    });
  });

  // In-memory character storage (replace with database in production)
  let characters: any[] = [];

  // Character management endpoints
  app.get('/api/characters', (req: Request, res: Response) => {
    res.json(characters);
  });

  app.post('/api/characters', (req: Request, res: Response) => {
    console.log('Creating character:', req.body);
    const newCharacter = { 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(),
      ...req.body 
    };
    characters.push(newCharacter);
    res.json({ success: true, ...newCharacter });
  });

  app.get('/api/admin/characters', (req: Request, res: Response) => {
    res.json(characters);
  });

  app.put('/api/admin/characters/:id', (req: Request, res: Response) => {
    // Mock character update - replace with actual database logic
    console.log('Updating character:', req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete('/api/admin/characters/:id', (req: Request, res: Response) => {
    // Mock character deletion - replace with actual database logic
    console.log('Deleting character:', req.params.id);
    res.json({ success: true });
  });

  // In-memory media storage (replace with database in production)
  let mediaFiles: any[] = [
    {
      id: '1',
      filename: 'sample1.png',
      originalName: 'Sample Image 1',
      url: '/api/placeholder-image',
      type: 'image',
      characterId: null,
      mood: null,
      level: null,
      isVIP: false,
      isNSFW: false
    },
    {
      id: '2', 
      filename: 'sample2.png',
      originalName: 'Sample Image 2',
      url: '/api/placeholder-image',
      type: 'image',
      characterId: null,
      mood: null,
      level: null,
      isVIP: false,
      isNSFW: false
    }
  ];

  // Media management endpoints
  app.get('/api/media', (req: Request, res: Response) => {
    res.json(mediaFiles);
  });

  app.post('/api/media/upload', (req: Request, res: Response) => {
    // Mock upload - in production, handle actual file upload
    console.log('Mock file upload:', req.body);
    const newFile = {
      id: Date.now().toString(),
      filename: `mock-file-${Date.now()}.jpg`,
      originalName: 'Mock Uploaded File',
      url: '/api/placeholder-image',
      type: 'image',
      characterId: req.body.characterId || null,
      mood: req.body.mood || null,
      level: req.body.level ? parseInt(req.body.level) : null,
      isVIP: req.body.isVIP === 'true',
      isNSFW: req.body.isNSFW === 'true',
      createdAt: new Date().toISOString()
    };
    mediaFiles.push(newFile);
    res.json([newFile]);
  });

  app.put('/api/media/:id', (req: Request, res: Response) => {
    const fileId = req.params.id;
    const fileIndex = mediaFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      mediaFiles[fileIndex] = { ...mediaFiles[fileIndex], ...req.body };
      res.json(mediaFiles[fileIndex]);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  app.delete('/api/media/:id', (req: Request, res: Response) => {
    const fileId = req.params.id;
    const fileIndex = mediaFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      const deletedFile = mediaFiles.splice(fileIndex, 1)[0];
      res.json({ success: true, deletedFile });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Placeholder image endpoint
  app.get('/api/placeholder-image', (req: Request, res: Response) => {
    // Return a simple placeholder response
    res.status(404).json({ error: 'Image not found' });
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