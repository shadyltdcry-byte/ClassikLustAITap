/**
 * upgradeRoutes.js - Fixed Upgrade Purchase Logic
 * Last Edited: 2025-10-24 by Assistant - SLAPPED THE BACKWARDS COST BUG!
 */

import express from 'express';
import { supabase } from '../utils/supabase';
import { CircuitBreakerService } from '../shared/services/CircuitBreakerService';

const router = express.Router();
const circuitService = CircuitBreakerService.getInstance();

/**
 * 💰 CALCULATE UPGRADE COST (FIXED FORMULA)
 * No more backwards "was 225" nonsense!
 */
function calculateUpgradeCost(upgrade) {
  const currentLevel = upgrade.currentLevel || 0;
  const baseCost = upgrade.baseCost || 100;
  const costMultiplier = upgrade.costMultiplier || 1.5;
  
  // Proper compound growth: baseCost * (multiplier ^ currentLevel)
  const nextCost = Math.floor(baseCost * Math.pow(costMultiplier, currentLevel));
  
  console.log(`💰 [COST] ${upgrade.id} level ${currentLevel}: base=${baseCost} * (${costMultiplier}^${currentLevel}) = ${nextCost}`);
  
  return nextCost;
}

/**
 * 💰 APPLY DISCOUNTS (FIXED LOGIC)
 * No more adding when it should subtract!
 */
function applyUpgradeDiscounts(baseCost, userUpgrades) {
  let finalCost = baseCost;
  let discountsApplied = [];
  
  // Find cost-reduction upgrades
  const costReductionUpgrades = userUpgrades.filter(upgrade => 
    upgrade.category === 'cost-reduction' && upgrade.currentLevel > 0
  );
  
  for (const discount of costReductionUpgrades) {
    const reductionPercent = (discount.baseEffect || 5) * discount.currentLevel; // 5% per level
    const maxReduction = 50; // Cap at 50% discount
    
    const actualReduction = Math.min(reductionPercent, maxReduction);
    const reductionAmount = Math.floor(baseCost * (actualReduction / 100));
    
    finalCost = Math.max(1, finalCost - reductionAmount); // Never go below 1 LP
    
    discountsApplied.push({
      upgrade: discount.name,
      level: discount.currentLevel,
      reduction: actualReduction,
      saved: reductionAmount
    });
    
    console.log(`💰 [DISCOUNT] ${discount.name} level ${discount.currentLevel}: -${actualReduction}% (-${reductionAmount} LP)`);
  }
  
  if (discountsApplied.length > 0) {
    console.log(`💰 [FINAL COST] ${baseCost} → ${finalCost} (saved ${baseCost - finalCost} LP)`);
  }
  
  return {
    originalCost: baseCost,
    finalCost: finalCost,
    totalSaved: baseCost - finalCost,
    discounts: discountsApplied
  };
}

/**
 * GET /api/upgrades - Get available upgrades for user
 */
router.get('/', async (req, res) => {
  try {
    const { telegramId } = req.query;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId required'
      });
    }
    
    console.log(`💪 [UPGRADES] Getting upgrades for user: ${telegramId}`);
    
    // Get user's current upgrades
    const { data: userUpgrades, error: userError } = await supabase
      .from('user_upgrades')
      .select('*')
      .eq('telegramId', telegramId);
      
    if (userError) {
      throw new Error(`Failed to get user upgrades: ${userError.message}`);
    }
    
    // Get all available upgrades
    const { data: allUpgrades, error: upgradesError } = await supabase
      .from('upgrades')
      .select('*')
      .order('category, id');
      
    if (upgradesError) {
      throw new Error(`Failed to get upgrades: ${upgradesError.message}`);
    }
    
    // Merge user progress with upgrade definitions
    const enhancedUpgrades = allUpgrades.map(upgrade => {
      const userProgress = userUpgrades.find(up => up.upgradeId === upgrade.id);
      const currentLevel = userProgress?.level || 0;
      const maxLevel = upgrade.maxLevel || 999;
      
      // Calculate next cost with proper formula
      const nextCost = currentLevel < maxLevel ? calculateUpgradeCost({
        ...upgrade,
        currentLevel
      }) : null;
      
      // Apply discounts if applicable
      const costDetails = nextCost ? applyUpgradeDiscounts(nextCost, userUpgrades) : null;
      
      return {
        ...upgrade,
        currentLevel,
        nextCost: costDetails?.finalCost || null,
        originalCost: costDetails?.originalCost || null,
        discountSaved: costDetails?.totalSaved || 0,
        discountsApplied: costDetails?.discounts || [],
        isUnlocked: currentLevel < maxLevel,
        progressPercent: Math.floor((currentLevel / maxLevel) * 100)
      };
    });
    
    console.log(`✅ [UPGRADES] Returning ${enhancedUpgrades.length} upgrades for ${telegramId}`);
    
    res.json({
      success: true,
      data: enhancedUpgrades
    });
    
  } catch (error) {
    console.error('❌ [UPGRADES] Failed to get upgrades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load upgrades',
      details: error.message
    });
  }
});

/**
 * POST /api/upgrades/purchase - Purchase upgrade with FIXED cost calculation
 */
router.post('/purchase', async (req, res) => {
  const breakerKey = 'upgrade-purchase';
  
  try {
    const { telegramId, upgradeId } = req.body;
    
    if (!telegramId || !upgradeId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId and upgradeId required'
      });
    }
    
    console.log(`💰 [PURCHASE] ${upgradeId} for user ${telegramId}`);
    
    // Circuit breaker protection
    const executeWithCircuitBreaker = circuitService.createBreaker(breakerKey, {
      failureThreshold: 3,
      resetTimeout: 30000
    });
    
    const result = await executeWithCircuitBreaker(async () => {
      // Get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telegramId', telegramId)
        .single();
        
      if (userError || !user) {
        throw new Error('User not found');
      }
      
      // Get upgrade definition
      const { data: upgrade, error: upgradeError } = await supabase
        .from('upgrades')
        .select('*')
        .eq('id', upgradeId)
        .single();
        
      if (upgradeError || !upgrade) {
        throw new Error('Upgrade not found');
      }
      
      // Get user's current level for this upgrade
      const { data: userUpgrade } = await supabase
        .from('user_upgrades')
        .select('*')
        .eq('telegramId', telegramId)
        .eq('upgradeId', upgradeId)
        .single();
        
      const currentLevel = userUpgrade?.level || 0;
      const maxLevel = upgrade.maxLevel || 999;
      
      if (currentLevel >= maxLevel) {
        throw new Error('Upgrade already at maximum level');
      }
      
      // Calculate CORRECT cost
      const baseCost = calculateUpgradeCost({ ...upgrade, currentLevel });
      
      // Get all user upgrades for discount calculation
      const { data: allUserUpgrades } = await supabase
        .from('user_upgrades')
        .select('*, upgrades!inner(*)')
        .eq('telegramId', telegramId);
        
      const costDetails = applyUpgradeDiscounts(baseCost, allUserUpgrades || []);
      const actualCost = costDetails.finalCost;
      
      // Check if user has enough LP
      if (user.lp < actualCost) {
        throw new Error(`Insufficient LP. Need ${actualCost}, have ${user.lp}`);
      }
      
      // TRANSACTION: Update user LP and upgrade level
      const newLP = user.lp - actualCost;
      const newLevel = currentLevel + 1;
      
      // Update user LP
      const { error: lpError } = await supabase
        .from('users')
        .update({ lp: newLP })
        .eq('telegramId', telegramId);
        
      if (lpError) {
        throw new Error(`Failed to update user LP: ${lpError.message}`);
      }
      
      // Update or insert user upgrade level
      const { error: upgradeUpdateError } = await supabase
        .from('user_upgrades')
        .upsert({
          telegramId: telegramId,
          upgradeId: upgradeId,
          level: newLevel,
          purchasedAt: new Date().toISOString()
        });
        
      if (upgradeUpdateError) {
        throw new Error(`Failed to update upgrade level: ${upgradeUpdateError.message}`);
      }
      
      console.log(`✅ [PURCHASE] Success: ${upgradeId} level ${newLevel}, cost ${actualCost} LP`);
      
      return {
        upgrade: {
          id: upgradeId,
          name: upgrade.name,
          newLevel: newLevel,
          costPaid: actualCost,
          originalCost: costDetails.originalCost,
          discountSaved: costDetails.totalSaved,
          newLP: newLP
        },
        user: {
          telegramId: telegramId,
          oldLP: user.lp,
          newLP: newLP,
          lpSpent: actualCost
        }
      };
    });
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error(`❌ [PURCHASE] Failed for ${req.body.upgradeId}:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Purchase failed'
    });
  }
});

/**
 * GET /api/upgrades/all - Get all upgrades (for admin)
 */
router.get('/all', async (req, res) => {
  try {
    console.log('💪 [UPGRADES] Getting all upgrades for admin');
    
    const { data: upgrades, error } = await supabase
      .from('upgrades')
      .select('*')
      .order('category, id');
      
    if (error) {
      throw new Error(`Failed to get upgrades: ${error.message}`);
    }
    
    // Recalculate costs for all upgrades
    const enhancedUpgrades = upgrades.map(upgrade => {
      const levels = [0, 1, 2, 3, 4, 5]; // Show costs for multiple levels
      const costProgression = levels.map(level => ({
        level,
        cost: calculateUpgradeCost({ ...upgrade, currentLevel: level })
      }));
      
      return {
        ...upgrade,
        costProgression,
        nextCost: costProgression[0].cost // Cost for level 0 -> 1
      };
    });
    
    console.log(`✅ [UPGRADES] Returning ${enhancedUpgrades.length} upgrades for admin`);
    
    res.json({
      success: true,
      data: enhancedUpgrades
    });
    
  } catch (error) {
    console.error('❌ [UPGRADES] Failed to get all upgrades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load upgrades',
      details: error.message
    });
  }
});

export default router;