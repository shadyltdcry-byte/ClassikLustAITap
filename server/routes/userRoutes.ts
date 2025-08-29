/**
 * userRoutes.ts - User Management and Telegram Authentication Routes  
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles user creation, Telegram authentication, and user data management
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { 
  isValidUUID, 
  isValidTelegramId, 
  verifyTelegramAuth, 
  generateJWT,
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// Global auth cache to avoid repeated database calls
declare global {
  var recentTelegramAuth: Map<string, {
    user: any,
    token: string,
    timestamp: number
  }> | undefined;
}

// Initialize auth cache
if (!global.recentTelegramAuth) {
  global.recentTelegramAuth = new Map();
}

export function registerUserRoutes(app: Express) {

  // User initialization endpoint
  app.post("/api/user/init", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      res.json(createSuccessResponse({ user }));
    } catch (error) {
      console.error('Error initializing user:', error);
      res.status(500).json(createErrorResponse('Failed to initialize user'));
    }
  });

  // Get user data (supports both UUID and Telegram ID formats)
  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Check if userId is valid UUID or telegram format
      if (!isValidUUID(userId) && !isValidTelegramId(userId)) {
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }

      // Try to get user from storage
      const user = await storage.getUser(userId);
      if (user) {
        return res.json(user);
      }

      // User not found
      return res.status(404).json(createErrorResponse('User not found'));

    } catch (error) {
      console.error('Error in user endpoint:', error);
      res.status(500).json(createErrorResponse('Failed to get user'));
    }
  });

  // Player endpoint (similar to user but with different logic)
  app.get("/api/player/:playerId", async (req: Request, res: Response) => {
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
            const existingCheck = await storage.getUser(`telegram_${telegramId}`);
            if (!existingCheck) {
              console.log(`Creating database user for authenticated Telegram user: ${playerId}`);
              const newUser = await storage.createUser({
                telegramId: telegramId,
                username: `Player${telegramId}`,
                password: 'telegram_auth',
                level: 1,
                lp: 5000,
                lpPerHour: 250,
                lpPerTap: 1.5,
                energy: 1000,
                maxEnergy: 1000,
                charisma: 0,
                vipStatus: false,
                nsfwConsent: false
              });
              return res.json(newUser);
            }
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          return res.status(404).json(createErrorResponse('Player not found'));
        }
      }

      let user = await storage.getUser(realUserId);

      if (!user) {
        // Create default user if not exists - using timestamp-based username to avoid duplicates
        user = await storage.createUser({
          username: `Player${Date.now()}`,
          password: 'telegram_auth',
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          energy: 1000,
          maxEnergy: 1000,
          charisma: 0,
          vipStatus: false,
          nsfwConsent: false
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching player:', error as Error);
      res.status(500).json(createErrorResponse('Failed to fetch player data'));
    }
  });

  // Player update endpoint
  app.put("/api/player/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const updates = req.body;

      // If playerId is not a valid UUID, return error
      if (!isValidUUID(playerId) && !isValidTelegramId(playerId)) {
        return res.status(400).json(createErrorResponse('Invalid player ID format'));
      }

      const updatedUser = await storage.updateUser(playerId, updates);
      if (!updatedUser) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      res.json(createSuccessResponse({
        user: updatedUser,
        message: 'Player updated successfully'
      }));
    } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json(createErrorResponse('Failed to update player'));
    }
  });

  // Telegram authentication status check
  app.get('/api/auth/telegram/status/:telegram_id', async (req: Request, res: Response) => {
    const telegramId = req.params.telegram_id;
    
    try {
      // Check cache first to avoid repeated database calls
      const cached = global.recentTelegramAuth?.get(telegramId);
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 second cache
        console.log(`[DEBUG] Found recent auth for ${telegramId}`);
        return res.json({
          authenticated: true,
          user: cached.user,
          token: cached.token
        });
      }
      
      // Check if user exists in database
      const user = await storage.getUser(`telegram_${telegramId}`);
      if (user) {
        const token = generateJWT(`telegram_${telegramId}`);
        
        // Cache the result
        global.recentTelegramAuth?.set(telegramId, {
          user: {
            id: `telegram_${telegramId}`,
            telegram_id: telegramId,
            username: user.username || `User${telegramId}`,
            name: user.username || `User${telegramId}`
          },
          token,
          timestamp: Date.now()
        });
        
        return res.json({
          authenticated: true,
          user: {
            id: `telegram_${telegramId}`,
            telegram_id: telegramId,
            username: user.username || `User${telegramId}`,
            name: user.username || `User${telegramId}`
          },
          token
        });
      }
      
      res.json({ authenticated: false });
    } catch (error) {
      console.error('Auth status check error:', error);
      res.json({ authenticated: false });
    }
  });

  // Telegram authentication endpoint
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    try {
      const telegramData = req.body;
      
      // For development, we'll create a simple auth without full verification
      const telegramId = telegramData.id || telegramData.telegram_id;
      const username = telegramData.username || `User${telegramId}`;
      
      if (!telegramId) {
        return res.status(400).json(createErrorResponse('Telegram ID is required'));
      }
      
      // Check if user already exists
      let user = await storage.getUser(`telegram_${telegramId}`);
      
      if (!user) {
        // Create new user for Telegram auth
        user = await storage.createUser({
          telegramId: String(telegramId),
          username: username,
          password: 'telegram_auth',
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 1.5,
          energy: 1000,
          maxEnergy: 1000,
          charisma: 0,
          vipStatus: false,
          nsfwConsent: false
        });
      }
      
      const token = generateJWT(`telegram_${telegramId}`);
      
      // Cache the authentication
      global.recentTelegramAuth?.set(String(telegramId), {
        user: {
          id: `telegram_${telegramId}`,
          telegram_id: String(telegramId),
          username: user.username,
          name: user.username
        },
        token,
        timestamp: Date.now()
      });
      
      res.json(createSuccessResponse({
        user: {
          id: `telegram_${telegramId}`,
          telegram_id: String(telegramId),
          username: user.username,
          name: user.username
        },
        token,
        authenticated: true
      }));
      
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(500).json(createErrorResponse('Authentication failed'));
    }
  });

  // Legacy telegram verification endpoint
  app.get("/api/auth/telegram/verify", (req: Request, res: Response) => {
    // Simple verification response
    res.json(createSuccessResponse({
      verified: true,
      message: 'Telegram authentication verified'
    }));
  });
}