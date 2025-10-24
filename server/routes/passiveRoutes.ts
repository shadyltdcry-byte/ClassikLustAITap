/**
 * passiveRoutes.ts - Passive LP and Income Management
 * Last Edited: 2025-10-24 by Assistant - Fixed passive LP claiming with proper logging
 */

import { Router } from 'express';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { logPurchase } from '../../shared/utils/LogDeduplicator';

const router = Router();
const storage = SupabaseStorage.getInstance();

/**
 * POST /api/passive/claim - Claim accumulated passive LP
 * Fixes the issue where claiming passive LP doesn't update balance
 */
router.post('/claim', async (req, res) => {
  try {
    const { telegramId, userId } = req.body;
    const actualUserId = telegramId || userId;
    
    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId or userId required'
      });
    }

    console.log(`💰 [PASSIVE LP] Claim request for user: ${actualUserId}`);
    
    // Get user data
    const user = await storage.getUser(actualUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentTime = Date.now();
    const lastClaimTime = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime).getTime() : 0;
    const timeDiff = currentTime - lastClaimTime;
    
    // Calculate passive LP (assuming 1 LP per minute offline as base rate)
    const minutesOffline = Math.floor(timeDiff / (1000 * 60));
    
    // Get user's passive income rate (from upgrades)
    const lpPerHour = user.lpPerHour || 250; // Default from your logs
    const lpPerMinute = lpPerHour / 60;
    const maxClaimMinutes = 8 * 60; // 8 hours max claim
    
    const actualMinutes = Math.min(minutesOffline, maxClaimMinutes);
    const passiveLP = Math.floor(actualMinutes * lpPerMinute);
    
    console.log(`💰 [PASSIVE LP] User ${actualUserId}:`);
    console.log(`💰 [PASSIVE LP] - Time offline: ${minutesOffline} minutes (${(minutesOffline/60).toFixed(1)} hours)`);
    console.log(`💰 [PASSIVE LP] - LP per hour: ${lpPerHour}`);
    console.log(`💰 [PASSIVE LP] - Claiming: ${passiveLP} LP for ${actualMinutes} minutes`);
    console.log(`💰 [PASSIVE LP] - Before claim: ${user.lp || 0} LP`);
    
    if (passiveLP <= 0) {
      return res.json({
        success: true,
        message: 'No passive LP to claim',
        claimed: 0,
        newBalance: user.lp || 0,
        timeOffline: minutesOffline,
        lpPerHour
      });
    }
    
    // Update user with claimed LP and new claim time
    const newLP = (user.lp || 0) + passiveLP;
    const updatedUser = await storage.updateUser(actualUserId, {
      lp: newLP,
      lastPassiveClaimTime: new Date().toISOString()
    });
    
    console.log(`💰 [PASSIVE LP] - After claim: ${newLP} LP (gained ${passiveLP} LP)`);
    
    if (!updatedUser) {
      console.error(`💰 [PASSIVE LP] Failed to update user ${actualUserId}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user balance'
      });
    }
    
    console.log(`✅ [PASSIVE LP] Successfully claimed ${passiveLP} LP for user ${actualUserId}`);
    
    // Log the claim for analytics
    logPurchase('PASSIVE_CLAIM', 'passive-lp', actualUserId, `${passiveLP} LP (${actualMinutes}min)`);
    
    res.json({
      success: true,
      message: 'Passive LP claimed successfully',
      claimed: passiveLP,
      newBalance: newLP,
      timeOffline: minutesOffline,
      actualMinutes,
      lpPerHour,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [PASSIVE LP] Claim failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to claim passive LP',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/passive/status - Get passive LP status without claiming
 */
router.get('/status', async (req, res) => {
  try {
    const telegramId = (req.query.telegramId as string) || (req.query.userId as string);
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId or userId required'
      });
    }
    
    const user = await storage.getUser(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const currentTime = Date.now();
    const lastClaimTime = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime).getTime() : 0;
    const timeDiff = currentTime - lastClaimTime;
    const minutesOffline = Math.floor(timeDiff / (1000 * 60));
    
    const lpPerHour = user.lpPerHour || 250;
    const lpPerMinute = lpPerHour / 60;
    const maxClaimMinutes = 8 * 60; // 8 hours max
    
    const actualMinutes = Math.min(minutesOffline, maxClaimMinutes);
    const availableLP = Math.floor(actualMinutes * lpPerMinute);
    
    res.json({
      success: true,
      data: {
        minutesOffline,
        availableLP,
        lpPerHour,
        maxClaimHours: 8,
        lastClaimTime: user.lastPassiveClaimTime,
        canClaim: availableLP > 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [PASSIVE LP] Status check failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get passive status',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/passive/calculate - Calculate potential passive income
 */
router.get('/calculate', async (req, res) => {
  try {
    const telegramId = (req.query.telegramId as string) || (req.query.userId as string);
    const hours = parseFloat(req.query.hours as string) || 1;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId or userId required'
      });
    }
    
    const user = await storage.getUser(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const lpPerHour = user.lpPerHour || 250;
    const calculatedLP = Math.floor(lpPerHour * hours);
    
    res.json({
      success: true,
      data: {
        lpPerHour,
        hours,
        calculatedLP,
        maxHours: 8
      }
    });
    
  } catch (error: any) {
    console.error('❌ [PASSIVE LP] Calculation failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate passive income',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;