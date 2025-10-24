/**
 * playerRoutes.ts - Player Stats and Effective Values Calculator
 * Last Edited: 2025-10-24 by Assistant - Fixes LP per tap not updating after upgrades
 */

import { Router } from 'express';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { logPurchase } from '../../shared/utils/LogDeduplicator';
import { withCircuitBreaker } from '../../shared/services/CircuitBreakerService';

const router = Router();
const storage = SupabaseStorage.getInstance();
const upgradeStorage = UpgradeStorage.getInstance();

/**
 * GET /api/player/:telegramId/stats - Get computed player stats
 * This fixes the LP per tap not updating issue by computing effective values
 */
router.get('/:telegramId/stats', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId required'
      });
    }

    console.log(`📊 [PLAYER] Computing effective stats for: ${telegramId}`);
    
    // Get user data
    const user = await storage.getUser(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's upgrade levels
    const { data: userUpgrades, error: upgradeError } = await storage.supabase
      .from('userUpgrades')
      .select('upgradeId, level')
      .eq('userId', telegramId);

    if (upgradeError) {
      console.error(`❌ [PLAYER] Error fetching upgrades for ${telegramId}:`, upgradeError);
    }

    const upgradeLevels = new Map<string, number>();
    (userUpgrades || []).forEach(upgrade => {
      upgradeLevels.set(upgrade.upgradeId, upgrade.level || 0);
    });

    console.log(`📊 [PLAYER] Found ${upgradeLevels.size} user upgrades`);
    
    // Get all upgrade definitions
    const allUpgrades = await upgradeStorage.getAllUpgrades();
    
    // Compute effective stats
    const effectiveStats = await computeEffectiveStats(user, upgradeLevels, allUpgrades);
    
    console.log(`✅ [PLAYER] Computed stats - LP per tap: ${effectiveStats.lpPerTap}, LP per hour: ${effectiveStats.lpPerHour}`);
    
    res.json({
      success: true,
      data: {
        userId: telegramId,
        baseStats: {
          lp: user.lp || 0,
          level: user.level || 1,
          energy: user.energy || 1000,
          maxEnergy: user.maxEnergy || 1000
        },
        effectiveStats,
        upgradeCount: upgradeLevels.size,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ [PLAYER] Failed to compute stats:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to compute player stats',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/player/:telegramId - Get full player data with computed stats
 */
router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId required'
      });
    }
    
    // Get user data with circuit breaker protection
    const user = await withCircuitBreaker('SUPABASE_WRITE', async () => {
      return await storage.getUser(telegramId);
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get computed stats from the stats endpoint logic
    const { data: userUpgrades, error: upgradeError } = await storage.supabase
      .from('userUpgrades')
      .select('upgradeId, level')
      .eq('userId', telegramId);

    const upgradeLevels = new Map<string, number>();
    (userUpgrades || []).forEach(upgrade => {
      upgradeLevels.set(upgrade.upgradeId, upgrade.level || 0);
    });

    const allUpgrades = await upgradeStorage.getAllUpgrades();
    const effectiveStats = await computeEffectiveStats(user, upgradeLevels, allUpgrades);
    
    res.json({
      success: true,
      data: {
        ...user,
        effectiveStats,
        upgradeCount: upgradeLevels.size
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [PLAYER] Failed to get player data:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get player data',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * 📊 COMPUTE EFFECTIVE STATS FROM UPGRADES
 * This is the core logic that fixes LP per tap not updating
 */
async function computeEffectiveStats(
  user: any,
  upgradeLevels: Map<string, number>,
  allUpgrades: any[]
): Promise<{
  lpPerTap: number;
  lpPerHour: number;
  maxEnergy: number;
  energyRegen: number;
  tapCooldown: number;
}> {
  // Base values
  let lpPerTap = 2; // Default base tap value
  let lpPerHour = 250; // Default passive income
  let maxEnergy = 1000; // Default max energy
  let energyRegen = 1; // Default energy regen per second
  let tapCooldown = 0; // Default no cooldown
  
  console.log(`📊 [COMPUTE] Starting with base values - LP per tap: ${lpPerTap}`);
  
  // Apply upgrades
  for (const upgrade of allUpgrades) {
    const userLevel = upgradeLevels.get(upgrade.id) || 0;
    
    if (userLevel > 0) {
      console.log(`📊 [COMPUTE] Applying ${upgrade.id} level ${userLevel} (${upgrade.category})`);
      
      // Calculate effect for this level
      const baseEffect = upgrade.baseEffect || 0;
      const effectMultiplier = upgrade.effectMultiplier || 1;
      const totalEffect = baseEffect * userLevel * effectMultiplier;
      
      // Apply effects based on category
      switch (upgrade.category?.toLowerCase()) {
        case 'tapping':
        case 'tap':
          if (upgrade.id.includes('tap') || upgrade.id.includes('click')) {
            lpPerTap += totalEffect;
            console.log(`📊 [COMPUTE] + ${totalEffect} LP per tap from ${upgrade.id} (now ${lpPerTap})`);
          }
          break;
          
        case 'passive':
        case 'income':
          if (upgrade.id.includes('passive') || upgrade.id.includes('hour')) {
            lpPerHour += totalEffect;
            console.log(`📊 [COMPUTE] + ${totalEffect} LP per hour from ${upgrade.id} (now ${lpPerHour})`);
          }
          break;
          
        case 'energy':
          if (upgrade.id.includes('energy') || upgrade.id.includes('stamina')) {
            maxEnergy += totalEffect;
            console.log(`📊 [COMPUTE] + ${totalEffect} max energy from ${upgrade.id} (now ${maxEnergy})`);
          }
          break;
          
        default:
          // Try to infer from upgrade ID
          if (upgrade.id.includes('tap') || upgrade.id.includes('click')) {
            lpPerTap += totalEffect;
            console.log(`📊 [COMPUTE] + ${totalEffect} LP per tap from ${upgrade.id} (inferred, now ${lpPerTap})`);
          } else if (upgrade.id.includes('passive') || upgrade.id.includes('hour')) {
            lpPerHour += totalEffect;
            console.log(`📊 [COMPUTE] + ${totalEffect} LP per hour from ${upgrade.id} (inferred, now ${lpPerHour})`);
          }
          break;
      }
    }
  }
  
  console.log(`✅ [COMPUTE] Final computed values - LP per tap: ${lpPerTap}, LP per hour: ${lpPerHour}`);
  
  return {
    lpPerTap: Math.max(1, Math.round(lpPerTap)), // Minimum 1 LP per tap
    lpPerHour: Math.max(0, Math.round(lpPerHour)),
    maxEnergy: Math.max(100, Math.round(maxEnergy)), // Minimum 100 energy
    energyRegen: Math.max(0.5, energyRegen),
    tapCooldown: Math.max(0, tapCooldown)
  };
}

export default router;