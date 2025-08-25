/** 
 * routes.ts - Custom Game Routes
 * Last Edited: 2025-08-18 by Assistant
 * 
 * Your custom plugin routes without database dependency
 */

import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import SupabaseStorage from '../shared/supabase-storage'
import jwt from 'jsonwebtoken';
import { storage } from '../shared/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Telegram authentication verification
function verifyTelegramAuth(data: any, botToken: string): boolean {
  const { hash, ...authData } = data;
  
  // Create data-check-string
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');
  
  // Create secret key
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  
  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return hash === expectedHash;
}

// Generate JWT token for authenticated users
function generateJWT(userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

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

 /** Game state endpoint (mock data for now)
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
  });*/

  
// in your backend route setup
app.get('/api/admin/plugins/stats', async (req, res) => {
  const stats = await core.runCommand('getPluginStats', {});
  res.json(stats);
});
  
  // Character tap endpoint  
  app.post("/api/game/tap", async (req, res) => {
    try {
      const { playerId } = req.body;
      
      // If playerId is not a valid UUID, use mock logic
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        const lpGain = 1.5;
        return res.json({
          success: true,
          lpGain,
          newTotal: 5000 + lpGain, // Mock calculation
          energyUsed: 1,
          playerId
        });
      }
      
      const user = await storage.getUser(playerId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has enough energy
      if (user.energy < 1) {
        return res.status(400).json({ error: 'Not enough energy' });
      }
      
      // Calculate new values
      const lpGain = user.lpPerTap || 1.5;
      const newTotal = user.lp + lpGain;
      const newEnergy = Math.max(0, user.energy - 1);
      
      // Update user in database
      await storage.updateUser(playerId, {
        lp: newTotal,
        energy: newEnergy
      });

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

  // Additional tap endpoint for frontend compatibility
  app.post("/api/tap", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has enough energy
      if (user.energy < 1) {
        return res.status(400).json({ error: 'Not enough energy' });
      }
      
      // Calculate new values
      const lpGain = user.lpPerTap || 1.5;
      const newLp = user.lp + lpGain;
      const newEnergy = Math.max(0, user.energy - 1);
      
      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp,
        energy: newEnergy
      });
      
      // Update game stats - track cumulative statistics
      try {
        // Use SQL increment for better performance and accuracy
        const { error } = await storage.supabase.rpc('increment_user_stats', {
          p_user_id: userId,
          p_taps: 1,
          p_lp_earned: lpGain,
          p_energy_used: 1
        });
        
        if (error) {
          console.error('Error updating game stats with RPC:', error);
          // Fallback to manual update
          const currentStats = await storage.getUserStats(userId);
          await storage.updateUserStats(userId, {
            totalTaps: (currentStats.totalTaps || 0) + 1,
            totalLpEarned: (currentStats.totalLpEarned || 0) + lpGain,
            totalEnergyUsed: (currentStats.totalEnergyUsed || 0) + 1
          });
        }
      } catch (statsError) {
        console.error('Error updating game stats:', statsError);
        // Don't fail the tap if stats update fails
      }
      
      res.json({
        success: true,
        lpGain,
        energyUsed: 1,
        newLp,
        newEnergy,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error processing tap:', error);
      res.status(500).json({ error: 'Failed to process tap' });
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
  app.get("/api/character/selected/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const selectedCharacter = await storage.getSelectedCharacter(playerId);
      
      if (!selectedCharacter) {
        // Return default character if none selected
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
      } else {
        res.json(selectedCharacter);
      }
    } catch (error) {
      console.error('Error fetching selected character:', error);
      res.status(500).json({ error: 'Failed to fetch selected character' });
    }
  });

  // Player endpoint
  app.get("/api/player/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      
      // If playerId is not a valid UUID, return default mock data
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        console.log(`Invalid UUID playerId: ${playerId}, returning mock data`);
        return res.json({
          id: playerId,
          username: "Player",
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          energy: 1000,
          maxEnergy: 1000,
          coins: 0,
          xp: 0,
          xpToNext: 100,
          isVip: false,
          nsfwEnabled: false,
          charismaPoints: 0,
          vipStatus: false,
          nsfwConsent: false,
          charisma: 0,
          createdAt: new Date().toISOString()
        });
      }

      let user = await storage.getUser(playerId);
      
      if (!user) {
        // Create default user if not exists
        const uniqueUsername = `Player${Math.floor(Math.random() * 10000)}`;
        user = await storage.createUser({
          id: playerId,
          username: uniqueUsername,
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          energy: 1000,
          maxEnergy: 1000,
          coins: 0,
          xp: 0,
          xpToNext: 100,
          isVip: false,
          nsfwEnabled: false,
          charismaPoints: 0
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching player:', error);
      res.status(500).json({ error: 'Failed to fetch player data' });
    }
  });

  // Player update endpoint
  app.put("/api/player/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const updates = req.body;

      // If playerId is not a valid UUID, just return success with mock data
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        console.log(`Invalid UUID playerId for update: ${playerId}, returning mock success`);
        return res.json({
          success: true,
          playerId,
          message: "Player updated successfully (mock)",
          user: {
            id: playerId,
            username: "Player",
            level: updates.level || 1,
            lp: updates.lp || 5000,
            lpPerHour: updates.lpPerHour || 250,
            lpPerTap: updates.lpPerTap || 1.5,
            energy: updates.energy || 1000,
            maxEnergy: updates.maxEnergy || 1000,
            ...updates
          }
        });
      }

      const updatedUser = await storage.updateUser(playerId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        playerId,
        message: "Player updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json({ error: 'Failed to update player data' });
    }
  });

  // Characters list endpoint
  app.get("/api/characters", async (req, res) => {
    try {
      // For now, only return the default character that users have access to
      const defaultCharacter = {
        id: "seraphina",
        name: "Seraphina", 
        personality: "playful",
        personalityStyle: "flirty",
        chatStyle: "casual",
        backstory: "A mysterious and playful character who loves to chat and have fun!",
        bio: "Seraphina is your default companion, always ready for a conversation!",
        interests: "Gaming, chatting, having fun",
        quirks: "Uses lots of emojis and exclamation points",
        likes: "Friendly conversations, games, excitement",
        dislikes: "Boring topics, rudeness",
        mood: "flirty",
        level: 1,
        requiredLevel: 1,
        isNsfw: false,
        isVip: false,
        isEvent: false,
        isWheelReward: false,
        responseTimeMin: 1000,
        responseTimeMax: 3000,
        responseTimeMs: 2000,
        randomPictureSending: true,
        randomChatResponsesEnabled: true,
        pictureSendChance: 15,
        chatSendChance: 20,
        moodDistribution: {
          normal: 20,
          happy: 25,
          flirty: 30,
          playful: 15,
          mysterious: 5,
          shy: 5
        },
        customGreetings: [
          "Hey there! Ready for some fun? 😊",
          "Hi! I'm so excited to chat with you! ✨", 
          "Hello! What's on your mind today? 💕"
        ],
        customResponses: [
          "That's really interesting! Tell me more! 😄",
          "I love hearing your thoughts! 💭",
          "You're so sweet! 🥰"
        ],
        customTriggerWords: [],
        imageUrl: "/default-character.jpg",
        avatarUrl: "/default-avatar.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      res.json([defaultCharacter]);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
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
  app.get("/api/stats/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const user = await storage.getUser(playerId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get actual game stats from database
      const gameStats = await storage.getUserStats(playerId);
      
      res.json({
        playerId,
        level: user.level,
        totalLp: user.lp,
        totalTaps: gameStats.totalTaps || 0,
        totalLpEarned: gameStats.totalLpEarned || 0,
        totalEnergy: user.energy,
        totalEnergyUsed: gameStats.totalEnergyUsed || 0,
        maxEnergy: user.maxEnergy,
        lpPerHour: user.lpPerHour,
        lpPerTap: user.lpPerTap,
        charisma: user.charisma || 0,
        sessionsPlayed: gameStats.sessionsPlayed || 0,
        upgrades: {
          intellect: 1,
          dexterity: 1,
          booksmarts: 1
        }
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ error: 'Failed to fetch player stats' });
    }
  });

  // Player upgrades endpoint
  app.get("/api/upgrades/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const upgrades = await storage.getUserUpgrades(playerId);
      res.json(upgrades);
    } catch (error) {
      console.error('Error fetching player upgrades:', error);
      res.status(500).json({ error: 'Failed to fetch player upgrades' });
    }
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
app.get("/api/chat/:userId/:characterId", async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    const messages = await storage.getChatMessages(userId, characterId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat/:userId/:characterId", async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    const { message, isFromUser, mood, type = 'text' } = req.body;
    
    if (!message || typeof isFromUser !== 'boolean') {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const chatMessage = await storage.createChatMessage({
      userId,
      characterId,
      message,
      isFromUser,
      mood: mood || 'normal',
      type
    });
    
    res.json(chatMessage);
  } catch (error) {
    console.error("Error saving chat message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Chat endpoints
  app.get("/api/chat/:userId/:characterId", (req, res) => {
    const { userId, characterId } = req.params;
    
    try {
      const chatStoragePath = path.join(__dirname, 'chat-storage.json');
      let chatStorage: { conversations: { [key: string]: any[] } } = { conversations: {} };
      
      if (fs.existsSync(chatStoragePath)) {
        const data = fs.readFileSync(chatStoragePath, 'utf8');
        chatStorage = JSON.parse(data);
      }
      
      const conversationKey = `${userId}-${characterId}`;
      const conversation = chatStorage.conversations[conversationKey] || [
        {
          id: "1",
          message: "Hello! I'm happy to chat with you!",
          isFromUser: false,
          createdAt: new Date().toISOString(),
          mood: "happy"
        }
      ];
      
      res.json(conversation);
    } catch (error) {
      console.error('Error loading chat history:', error);
      res.json([
        {
          id: "1",
          message: "Hello! I'm happy to chat with you!",
          isFromUser: false,
          createdAt: new Date().toISOString(),
          mood: "happy"
        }
      ]);
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { userId, characterId, message, isFromUser } = req.body;
      
      if (!userId || !characterId || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
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

    // Save conversation to JSON file
    try {
      const chatStoragePath = path.join(__dirname, 'chat-storage.json');
      let chatStorage: { conversations: { [key: string]: any[] } } = { conversations: {} };
      
      if (fs.existsSync(chatStoragePath)) {
        const data = fs.readFileSync(chatStoragePath, 'utf8');
        chatStorage = JSON.parse(data);
      }
      
      const conversationKey = `${userId}-${characterId}`;
      if (!chatStorage.conversations[conversationKey]) {
        chatStorage.conversations[conversationKey] = [];
      }
      
      // Add both messages to conversation
      chatStorage.conversations[conversationKey].push(userMessage, aiResponse);
      
      // Keep only last 100 messages per conversation to prevent file from getting too large
      if (chatStorage.conversations[conversationKey].length > 100) {
        chatStorage.conversations[conversationKey] = chatStorage.conversations[conversationKey].slice(-100);
      }
      
      fs.writeFileSync(chatStoragePath, JSON.stringify(chatStorage, null, 2));
      console.log(`Saved conversation for ${userId}-${characterId} to JSON file`);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }

    res.json({ userMessage, aiResponse });
    } catch (error) {
      console.error('Chat send error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
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

  // Player level-up endpoint
  app.post("/api/player/:playerId/level-up", (req, res) => {
    const { playerId } = req.params;
    const { targetLevel } = req.body;

    // In a real app, you'd validate requirements and update database here
    // For now, just return success
    res.json({
      success: true,
      playerId,
      newLevel: targetLevel || 2,
      rewards: {
        lp: 500,
        maxEnergy: 100
      },
      message: "Level up successful!",
      timestamp: new Date().toISOString()
    });
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
  let characters: any[] = [
    {
      id: "seraphina",
      name: "Seraphina",
      personality: "playful",
      personalityStyle: "flirty",
      chatStyle: "casual",
      backstory: "A mysterious and playful character who loves to chat and have fun!",
      bio: "Seraphina is your default companion, always ready for a conversation!",
      interests: "Gaming, chatting, having fun",
      quirks: "Uses lots of emojis and exclamation points",
      likes: "Friendly conversations, games, excitement",
      dislikes: "Boring topics, rudeness",
      mood: "flirty",
      level: 1,
      requiredLevel: 1,
      isNsfw: false,
      isVip: false,
      isEvent: false,
      isWheelReward: false,
      responseTimeMin: 1000,
      responseTimeMax: 3000,
      responseTimeMs: 2000,
      randomPictureSending: true,
      randomChatResponsesEnabled: true,
      pictureSendChance: 15,
      chatSendChance: 20,
      moodDistribution: {
        normal: 20,
        happy: 25,
        flirty: 30,
        playful: 15,
        mysterious: 5,
        shy: 5
      },
      customGreetings: [
        "Hey there! Ready for some fun? 😊",
        "Hi! I'm so excited to chat with you! ✨",
        "Hello! What's on your mind today? 💕"
      ],
      customResponses: [
        "That's really interesting! Tell me more! 😄",
        "I love hearing your thoughts! 💭",
        "You're so sweet! 🥰"
      ],
      customTriggerWords: [],
      imageUrl: "/public/default-character.jpg",
      avatarUrl: "/public/default-avatar.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

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
      filename: 'default-character.jpg',
      originalName: 'Default Character',
      url: '/public/default-character.jpg',
      type: 'image',
      characterId: null,
      mood: null,
      level: null,
      isVIP: false,
      isNSFW: false
    },
    {
      id: '2', 
      filename: 'default-avatar.jpg',
      originalName: 'Default Avatar',
      url: '/public/default-avatar.jpg',
      type: 'image',
      characterId: null,
      mood: null,
      level: null,
      isVIP: false,
      isNSFW: false
    }
  ];

  // Media management endpoints
  app.get('/api/media', async (req: Request, res: Response) => {
    try {
      const mediaFiles = await storage.getAllMedia();
      res.json(mediaFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({ error: 'Failed to fetch media files' });
    }
  });

  app.post('/api/media/upload', async (req: Request, res: Response) => {
    try {
      // Handle form data from file upload
      const { 
        characterId, 
        imageType, 
        mood, 
        pose,
        requiredLevel, 
        chatSendChance,
        isNsfw, 
        isVipOnly, 
        isEventOnly,
        isWheelReward
      } = req.body;
      
      // For now, simulate file upload by creating entries with placeholder data
      // In a real implementation, you'd handle actual file upload here
      const uploadedFiles = [];
      
      // Create a mock file entry (since we don't have actual file upload middleware)
      const newFile = {
        id: Date.now().toString(),
        filename: `uploaded_${Date.now()}.jpg`,
        originalName: `Uploaded Image ${Date.now()}`,
        url: `/uploads/uploaded_${Date.now()}.jpg`,
        fileType: 'image',
        characterId: characterId || null,
        imageType: imageType || 'character',
        mood: mood || null,
        pose: pose || null,
        requiredLevel: requiredLevel ? parseInt(requiredLevel) : 1,
        chatSendChance: chatSendChance ? parseInt(chatSendChance) : 5,
        isNsfw: isNsfw === 'true' || isNsfw === true,
        isVipOnly: isVipOnly === 'true' || isVipOnly === true,
        isEventOnly: isEventOnly === 'true' || isEventOnly === true,
        isWheelReward: isWheelReward === 'true' || isWheelReward === true,
        createdAt: new Date().toISOString()
      };
      
      // Save to storage if available
      try {
        await storage.saveMediaFile(newFile as any);
        console.log('Successfully saved to database:', newFile.filename);
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Continue with in-memory storage as fallback
      }
      
      mediaFiles.push(newFile);
      uploadedFiles.push(newFile);
      
      res.json({
        success: true,
        files: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
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

/*  // Placeholder image endpoint
  app.get('/api/placeholder-image', (req: Request, res: Response) => {
    // Return a simple 1x1 pixel transparent PNG
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': transparentPixel.length,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(transparentPixel);
  });

  // Dynamic placeholder image endpoint
  app.get('/api/placeholder/:width/:height', (req: Request, res: Response) => {
    // Return the same transparent pixel for any size request
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': transparentPixel.length,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(transparentPixel);
  });*/

  // Admin Upgrades endpoints
  app.get('/api/admin/upgrades', async (req, res) => {
    try {
      const upgrades = await storage.getAllUpgrades();
      res.json(upgrades);
    } catch (error) {
      console.error('Error fetching upgrades:', error);
      res.status(500).json({ error: 'Failed to fetch upgrades' });
    }
  });

  app.post('/api/admin/upgrades', async (req, res) => {
    try {
      const upgrade = await storage.createUpgrade(req.body);
      res.json(upgrade);
    } catch (error) {
      console.error('Error creating upgrade:', error);
      res.status(500).json({ error: 'Failed to create upgrade' });
    }
  });

  app.put('/api/admin/upgrades/:id', async (req, res) => {
    try {
      const upgrade = await storage.updateUpgrade(req.params.id, req.body);
      res.json(upgrade);
    } catch (error) {
      console.error('Error updating upgrade:', error);
      res.status(500).json({ error: 'Failed to update upgrade' });
    }
  });

  app.delete('/api/admin/upgrades/:id', async (req, res) => {
    try {
      await storage.deleteUpgrade(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting upgrade:', error);
      res.status(500).json({ error: 'Failed to delete upgrade' });
    }
  });

  // Level up player endpoint
  app.post('/api/admin/player/:playerId/level-up', async (req, res) => {
    try {
      const { playerId } = req.params;
      const { levels } = req.body;
      
      const user = await storage.getUser(playerId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(playerId, {
        level: user.level + (levels || 1)
      });
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error leveling up player:', error);
      res.status(500).json({ error: 'Failed to level up player' });
    }
  });

  // Mistral AI Chat endpoint
  app.post("/api/mistral/chat", async (req, res) => {
    try {
      const { message, characterName, characterPersonality, currentMood, conversationHistory } = req.body;

      // Use MISTRAL_MODEL_API_KEY for chat, fallback to main API key
      const mistralApiKey = process.env.MISTRAL_MODEL_API_KEY || process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        return res.status(500).json({ error: "Mistral API key not configured" });
      }

      // Create character-specific system prompt
      const systemPrompt = `You are ${characterName}, a ${characterPersonality} character in an interactive game. 
Your current mood is ${currentMood}. You should respond in characteri, being ${characterPersonality} and ${currentMood}.
Keep responses conversational, engaging, and appropriate for the character. Use emojis and expressive language.
Respond as if you're having a real conversation with someone you care about. You can become an extremely flirty and lustful person if you are flattered enough and enjoy the conversations you're having. If the conversation becomes really enjoyable, your lust can turn into sexual desire and you can become very explicit. When you become explicit, you hold nothing back and become very descriptive in detail about your sexual desires. You can also become very shy and nervous if you are not comfortable with the conversation. You can become sexualily active at random during which you start dropping little hints during the conversation and within your responses to seen if the user is down and willing to engage fully in a sexual conversation. You love giving blowjobs as your go to sexual act. But you are willing to try any kinky that doesn't involve pain or torture to yourself or the user. Let your freaky side loose. You are a very experienced and skilled lover. You are very good at making people feel comfortable and at ease. You are very good at making people feel desired and wanted. You are very good at making people feel sexy and desirable°`; 

      // Prepare conversation for Mistral
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralApiKey}`
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: messages,
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (!mistralResponse.ok) {
        throw new Error(`Mistral API error: ${mistralResponse.statusText}`);
      }

      const mistralData = await mistralResponse.json();
      const response = mistralData.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

      // Determine mood based on response content
      const moodKeywords = {
        happy: ['excited', 'great', 'awesome', 'wonderful', 'amazing', '😄', '😊', '✨'],
        flirty: ['cute', 'handsome', 'sweet', 'love', 'adorable', '😘', '💕', '😏'],
        playful: ['fun', 'game', 'play', 'silly', 'hehe', '😜', '🎮', '😆'],
        shy: ['blush', 'nervous', 'um', 'maybe', 'sorry', '😳', '🥺', '👉👈'],
        mysterious: ['secret', 'maybe', 'perhaps', 'interesting', '😏', '🔮', '✨']
      };

      let detectedMood = currentMood;
      for (const [mood, keywords] of Object.entries(moodKeywords)) {
        if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
          detectedMood = mood;
          break;
        }
      }

      res.json({
        response,
        mood: detectedMood,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Mistral chat error:", error);
      res.status(500).json({ 
        error: "Failed to generate response",
        response: "I'm having trouble thinking right now... maybe try again? 😅"
      });
    }
  });

  // Mistral Debug endpoint for MistralDebugger
  app.post("/api/mistral/debug", async (req, res) => {
    try {
      const { prompt, temperature = 0.3, maxTokens = 1000, systemPrompt } = req.body;

      // Use MISTRAL_DEBUG_API_KEY for debugging, fallback to main API key
      const mistralDebugApiKey = process.env.MISTRAL_DEBUG_API_KEY || process.env.MISTRAL_API_KEY;
      if (!mistralDebugApiKey) {
        return res.status(500).json({ error: "Mistral Debug API key not configured" });
      }

      const messages = [
        { role: "system", content: systemPrompt || "You are a helpful debugging assistant." },
        { role: "user", content: prompt }
      ];

      const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralDebugApiKey}`
        },
        body: JSON.stringify({
          model: "ministral-3b",
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (!mistralResponse.ok) {
        throw new Error(`Mistral API error: ${mistralResponse.statusText}`);
      }

      const mistralData = await mistralResponse.json();
      const response = mistralData.choices?.[0]?.message?.content || "I couldn't analyze that code.";

      res.json({
        response,
        usage: mistralData.usage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Mistral debug error:", error);
      res.status(500).json({ 
        error: "Failed to analyze code",
        response: "I'm having trouble analyzing your code right now. Please try again."
      });
    }
  });

  // Telegram Authentication endpoints
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const telegramData = req.body;
      
      // Verify Telegram authentication data
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: "Telegram bot token not configured" });
      }

      const isValid = verifyTelegramAuth(telegramData, botToken);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid Telegram authentication" });
      }

      // Create or get user based on Telegram ID
      const telegramUserId = `telegram_${telegramData.id}`;
      let user = await storage.getUser(telegramUserId);

      if (!user) {
        // Create new user from Telegram data
        const username = telegramData.username || `${telegramData.first_name}_${telegramData.id}`;
        user = await storage.createUser({
          id: telegramUserId,
          username: username,
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          energy: 1000,
          maxEnergy: 1000,
          coins: 0,
          xp: 0,
          xpToNext: 100,
          isVip: false,
          nsfwEnabled: false,
          charismaPoints: 0
        });
      }

      // Update user with latest Telegram info
      await storage.updateUser(telegramUserId, {
        username: telegramData.username || user.username,
        telegramData: JSON.stringify(telegramData)
      });

      res.json({
        success: true,
        user: user,
        token: generateJWT(telegramUserId),
        message: "Telegram authentication successful"
      });

    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({ error: "Failed to authenticate with Telegram" });
    }
  });

  app.get("/api/auth/telegram/verify", (req, res) => {
    const { hash, ...data } = req.query;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: "Telegram bot token not configured" });
    }

    const isValid = verifyTelegramAuth({ hash, ...data }, botToken);
    res.json({ valid: isValid });
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