/** 
 * routes.ts - Custom Game Routes
 * Last Edited: 2025-08-25 by Assistant
 * 
 * Fixed syntax errors and added proper file upload handling
 */

import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
// Using Supabase storage
import jwt from 'jsonwebtoken';
import { SupabaseStorage } from '../shared/SupabaseStorage';

// Create Supabase storage instance
const storage = new SupabaseStorage();

// Create a global variable to store token validation function reference
declare global {
  var validateAuthToken: ((token: string, telegramId: string) => boolean) | undefined;
  var recentTelegramAuth: Map<string, {
    user: any,
    token: string,
    timestamp: number
  }> | undefined;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
      cb(null, filename);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm'];
    cb(null, allowed.includes(file.mimetype));
  }
});

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
    return "Hey! *smiles warmly* I'm so happy to see you! How's your day going?";
  }

  if (input.includes('how are you')) {
    return "I'm doing amazing now that I'm talking to you! *giggles* You always know how to brighten my mood!";
  }

  if (input.includes('beautiful') || input.includes('pretty') || input.includes('cute')) {
    return "*blushes* Aww, thank you so much! You're so sweet! That really made my day!";
  }

  const responses = [
    "That's really interesting! Tell me more about that!",
    "I love hearing your thoughts! You always have such unique perspectives!",
    "Hmm, that's fascinating! I never thought about it that way before!",
    "You're so thoughtful! I really enjoy our conversations!"
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

  // in your backend route setup
  app.get('/api/admin/plugins/stats', async (req, res) => {
    try {
      // Get real plugin stats from the system
      const totalPlugins = 0; // Will be populated when plugins are implemented
      const activePlugins = 0;
      const errors = 0;
      
      res.json({ 
        totalPlugins, 
        activePlugins, 
        errors,
        status: 'operational'
      });
    } catch (error) {
      console.error('Error fetching plugin stats:', error);
      res.status(500).json({ error: 'Failed to fetch plugin stats' });
    }
  });

  // === ADMIN LEVEL REQUIREMENTS ENDPOINTS ===
  app.get('/api/admin/level-requirements', async (req, res) => {
    try {
      const levelReqs = await storage.getLevelRequirements();
      res.json(levelReqs);
    } catch (error) {
      console.error('Error fetching level requirements:', error);
      res.status(500).json({ error: 'Failed to fetch level requirements' });
    }
  });

  app.post('/api/admin/level-requirements', async (req, res) => {
    try {
      const created = await storage.createLevelRequirement(req.body);
      res.json(created);
    } catch (error) {
      console.error('Error creating level requirement:', error);
      res.status(500).json({ error: 'Failed to create level requirement' });
    }
  });

  app.put('/api/admin/level-requirements/:id', async (req, res) => {
    try {
      const updated = await storage.updateLevelRequirement(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating level requirement:', error);
      res.status(500).json({ error: 'Failed to update level requirement' });
    }
  });

  app.delete('/api/admin/level-requirements/:id', async (req, res) => {
    try {
      await storage.deleteLevelRequirement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting level requirement:', error);
      res.status(500).json({ error: 'Failed to delete level requirement' });
    }
  });

  // === ADMIN UPGRADES ENDPOINTS ===
  app.get('/api/admin/upgrades', async (req, res) => {
    try {
      const upgrades = await storage.getUpgrades();
      res.json(upgrades);
    } catch (error) {
      console.error('Error fetching upgrades:', error);
      res.status(500).json({ error: 'Failed to fetch upgrades' });
    }
  });

  app.post('/api/admin/upgrades', async (req, res) => {
    try {
      const created = await storage.createUpgrade(req.body);
      res.json(created);
    } catch (error) {
      console.error('Error creating upgrade:', error);
      res.status(500).json({ error: 'Failed to create upgrade' });
    }
  });

  app.put('/api/admin/upgrades/:id', async (req, res) => {
    try {
      const updated = await storage.updateUpgrade(req.params.id, req.body);
      res.json(updated);
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

  // === ADMIN ACHIEVEMENTS ENDPOINTS ===
  app.get('/api/admin/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // === ADMIN WHEEL PRIZES ENDPOINTS ===
  app.get('/api/admin/wheel-prizes', async (req, res) => {
    try {
      // Return default wheel prizes
      const wheelPrizes = [
        { id: '1', name: '100 LP', type: 'points', value: 100, probability: 0.30, color: '#4F46E5', icon: '💰' },
        { id: '2', name: '50 LP', type: 'points', value: 50, probability: 0.25, color: '#059669', icon: '🪙' },
        { id: '3', name: '25 Energy', type: 'energy', value: 25, probability: 0.20, color: '#DC2626', icon: '⚡' },
        { id: '4', name: '5 Gems', type: 'gems', value: 5, probability: 0.15, color: '#7C3AED', icon: '💎' },
        { id: '5', name: 'Character Unlock', type: 'character', value: 1, probability: 0.08, color: '#EA580C', icon: '👤' },
        { id: '6', name: 'Jackpot!', type: 'special', value: 1000, probability: 0.02, color: '#FBBF24', icon: '🎉' }
      ];
      res.json(wheelPrizes);
    } catch (error) {
      console.error('Error fetching wheel prizes:', error);
      res.status(500).json({ error: 'Failed to fetch wheel prizes' });
    }
  });

  app.post('/api/admin/wheel-prizes', async (req, res) => {
    try {
      // For now just return success - in future this would save to database
      res.json({ success: true, message: 'Wheel prize updated successfully' });
    } catch (error) {
      console.error('Error updating wheel prizes:', error);
      res.status(500).json({ error: 'Failed to update wheel prizes' });
    }
  });

  app.delete('/api/admin/wheel-prizes/:id', async (req, res) => {
    try {
      // For now just return success - in future this would delete from database
      res.json({ success: true, message: 'Wheel prize deleted successfully' });
    } catch (error) {
      console.error('Error deleting wheel prize:', error);
      res.status(500).json({ error: 'Failed to delete wheel prize' });
    }
  });

  app.post('/api/admin/achievements', async (req, res) => {
    try {
      const created = await storage.createAchievement(req.body);
      res.json(created);
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json({ error: 'Failed to create achievement' });
    }
  });

  app.put('/api/admin/achievements/:id', async (req, res) => {
    try {
      const updated = await storage.updateAchievement(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating achievement:', error);
      res.status(500).json({ error: 'Failed to update achievement' });
    }
  });

  app.delete('/api/admin/achievements/:id', async (req, res) => {
    try {
      await storage.deleteAchievement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting achievement:', error);
      res.status(500).json({ error: 'Failed to delete achievement' });
    }
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

      // Get real user ID if telegram format
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        try {
          const user = await storage.getUser(`telegram_${telegramId}`);
          if (user?.id) {
            realUserId = user.id;
          } else {
            console.log(`No database user found for ${userId}, returning mock tap data`);
            const lpGain = 1.5;
            return res.json({
              success: true,
              lpGain,
              newTotal: 5000 + lpGain, // Mock calculation
              energyUsed: 1,
              userId
            });
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          const lpGain = 1.5;
          return res.json({
            success: true,
            lpGain,
            newTotal: 5000 + lpGain, // Mock calculation
            energyUsed: 1,
            userId
          });
        }
      }

      const user = await storage.getUser(realUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has enough energy
      if (user.energy < 1) {
        return res.status(400).json({ error: 'Not enough energy' });
      }

      // Calculate new values
      const lpGain = user.lpPerTap || 1.5;
      const newLp = Math.round(user.lp + lpGain); // Round to integer for database
      const newEnergy = Math.max(0, user.energy - 1);

      // Update user in database
      const updatedUser = await storage.updateUser(realUserId, {
        lp: newLp,
        energy: newEnergy
      });

      // Update game stats - track cumulative statistics
      try {
        // Use SQL increment for better performance and accuracy
        // Use direct database update instead of supabase RPC
        await storage.updateUserStats(realUserId, {
          p_user_id: realUserId,
          p_taps: 1,
          p_lp_earned: lpGain,
          p_energy_used: 1
        });

        // Stats updated successfully
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
  app.post("/api/user/init", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Error initializing user:', error);
      res.status(500).json({ error: 'Failed to initialize user' });
    }
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

  // Chat history endpoint - returns last 10 messages for display but keeps full logs
  app.get("/api/chat-history/:userId/:characterId", async (req, res) => {
    try {
      const { userId, characterId } = req.params;
      
      // Check if userId is valid UUID or telegram format  
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const telegramRegex = /^telegram_\d+$/;
      if (!uuidRegex.test(userId) && !telegramRegex.test(userId)) {
        console.log(`Invalid UUID userId: ${userId}, returning empty chat history`);
        return res.json([]);
      }
      const playerFolder = path.join(__dirname, '..', 'player-data', userId);
      const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
      
      if (fs.existsSync(conversationPath)) {
        const data = fs.readFileSync(conversationPath, 'utf8');
        const allConversations = JSON.parse(data);
        
        // Return only last 10 messages for display but keep full logs
        const last10Messages = allConversations.slice(-10);
        res.json(last10Messages);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({ error: 'Failed to load chat history' });
    }
  });

  // Character endpoints
  // Character selection for players
  app.post('/api/player/:playerId/select-character', async (req, res) => {
    try {
      const { playerId } = req.params;
      const { characterId } = req.body;
      
      // Set selected character for player
      await storage.setSelectedCharacter(playerId, characterId);
      
      res.json({ success: true, characterId });
    } catch (error) {
      console.error('Error selecting character:', error);
      res.status(500).json({ error: 'Failed to select character' });
    }
  });

  app.get("/api/character/selected/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      let selectedCharacter = await storage.getSelectedCharacter(playerId);

      // If no character is selected, automatically select the first enabled character
      if (!selectedCharacter) {
        const allCharacters = await storage.getAllCharacters();
        const enabledCharacters = allCharacters.filter(char => char.isEnabled);
        
        if (enabledCharacters.length > 0) {
          const firstCharacter = enabledCharacters[0];
          await storage.selectCharacter(playerId, firstCharacter.id);
          selectedCharacter = firstCharacter;
        }
      }

      res.json(selectedCharacter);
    } catch (error) {
      console.error('Error fetching selected character:', error);
      res.status(500).json({ error: 'Failed to fetch selected character' });
    }
  });


  // Player endpoint
  app.get("/api/player/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;

      // Get real user ID if telegram format
      let realUserId = playerId;
      if (playerId.startsWith('telegram_')) {
        const telegramId = playerId.replace('telegram_', '');
        try {
          const user = await storage.getUser(`telegram_${telegramId}`);
          if (user?.id) {
            realUserId = user.id;
          } else {
            // Create real database user for authenticated Telegram user
            console.log(`Creating database user for authenticated Telegram user: ${playerId}`);
            const newUser = await storage.createUser({
              id: playerId,
              username: `Player${telegramId}`,
              level: 1,
              lp: 5000,
              lpPerHour: 250,
              lpPerTap: 1.5,
              isVip: false,
              nsfwEnabled: false
            });
            return res.json(newUser);
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
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
      }

      let user = await storage.getUser(realUserId);

      if (!user) {
        // Create default user if not exists - using timestamp-based username to avoid duplicates
        user = await storage.createUser({
          id: playerId,
          // username will be auto-generated in storage.createUser
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
      // Get characters from database
      const dbCharacters = await storage.getAllCharacters();

      // If no characters in database, return empty array to let frontend handle it
      if (!dbCharacters || dbCharacters.length === 0) {
        return res.json([]);
      }

      res.json(dbCharacters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
  });

  // Character creation endpoint
  app.post("/api/characters", async (req, res) => {
    try {
      const newCharacter = await storage.createCharacter(req.body);
      res.json({ success: true, character: newCharacter });
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json({ error: 'Failed to create character' });
    }
  });

  // Media endpoints - Auto-import filesystem files into database
  app.get("/api/media", async (req, res) => {
    try {
      let mediaFiles = await storage.getAllMedia();
      const existingFiles = new Set(mediaFiles.map(f => f.fileName));
      
      // Scan public/uploads directory and import missing files
      const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
      
      if (fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        console.log(`Found ${files.length} files in uploads directory`);
        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !existingFiles.has(file)) {
            console.log(`Attempting to import: ${file}`);
            // Import filesystem file into database
            try {
              const newMediaFile = {
                fileName: file,
                filePath: `/uploads/${file}`,
                fileType: 'image',
                category: 'misc',
                characterId: null,
                isNsfw: file.includes('nsfw'),
                isVip: false,
                mood: null,
                pose: null,
                animationSequence: null,
                isEvent: false,
                randomSendChance: 50,
                requiredLevel: 1
              };
              
              const savedFile = await storage.saveMediaFile(newMediaFile);
              if (savedFile) {
                mediaFiles.push(savedFile);
                console.log(`Auto-imported filesystem file: ${file}`);
              }
            } catch (importError) {
              console.error(`Failed to import ${file}:`, importError);
            }
          }
        }
      }
      
      res.json(mediaFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({ error: 'Failed to fetch media files' });
    }
  });

  // Enhanced file upload endpoint with categorization
  app.post('/api/media/upload', upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Parse config from form data
      let config: any = {};
      try {
        config = JSON.parse(req.body.config || '{}');
      } catch (e) {
        console.warn('Invalid config JSON, using defaults');
      }

      // Extract categorization info
      const category = config.category || 'misc'; // 'character', 'avatar', or 'misc'
      const isNsfw = config.isNsfw || false;
      const characterId = config.characterId || null;

      const uploadedFiles = [];

      for (const file of files) {
        // Generate categorized filename with prefix
        const fileExt = path.extname(file.originalname);
        const prefix = category === 'character' ? 'ch' : category === 'avatar' ? 'av' : 'misc';
        const nsfwSuffix = isNsfw ? 'nsfw' : 'sfw';
        const randomId = Math.random().toString(36).substr(2, 8);
        
        const categorizedFilename = `${prefix}${nsfwSuffix}_${randomId}${fileExt}`;
        
        // Create character-specific folder if needed
        let uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        if (characterId && category === 'character') {
          uploadDir = path.join(uploadDir, 'characters', characterId);
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
        }
        
        const finalPath = path.join(uploadDir, categorizedFilename);
        const relativePath = path.relative(path.join(__dirname, '..', 'public'), finalPath);
        const fileType = file.mimetype.startsWith('image/') 
          ? (file.mimetype === 'image/gif' ? 'gif' : 'image')
          : 'video';

        // Move file to final location with categorized name
        fs.renameSync(file.path, finalPath);

        const mediaFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          fileName: categorizedFilename,
          filePath: `/${relativePath}`,
          fileType,
          characterId: config.characterId || null,
          mood: config.mood || null,
          requiredLevel: config.requiredLevel || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          randomSendChance: config.randomSendChance || 5,
          category: category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to database
        try {
          await storage.saveMediaFile(mediaFile);
          uploadedFiles.push(mediaFile);
          console.log(`Successfully saved to database: ${categorizedFilename}`);
        } catch (dbError) {
          console.error(`Failed to save ${categorizedFilename} to database:`, dbError);
          // Clean up the uploaded file if database save failed
          try {
            fs.unlinkSync(finalPath);
          } catch (cleanupError) {
            console.error('Failed to cleanup file:', cleanupError);
          }
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({ error: 'No files were successfully processed' });
      }

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

  app.get("/api/media/character/:characterId", async (req, res) => {
    try {
      const { characterId } = req.params;
      const mediaFiles = await storage.getMediaFiles(characterId);
      res.json(mediaFiles);
    } catch (error) {
      console.error('Error fetching character media:', error);
      res.status(500).json({ error: 'Failed to fetch character media' });
    }
  });

  app.put('/api/media/:id', async (req, res) => {
    try {
      const updatedFile = await storage.updateMediaFile(req.params.id, req.body);
      if (!updatedFile) {
        return res.status(404).json({ error: 'Media file not found' });
      }
      res.json(updatedFile);
    } catch (error) {
      console.error('Error updating media file:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    try {
      await storage.deleteMediaFile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting media file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // User endpoint for useGameState hook
  app.get("/api/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get real user ID if telegram format
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        try {
          const user = await storage.getUser(`telegram_${telegramId}`);
          if (user?.id) {
            realUserId = user.id;
          } else {
            // Create real database user for authenticated Telegram user
            console.log(`Creating database user for authenticated Telegram user: ${userId}`);
            const newUser = await storage.createUser({
              id: userId,
              username: `Player${telegramId}`,
              level: 1,
              lp: 5000,
              lpPerHour: 250,
              lpPerTap: 1.5,
              vipStatus: false,
              nsfwConsent: false
            });
            return res.json(newUser);
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          return res.json({
            id: userId,
            username: "Player",
            password: "",
            level: 1,
            lp: 5000,
            lpPerHour: 250,
            lpPerTap: 1.5,
            energy: 1000,
            maxEnergy: 1000,
            charisma: 0,
            vipStatus: false,
            nsfwConsent: false,
            lastTick: new Date(),
            createdAt: new Date()
          });
        }
      }

      const user = await storage.getUser(realUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Player stats endpoint
  app.get("/api/stats/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      
      // Get real user ID if telegram format
      let realUserId = playerId;
      if (playerId.startsWith('telegram_')) {
        const telegramId = playerId.replace('telegram_', '');
        try {
          const user = await storage.getUser(`telegram_${telegramId}`);
          if (user?.id) {
            realUserId = user.id;
          } else {
            console.log(`No database user found for ${playerId}, returning mock stats data`);
            return res.json({
              playerId,
              level: 1,
              totalLp: 5000,
              totalTaps: 50,
              totalLpEarned: 1000,
              lpPerHour: 250,
              lpPerTap: 1.5,
              sessionsPlayed: 5,
              upgrades: {
                intellect: 1,
                dexterity: 1,
                booksmarts: 1
              }
            });
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          return res.json({
            playerId,
            level: 1,
            totalLp: 5000,
            totalTaps: 50,
            totalLpEarned: 1000,
            lpPerHour: 250,
            lpPerTap: 1.5,
            sessionsPlayed: 5,
            upgrades: {
              intellect: 1,
              dexterity: 1,
              booksmarts: 1
            }
          });
        }
      }

      // Check if we have a valid UUID now
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(realUserId)) {
        console.log(`Could not resolve ${playerId} to valid UUID, returning mock stats data`);
        return res.json({
          playerId,
          level: 1,
          totalLp: 5000,
          totalTaps: 50,
          totalLpEarned: 1000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          sessionsPlayed: 5,
          upgrades: {
            intellect: 1,
            dexterity: 1,
            booksmarts: 1
          }
        });
      }

      const user = await storage.getUser(realUserId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get actual game stats from database
      const gameStats = await storage.getUserStats(realUserId);

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

  // Chat fallback endpoints
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

  // Character management endpoints
  app.get('/api/admin/characters', (req, res) => {
    res.json([]);
  });

  app.put('/api/admin/characters/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log(`Updating character: ${id}`, updates);
      
      const updatedCharacter = await storage.updateCharacter(id, updates);
      console.log(`Character update result:`, updatedCharacter);
      
      if (updatedCharacter) {
        res.json(updatedCharacter);
      } else {
        res.status(404).json({ error: 'Character not found' });
      }
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json({ error: 'Failed to update character' });
    }
  });

  app.delete('/api/admin/characters/:id', (req, res) => {
    console.log('Deleting character:', req.params.id);
    res.json({ success: true });
  });

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

  // Mistral AI Chat endpoint with conversation storage and character data  
  app.post("/api/mistral/chat", async (req, res) => {
    try {
      const { message, characterName, characterDescription, currentMood, conversationHistory, userId, characterId } = req.body;

      const mistralApiKey = process.env.MISTRAL_MODEL_API_KEY || process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        return res.status(500).json({ error: "Mistral API key not configured" });
      }
      
      // Get character data from database/files to use individual character descriptions
      let character = null;
      if (characterId) {
        try {
          character = await storage.getCharacter(characterId);
        } catch (error) {
          console.log('Could not fetch character data, using provided values');
        }
      }
      
      // Use character data if available, prioritizing the description field
      const actualCharacterName = character?.name || characterName || "Assistant";
      const actualDescription = character?.description || character?.personality || characterDescription || "A helpful and friendly character";
      const actualMood = character?.mood || currentMood || "neutral";
      const characterPersonality = character?.personality || "friendly";
      const characterBio = character?.bio || "";
      
      // Build system prompt using individual character's description instead of hardcoded text
      let systemPrompt = `You are ${actualCharacterName}. ${actualDescription}

Your current mood is ${actualMood}. You should respond in character based on your personality: ${characterPersonality}.

${characterBio ? `Background: ${characterBio}` : ''}

Keep responses conversational, engaging, and true to your character. Respond naturally based on your personality and description. Don't repeat the same responses.`;

      // Add NSFW behavior only if character is marked as NSFW
      if (character?.isNsfw) {
        systemPrompt += `

You are comfortable with adult conversations when appropriate and can become flirty if the conversation leads that way naturally.`;
      } 

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
          temperature: 0.91,
          max_tokens: 200
        })
      });

      if (!mistralResponse.ok) {
        throw new Error(`Mistral API error: ${mistralResponse.statusText}`);
      }

      const mistralData = await mistralResponse.json();
      const response = mistralData.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

      // Check if AI should send a picture with this response
      let sentImageUrl = null;
      if (character && Math.random() <= 0.3) { // 30% base chance to consider sending image
        try {
          // Get character images that are enabled for chat
          const characterImages = await storage.getMediaFiles(characterId);
          const chatEnabledImages = characterImages.filter(img => 
            img.enabledForChat !== false && // Default to true if not set
            (img.randomSendChance || 0) > 0
          );
          
          if (chatEnabledImages.length > 0) {
            // Calculate weighted random selection based on randomSendChance
            const totalWeight = chatEnabledImages.reduce((sum, img) => sum + (img.randomSendChance || 5), 0);
            const randomValue = Math.random() * totalWeight;
            
            let cumulativeWeight = 0;
            for (const image of chatEnabledImages) {
              cumulativeWeight += (image.randomSendChance || 5);
              if (randomValue <= cumulativeWeight) {
                sentImageUrl = image.filePath;
                console.log(`🖼️ AI sent image: ${image.fileName} (${image.randomSendChance}% chance)`);
                break;
              }
            }
          }
        } catch (error) {
          console.log('Could not load character images for chat sending:', error);
        }
      }

      // Save conversation to JSON file if userId and characterId provided
      if (userId && characterId) {
        try {
          
          const playerDataDir = path.join(__dirname, '..', 'player-data');
          const playerFolder = path.join(playerDataDir, userId);
          
          if (!fs.existsSync(playerDataDir)) {
            fs.mkdirSync(playerDataDir, { recursive: true });
          }
          if (!fs.existsSync(playerFolder)) {
            fs.mkdirSync(playerFolder, { recursive: true });
          }
          
          const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
          let conversations = [];
          if (fs.existsSync(conversationPath)) {
            const data = fs.readFileSync(conversationPath, 'utf8');
            conversations = JSON.parse(data);
          }
          
          // Add both user message and AI response
          const userMessage = {
            id: `user-${Date.now()}`,
            content: message,
            sender: 'user',
            timestamp: new Date().toISOString(),
            characterId
          };
          
          const aiMessage = {
            id: `ai-${Date.now() + 1}`,
            content: response,
            sender: 'character',
            timestamp: new Date().toISOString(),
            characterId,
            mood: actualMood
          };
          
          conversations.push(userMessage, aiMessage);
          fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
          console.log(`Saved conversation for ${userId}-${characterId}`);
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }

      const moodKeywords = {
        happy: ['excited', 'great', 'awesome', 'wonderful', 'amazing'],
        flirty: ['cute', 'handsome', 'sweet', 'love', 'adorable'],
        playful: ['fun', 'game', 'play', 'silly', 'hehe'],
        shy: ['blush', 'nervous', 'um', 'maybe', 'sorry'],
        mysterious: ['secret', 'maybe', 'perhaps', 'interesting']
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
        imageUrl: sentImageUrl,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Mistral chat error:", error);
      res.status(500).json({ 
        error: "Failed to generate response",
        response: "I'm having trouble thinking right now... maybe try again?"
      });
    }
  });

  // Mistral Debug endpoint for MistralDebugger
  app.post("/api/mistral/debug", async (req, res) => {
    try {
      const { prompt, temperature = 0.3, maxTokens = 1000, systemPrompt } = req.body;

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

  // Frontend polling endpoint to check bot authentication status
  app.get('/api/auth/telegram/status/:telegram_id', async (req, res) => {
    try {
      const { telegram_id } = req.params;
      
      // Check if user has been authenticated via bot (no time limit - persistent)
      const authData = global.recentTelegramAuth?.get(telegram_id);
      
      if (authData) {
        console.log(`[DEBUG] Found recent auth for ${telegram_id}`);
        res.json({
          authenticated: true,
          user: authData.user,
          token: authData.token
        });
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      console.error('[DEBUG] Auth status check error:', error);
      res.status(500).json({ error: 'Failed to check auth status' });
    }
  });

  // Telegram authentication endpoint with token validation
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { telegram_id, username, token } = req.body;
      
      console.log(`[DEBUG] Received auth request:`, { telegram_id, username, token });
      
      if (!telegram_id || !token) {
        console.log(`[DEBUG] Missing required fields: telegram_id=${telegram_id}, token=${token}`);
        return res.status(400).json({ error: 'telegram_id and token are required' });
      }
      
      console.log(`[DEBUG] Telegram auth attempt for user: ${telegram_id} (${username}) with token: ${token}`);
      console.log(`[DEBUG] Global validateAuthToken function available:`, !!global.validateAuthToken);
      
      // Validate token using global function if available
      const isValidToken = global.validateAuthToken ? 
        global.validateAuthToken(token, telegram_id) : 
        false;
      
      console.log(`[DEBUG] Token validation result:`, isValidToken);
      
      if (isValidToken) {
        // Generate persistent JWT token for frontend (no expiration)
        const authToken = jwt.sign(
          { 
            telegram_id, 
            username,
            type: 'telegram_bot'
          }, 
          'your-secret-key' // In production, use environment variable
          // No expiration - token is persistent
        );

        const responseData = { 
          success: true, 
          message: "You're logged in!",
          user: {
            id: `telegram_${telegram_id}`,
            telegram_id,
            username: username || `User${telegram_id}`,
            name: username || `User${telegram_id}`
          },
          token: authToken
        };
        
        // Store for frontend polling
        if (global.recentTelegramAuth) {
          global.recentTelegramAuth.set(telegram_id, {
            user: responseData.user,
            token: authToken,
            timestamp: Date.now()
          });
        }
        
        console.log(`[DEBUG] Sending success response:`, responseData);
        res.json(responseData);
      } else {
        console.log(`[DEBUG] Token validation failed, sending 401`);
        res.status(401).json({ error: 'Invalid or expired token' });
      }
    } catch (error) {
      console.error('[DEBUG] Telegram auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
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

  // Debugger system routes
  let debuggerCore: any = null;

  // Initialize debugger system
  app.post('/api/admin/debugger/init', async (req, res) => {
    try {
      if (debuggerCore) {
        return res.json({ success: true, message: 'Debugger already initialized' });
      }

      // Dynamically import the debugger system
      const DebuggerCore = require(path.resolve('./debugger/DebuggerCore.js'));
      const CharactersPlugin = require(path.resolve('./debugger/modules/CharactersPlugin.js'));

      debuggerCore = new DebuggerCore();
      debuggerCore.register(new CharactersPlugin(storage));
      
      await debuggerCore.initAll();
      
      res.json({ success: true, message: 'Debugger system initialized' });
    } catch (error) {
      console.error('Debugger init error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Run debugger command
  app.post('/api/admin/debugger/command', async (req, res) => {
    try {
      if (!debuggerCore) {
        return res.status(400).json({ success: false, error: 'Debugger not initialized' });
      }

      const { command, data } = req.body;
      const result = await debuggerCore.runCommand(command, data);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Debugger command error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get debugger status
  app.get('/api/admin/debugger/status', async (req, res) => {
    try {
      if (!debuggerCore) {
        return res.json({ 
          initialized: false, 
          plugins: [],
          logs: []
        });
      }

      const plugins = debuggerCore.plugins.map((p: any) => ({
        name: p.name,
        status: p.stats || 'ready'
      }));

      res.json({
        initialized: debuggerCore.isInitialized || true,
        plugins,
        logs: []
      });
    } catch (error) {
      console.error('Debugger status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Stop debugger
  app.post('/api/admin/debugger/stop', async (req, res) => {
    try {
      if (debuggerCore) {
        await debuggerCore.stopAll();
        debuggerCore = null;
      }
      res.json({ success: true, message: 'Debugger stopped' });
    } catch (error) {
      console.error('Debugger stop error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const distPath = join(__dirname, "../dist/public");
    app.use(express.static(distPath));

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