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

      // Direct database update for Telegram users to bypass cache issues
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        try {
          // Use direct Supabase client for immediate updates
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
          }
          
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Try RPC function first
          const { error } = await supabase.rpc('update_user_stats', {
            telegram_user_id: telegramId,
            new_lp: newLp,
            new_energy: newEnergy
          });
          
          if (error) {
            console.log('RPC failed, trying direct update...');
            // Fallback to direct update
            await supabase
              .from('users')
              .update({ lp: newLp, energy: newEnergy })
              .eq('telegram_id', telegramId);
          }
        } catch (dbError) {
          console.log('Direct update failed, using storage fallback');
        }
      }
      
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

      // Mock reward values for now
      const rewards = {
        'task': { 
          't1': '10 Coins', 
          't2': '5 Gems', 
          't3': '20 Coins', 
          't4': '5 Coins' 
        },
        'achievement': { 
          'a1': '5 Coins', 
          'a2': '10 Coins', 
          'a3': '50 Coins', 
          'a4': '1 Gem Package' 
        }
      };

      const reward = rewards[rewardType]?.[rewardId];
      if (!reward) {
        return res.status(404).json(createErrorResponse('Reward not found'));
      }

      // Add reward to user (mock for now)
      console.log(`🎁 ${userId} claimed ${rewardType} reward: ${reward}`);
      
      res.json(createSuccessResponse({
        reward: reward,
        message: `Successfully claimed ${reward}!`
      }));
    } catch (error) {
      console.error('Reward claiming error:', error);
      res.status(500).json(createErrorResponse('Failed to claim reward'));
    }
  });
}