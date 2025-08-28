/**
 * wheelRoutes.ts - Daily Wheel Spin and Prize Logic Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles daily wheel spinning, prize distribution, and cooldown management
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// Prize pool configuration
const wheelPrizes = [
  { id: 1, name: '100 LP', type: 'lp', amount: 100, weight: 30 },
  { id: 2, name: '250 LP', type: 'lp', amount: 250, weight: 25 },
  { id: 3, name: '500 LP', type: 'lp', amount: 500, weight: 20 },
  { id: 4, name: '50 Energy', type: 'energy', amount: 50, weight: 15 },
  { id: 5, name: '100 Energy', type: 'energy', amount: 100, weight: 8 },
  { id: 6, name: '5 Gems', type: 'gems', amount: 5, weight: 1.5 },
  { id: 7, name: '10 Gems', type: 'gems', amount: 10, weight: 0.4 },
  { id: 8, name: 'Jackpot!', type: 'jackpot', amount: 5000, weight: 0.1 }
];

// Helper function to select weighted random prize
function selectRandomPrize() {
  const totalWeight = wheelPrizes.reduce((sum, prize) => sum + prize.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const prize of wheelPrizes) {
    random -= prize.weight;
    if (random <= 0) {
      return prize;
    }
  }
  
  // Fallback to first prize
  return wheelPrizes[0];
}

export function registerWheelRoutes(app: Express) {

  // Main wheel spin endpoint
  app.post('/api/wheel/spin', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID is required'));
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Check daily spin cooldown (mock for now)
      const lastSpinTime = user.lastWheelSpin ? new Date(user.lastWheelSpin).getTime() : 0;
      const now = Date.now();
      const timeSinceLastSpin = now - lastSpinTime;
      const dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (timeSinceLastSpin < dailyCooldown) {
        const timeUntilNextSpin = dailyCooldown - timeSinceLastSpin;
        const hoursLeft = Math.floor(timeUntilNextSpin / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeUntilNextSpin % (60 * 60 * 1000)) / (60 * 1000));
        
        return res.status(400).json(createErrorResponse(
          `Wheel already spun today. Next spin available in ${hoursLeft}h ${minutesLeft}m`
        ));
      }

      // Select random prize
      const wonPrize = selectRandomPrize();

      // Apply prize to user
      const userUpdates: any = {
        lastWheelSpin: new Date().toISOString()
      };

      switch (wonPrize.type) {
        case 'lp':
          userUpdates.lp = (user.lp || 0) + wonPrize.amount;
          break;
        case 'energy':
          const newEnergy = Math.min((user.energy || 0) + wonPrize.amount, user.maxEnergy || 1000);
          userUpdates.energy = newEnergy;
          break;
        case 'gems':
          userUpdates.gems = (user.gems || 0) + wonPrize.amount;
          break;
        case 'jackpot':
          userUpdates.lp = (user.lp || 0) + wonPrize.amount;
          userUpdates.jackpotsWon = (user.jackpotsWon || 0) + 1;
          break;
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, userUpdates);

      // Log the spin
      try {
        await storage.logWheelSpin(userId, wonPrize.id, wonPrize.name);
      } catch (logError) {
        console.warn('Failed to log wheel spin:', logError);
        // Don't fail the request if logging fails
      }

      console.log(`🎰 ${userId} spun wheel and won: ${wonPrize.name}`);

      res.json(createSuccessResponse({
        prize: wonPrize,
        user: updatedUser,
        message: `Congratulations! You won ${wonPrize.name}!`,
        nextSpinAvailable: new Date(now + dailyCooldown).toISOString()
      }));

    } catch (error) {
      console.error('Wheel spin error:', error);
      res.status(500).json(createErrorResponse('Failed to spin wheel'));
    }
  });

  // Get wheel status for user (cooldown, available prizes)
  app.get('/api/wheel/status/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      const lastSpinTime = user.lastWheelSpin ? new Date(user.lastWheelSpin).getTime() : 0;
      const now = Date.now();
      const timeSinceLastSpin = now - lastSpinTime;
      const dailyCooldown = 24 * 60 * 60 * 1000;

      const canSpin = timeSinceLastSpin >= dailyCooldown;
      const timeUntilNextSpin = canSpin ? 0 : dailyCooldown - timeSinceLastSpin;

      res.json({
        canSpin,
        lastSpinTime: user.lastWheelSpin,
        timeUntilNextSpin,
        nextSpinAvailable: canSpin ? 'now' : new Date(now + timeUntilNextSpin).toISOString(),
        availablePrizes: wheelPrizes.map(prize => ({
          id: prize.id,
          name: prize.name,
          type: prize.type,
          rarity: prize.weight < 1 ? 'legendary' : 
                  prize.weight < 5 ? 'rare' : 
                  prize.weight < 15 ? 'uncommon' : 'common'
        }))
      });

    } catch (error) {
      console.error('Wheel status error:', error);
      res.status(500).json(createErrorResponse('Failed to get wheel status'));
    }
  });

  // Admin endpoints for wheel management
  app.get('/api/admin/wheel-prizes', async (req: Request, res: Response) => {
    try {
      const prizes = await storage.getWheelPrizes();
      
      // If no prizes in database, return default prizes
      if (!prizes || prizes.length === 0) {
        return res.json(wheelPrizes);
      }
      
      res.json(prizes);
    } catch (error) {
      console.error('Error fetching wheel prizes:', error);
      // Return default prizes on error
      res.json(wheelPrizes);
    }
  });

  app.post('/api/admin/wheel-prizes', async (req: Request, res: Response) => {
    try {
      const prizeData = req.body;
      
      // Validate required fields
      if (!prizeData.name || !prizeData.type || !prizeData.amount || !prizeData.weight) {
        return res.status(400).json(createErrorResponse('Missing required prize fields'));
      }
      
      const newPrize = await storage.createWheelPrize(prizeData);
      res.json(createSuccessResponse(newPrize));
    } catch (error) {
      console.error('Error creating wheel prize:', error);
      res.status(500).json(createErrorResponse('Failed to create wheel prize'));
    }
  });

  app.delete('/api/admin/wheel-prizes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteWheelPrize(id);
      
      res.json(createSuccessResponse({ 
        message: 'Wheel prize deleted successfully' 
      }));
    } catch (error) {
      console.error('Error deleting wheel prize:', error);
      res.status(500).json(createErrorResponse('Failed to delete wheel prize'));
    }
  });

  // Get wheel spin history for user
  app.get('/api/wheel/history/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;
      
      const history = await storage.getWheelSpinHistory(userId, Number(limit));
      res.json(history || []);
    } catch (error) {
      console.error('Error fetching wheel history:', error);
      res.json([]);
    }
  });

  // Get global wheel statistics
  app.get('/api/wheel/stats', async (req: Request, res: Response) => {
    try {
      // Mock wheel statistics
      const wheelStats = {
        totalSpins: 1247,
        todaySpins: 89,
        jackpotsWon: 3,
        mostWonPrize: '100 LP',
        leastWonPrize: 'Jackpot!',
        averagePrizeValue: 185,
        prizeDistribution: {
          '100 LP': 374,
          '250 LP': 312,
          '500 LP': 249,
          '50 Energy': 187,
          '100 Energy': 100,
          '5 Gems': 19,
          '10 Gems': 3,
          'Jackpot!': 3
        }
      };
      
      res.json(wheelStats);
    } catch (error) {
      console.error('Error fetching wheel stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch wheel statistics'));
    }
  });
}