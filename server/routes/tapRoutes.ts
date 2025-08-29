/**
 * tapRoutes.ts - Tap Game Logic Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles all tap-related functionality including LP calculations and energy management
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { parseLP, calculateLPPerTap, createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

export function registerTapRoutes(app: Express) {
  
  // Main tap endpoint - optimized for performance
  app.post('/api/tap', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Check if user has energy
      if (user.energy <= 0) {
        return res.status(400).json(createErrorResponse('No energy left'));
      }

      // Calculate LP per tap (use user's lpPerTap stat)
      const lpPerTap = user.lpPerTap || 1.5;
      
      // Update user stats - PARSE LP AS FLOAT to support decimals like 1.5!
      const currentLp = parseLP(user.lp);
      const newLp = currentLp + lpPerTap;
      const newEnergy = Math.max(0, user.energy - 1);
      
      console.log(`💥 TAP: ${currentLp} + ${lpPerTap} = ${newLp}`);

      // Fast single database update
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp,
        energy: newEnergy
      });

      // Game stats tracking skipped - method not implemented

      console.log(`💥 TAP! ${userId} gained ${lpPerTap} LP, energy: ${newEnergy}`);
      
      res.json({
        success: true,
        lpGain: lpPerTap,
        energyUsed: 1,
        newLp,
        newEnergy,
        user: updatedUser
      });
    } catch (error) {
      console.error('Tap error:', error);
      res.status(500).json(createErrorResponse('Failed to process tap'));
    }
  });

  // Alternative tap endpoint (legacy support)
  app.post("/api/game/tap", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      // Get user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Check energy
      if (user.energy <= 0) {
        return res.status(400).json({
          success: false,
          error: 'No energy remaining',
          currentEnergy: 0
        });
      }

      // Calculate LP gain
      const lpGain = user.lpPerTap || 1.5;
      const currentLp = parseLP(user.lp);
      const newLp = currentLp + lpGain;
      const newEnergy = Math.max(0, user.energy - 1);

      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp,
        energy: newEnergy
      });

      // Game stats tracking skipped - method not implemented

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
      res.status(500).json(createErrorResponse('Failed to process tap'));
    }
  });

  // Rewards claiming endpoint
  app.post('/api/rewards/claim', async (req: Request, res: Response) => {
    try {
      const { rewardId, rewardType, userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      // Get reward from real game configuration instead of mock data
      const reward = await storage.claimReward(userId, rewardType, rewardId);
      
      if (!reward) {
        return res.status(404).json(createErrorResponse('Reward not found'));
      }

      console.log(`🎁 ${userId} claimed ${rewardType} reward: ${reward.description}`);
      
      res.json(createSuccessResponse({
        reward: reward.description,
        amount: reward.amount,
        currency: reward.currency,
        message: `Successfully claimed ${reward.description}!`
      }));
    } catch (error) {
      console.error('Reward claiming error:', error);
      res.status(500).json(createErrorResponse('Failed to claim reward'));
    }
  });
}