/**
 * passiveRoutes.ts - Passive LP and Income Management
 * Last Edited: 2025-10-24 by Assistant - Added circuit breaker protection and improved claiming
 */

import { Router } from 'express';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { logPurchase } from '../../shared/utils/LogDeduplicator';
import { withCircuitBreaker } from '../../shared/services/CircuitBreakerService';

const router = Router();
const storage = SupabaseStorage.getInstance();

/**
 * POST /api/passive/claim - Claim accumulated passive LP
 * Fixes the issue where claiming passive LP doesn't update balance
 * Now with circuit breaker protection
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
    
    // Get user data with circuit breaker protection
    const user = await withCircuitBreaker('PASSIVE_CLAIM', async () => {
      return await storage.getUser(actualUserId);
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentTime = Date.now();
    const lastClaimTime = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime).getTime() : (currentTime - (8 * 60 * 60 * 1000)); // Default to 8 hours ago if never claimed
    const timeDiff = currentTime - lastClaimTime;
    
    // Calculate passive LP
    const minutesOffline = Math.floor(timeDiff / (1000 * 60));
    
    // Get user's passive income rate (computed from upgrades or default)
    let lpPerHour = user.lpPerHour || 250; // Base rate
    
    // If user has upgrades, check for passive income boosts
    try {
      const { data: userUpgrades } = await storage.supabase
        .from('userUpgrades')
        .select('upgradeId, level')
        .eq('userId', actualUserId);
        
      if (userUpgrades && userUpgrades.length > 0) {
        // Get upgrade definitions to calculate passive bonuses
        const upgradeStorage = (await import('../../shared/UpgradeStorage')).UpgradeStorage.getInstance();
        const allUpgrades = await upgradeStorage.getAllUpgrades();
        
        // Calculate passive income bonuses
        let passiveBonus = 0;
        userUpgrades.forEach(userUpgrade => {
          const upgrade = allUpgrades.find(u => u.id === userUpgrade.upgradeId);
          if (upgrade && (upgrade.category === 'passive' || upgrade.id.includes('passive') || upgrade.id.includes('hour'))) {
            const level = userUpgrade.level || 0;
            const effect = (upgrade.baseEffect || 0) * level * (upgrade.effectMultiplier || 1);
            passiveBonus += effect;
          }
        });
        
        lpPerHour += passiveBonus;
        console.log(`💰 [PASSIVE LP] User has ${passiveBonus} bonus LP per hour from upgrades (total: ${lpPerHour})`);
      }
    } catch (upgradeError) {
      console.warn(`⚠️ [PASSIVE LP] Could not calculate upgrade bonuses:`, upgradeError);
    }
    
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
        lpPerHour,
        details: {
          minutesOffline,
          maxClaimMinutes,
          lpPerMinute,
          lastClaimTime: new Date(lastClaimTime).toISOString()
        }
      });
    }
    
    // Update user with claimed LP and new claim time
    const newLP = (user.lp || 0) + passiveLP;
    const updatedUser = await withCircuitBreaker('PASSIVE_CLAIM', async () => {
      return await storage.updateUser(actualUserId, {
        lp: newLP,
        lpPerHour: lpPerHour, // Save computed LP per hour
        lastPassiveClaimTime: new Date().toISOString()
      });
    });
    
    console.log(`💰 [PASSIVE LP] - After claim: ${newLP} LP (gained ${passiveLP} LP)`);
    
    if (!updatedUser) {
      console.error(`💰 [PASSIVE LP] Failed to update user ${actualUserId}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user balance - please try again'
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
      details: {
        beforeClaim: user.lp || 0,
        afterClaim: newLP,
        lpPerMinute,
        maxClaimHours: 8,
        claimTime: new Date().toISOString()
      },
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
    const lastClaimTime = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime).getTime() : (currentTime - (8 * 60 * 60 * 1000));
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
        lpPerMinute,
        maxClaimHours: 8,
        lastClaimTime: user.lastPassiveClaimTime || null,
        canClaim: availableLP > 0,
        currentLP: user.lp || 0
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
    const cappedHours = Math.min(hours, 8); // Max 8 hours
    const calculatedLP = Math.floor(lpPerHour * cappedHours);
    
    res.json({
      success: true,
      data: {
        lpPerHour,
        requestedHours: hours,
        cappedHours,
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