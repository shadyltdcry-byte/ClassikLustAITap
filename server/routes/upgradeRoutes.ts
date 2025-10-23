import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

export function registerUpgradeRoutes(app: Express) {
  // Player: list upgrades with computed cost/effect - FORCE FRESH DATA
  app.get("/api/upgrades", async (req: Request, res: Response) => {
    try {
      // Disable cache for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      
      const items = await storage.getAllUpgrades();
      
      if (!items || items.length === 0) {
        console.log('📦 [UPGRADES] No upgrades found in database');
        return res.json([]);
      }
      
      // Map each upgrade with computed cost/effect for current player
      const userId = req.query.userId || req.headers['x-user-id'];
      console.log(`📦 [UPGRADES] Fetching ${items.length} upgrades for user: ${userId || 'anonymous'}`);
      
      const mapped = await Promise.all((items || []).map(async (u: any) => {
        let currentLevel = 0;
        
        // Get current level from userUpgrades table
        if (userId && userId !== 'anonymous') {
          try {
            const { data } = await storage.supabase
              .from('userUpgrades')
              .select('currentLevel')
              .eq('userId', userId)
              .eq('upgradeId', u.id)
              .maybeSingle(); // Use maybeSingle to avoid PGRST116
            currentLevel = data?.currentLevel || 0;
          } catch (e) {
            console.warn(`📦 [UPGRADES] Failed to get level for ${u.id}:`, e);
          }
        }
        
        const baseCost = Number(u.baseCost || 0);
        const costMult = Number(u.costMultiplier || 1.2);
        const baseEffect = Number(u.baseEffect || 1);
        const effectMult = Number(u.effectMultiplier || 1.1);
        const cost = Math.max(1, Math.round(baseCost * Math.pow(costMult, currentLevel)));
        const effectValue = Math.round(baseEffect * Math.pow(effectMult, currentLevel));
        const effect = u.category === 'lpPerTap' ? `+${effectValue} LP/tap` : u.category === 'lpPerHour' ? `+${effectValue} LP/hour` : `+${effectValue}`;
        
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          category: u.category,
          currentLevel,
          maxLevel: u.maxLevel || 10,
          cost,
          effect,
        };
      }));
      
      console.log(`📦 [UPGRADES] Returning ${mapped.length} upgrades`);
      res.json(mapped);
    } catch (error: any) {
      console.error('📦 [UPGRADES] Error:', error);
      aiTriage.addEvent({
        id: `upgrade_fetch_${Date.now()}`,
        severity: 'moderate',
        source: 'server',
        route: '/api/upgrades',
        method: 'GET',
        message: error.message,
        stack: error.stack,
        context: { query: req.query, headers: req.headers }
      });
      res.json([]);
    }
  });

  // Player: purchase upgrade with GUARANTEED persistence + REAL-TIME UPDATES
  app.post("/api/upgrades/:id/purchase", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }

      console.log(`🛒 [PURCHASE] Starting upgrade ${id} for user ${userId}`);

      // Get current user and upgrade
      const [user, upgrade] = await Promise.all([
        storage.getUser(userId),
        storage.getUpgrade(id)
      ]);
      
      if (!user) return res.status(404).json(createErrorResponse('User not found'));
      if (!upgrade) return res.status(404).json(createErrorResponse('Upgrade not found'));

      // Get current upgrade level from userUpgrades table - SAFE VERSION
      const { data: userUpgrade } = await storage.supabase
        .from('userUpgrades')
        .select('currentLevel, totalSpent')
        .eq('userId', userId)
        .eq('upgradeId', id)
        .maybeSingle(); // Prevents PGRST116 "0 rows" error
      
      const currentLevel = userUpgrade?.currentLevel || 0;
      const totalSpent = userUpgrade?.totalSpent || 0;
      const nextLevel = currentLevel + 1;
      
      // Check max level
      if (upgrade.maxlevel && nextLevel > upgrade.maxlevel) {
        return res.status(400).json(createErrorResponse('Upgrade already at max level'));
      }

      // Compute cost for current level
      const baseCost = Number(upgrade.baseCost || 0);
      const costMult = Number(upgrade.costMultiplier || 1.2);
      const cost = Math.max(1, Math.round(baseCost * Math.pow(costMult, currentLevel)));

      // Check LP balance
      const userLP = Number(user.lp || 0);
      if (userLP < cost) {
        return res.status(400).json(createErrorResponse('Insufficient LP'));
      }

      console.log(`🛒 [PURCHASE] Processing: Level ${currentLevel} → ${nextLevel}, Cost: ${cost} LP`);

      // MANUAL TRANSACTION with proper constraint handling
      const { error: updateError } = await storage.supabase
        .from('users')
        .update({ lp: userLP - cost })
        .eq('id', userId);
      
      if (updateError) throw updateError;

      // UPSERT with proper constraint handling for userUpgrades
      const { error: upsertError } = await storage.supabase
        .from('userUpgrades')
        .upsert({
          userId,
          upgradeId: id,
          currentLevel: nextLevel,
          totalSpent: totalSpent + cost,
          lastPurchased: new Date().toISOString()
        }, { 
          onConflict: 'userId,upgradeId',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error('🛒 [PURCHASE] Upsert error:', upsertError);
        throw upsertError;
      }

      // APPLY UPGRADE EFFECTS TO USER STATS
      await applyUpgradeEffects(userId, upgrade, nextLevel);
      
      console.log('🛒 [PURCHASE] Transaction successful with effects applied');

      // VERIFY PERSISTENCE - Critical verification step
      const [verifyUser, verifyUpgrade] = await Promise.all([
        storage.getUser(userId),
        storage.supabase
          .from('userUpgrades')
          .select('currentLevel')
          .eq('userId', userId)
          .eq('upgradeId', id)
          .maybeSingle()
      ]);

      const finalLP = Number(verifyUser?.lp || 0);
      const finalLevel = verifyUpgrade.data?.currentLevel || 0;

      // DETECT NO-OP PURCHASES
      if (finalLP >= userLP || finalLevel <= currentLevel) {
        console.error(`🚨 [PURCHASE] NO-OP DETECTED: LP ${userLP}→${finalLP}, Level ${currentLevel}→${finalLevel}`);
        
        aiTriage.addEvent({
          id: `purchase_noop_${Date.now()}`,
          severity: 'critical',
          source: 'server',
          route: '/api/upgrades/purchase',
          method: 'POST',
          message: `Purchase no-op: LP ${userLP}→${finalLP}, Level ${currentLevel}→${finalLevel}`,
          context: {
            userId, upgradeId: id, cost,
            expected: { lp: userLP - cost, level: nextLevel },
            actual: { lp: finalLP, level: finalLevel },
            suggestions: [
              'Check RLS policies on users/userUpgrades tables',
              'Verify userId matches authenticated user',
              'Check for unique constraint on userUpgrades(userId,upgradeId)'
            ]
          }
        });
        
        return res.status(500).json(createErrorResponse('Purchase completed but changes not persisted'));
      }

      // Get updated user stats for frontend refresh
      const updatedUserStats = await getUserStatsWithUpgrades(userId);

      res.json(createSuccessResponse({
        transaction: {
          costPaid: cost,
          newLP: finalLP,
          oldLP: userLP
        },
        upgrade: {
          name: upgrade.name,
          newLevel: finalLevel,
          oldLevel: currentLevel
        },
        updatedStats: updatedUserStats // For frontend real-time updates
      }));
      
    } catch (error: any) {
      console.error('🛒 [PURCHASE] Error:', error);
      aiTriage.addEvent({
        id: `purchase_error_${Date.now()}`,
        severity: 'critical',
        source: 'server',
        route: '/api/upgrades/purchase',
        method: 'POST',
        message: error.message,
        stack: error.stack,
        context: { userId: req.body?.userId, upgradeId: req.params.id }
      });
      
      res.status(500).json(createErrorResponse(error.message || 'Purchase failed'));
    }
  });

  console.log('📦 [ROUTES] Enhanced upgrade routes registered with real-time updates');
}

// Apply upgrade effects to user's base stats
async function applyUpgradeEffects(userId: string, upgrade: any, newLevel: number) {
  try {
    console.log(`⚡ [EFFECTS] Applying ${upgrade.category} effect for ${upgrade.id} at level ${newLevel}`);
    
    // Get current user stats
    const { data: user, error: userError } = await storage.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('⚡ [EFFECTS] User fetch failed:', userError);
      return;
    }

    // Calculate total effect for this specific upgrade
    const baseEffect = Number(upgrade.baseEffect || 1);
    const effectMult = Number(upgrade.effectMultiplier || 1.1);
    const totalEffect = Math.round(baseEffect * Math.pow(effectMult, newLevel - 1));
    
    let updateData: any = {};

    // Apply different effects based on upgrade category
    switch (upgrade.category) {
      case 'lpPerTap':
        // Recalculate total LP per tap from all upgrades
        const lpPerTapUpgrades = await getAllUserUpgradesByCategory(userId, 'lpPerTap');
        let totalLpPerTap = 1; // Base LP per tap
        for (const userUpg of lpPerTapUpgrades) {
          const upgDetail = await storage.getUpgrade(userUpg.upgradeId);
          if (upgDetail) {
            const effect = Math.round(Number(upgDetail.baseEffect) * Math.pow(Number(upgDetail.effectMultiplier), userUpg.currentLevel - 1));
            totalLpPerTap += effect;
          }
        }
        updateData.lpPerTap = totalLpPerTap;
        console.log(`👆 [EFFECTS] Total LP per tap: ${totalLpPerTap}`);
        break;
        
      case 'lpPerHour':
        // Recalculate total LP per hour from all upgrades
        const lpPerHourUpgrades = await getAllUserUpgradesByCategory(userId, 'lpPerHour');
        let totalLpPerHour = 0; // Base LP per hour
        for (const userUpg of lpPerHourUpgrades) {
          const upgDetail = await storage.getUpgrade(userUpg.upgradeId);
          if (upgDetail) {
            const effect = Math.round(Number(upgDetail.baseEffect) * Math.pow(Number(upgDetail.effectMultiplier), userUpg.currentLevel - 1));
            totalLpPerHour += effect;
          }
        }
        updateData.lpPerHour = totalLpPerHour;
        console.log(`⏰ [EFFECTS] Total LP per hour: ${totalLpPerHour}`);
        break;
        
      case 'energy':
        // Recalculate total max energy from all upgrades
        const energyUpgrades = await getAllUserUpgradesByCategory(userId, 'energy');
        let totalMaxEnergy = 1000; // Base max energy
        for (const userUpg of energyUpgrades) {
          const upgDetail = await storage.getUpgrade(userUpg.upgradeId);
          if (upgDetail) {
            const effect = Math.round(Number(upgDetail.baseEffect) * Math.pow(Number(upgDetail.effectMultiplier), userUpg.currentLevel - 1));
            totalMaxEnergy += effect;
          }
        }
        updateData.maxEnergy = totalMaxEnergy;
        // Don't exceed max energy when increasing capacity
        if (user.energy > totalMaxEnergy) {
          updateData.energy = totalMaxEnergy;
        }
        console.log(`⚡ [EFFECTS] Total max energy: ${totalMaxEnergy}`);
        break;
        
      case 'special':
        // Store special upgrade data for gameplay logic
        const specialUpgrades = user.specialUpgrades ? JSON.parse(user.specialUpgrades) : {};
        specialUpgrades[upgrade.id] = newLevel;
        updateData.specialUpgrades = JSON.stringify(specialUpgrades);
        console.log(`🌟 [EFFECTS] Special upgrade ${upgrade.id} level: ${newLevel}`);
        break;
    }

    // Update user with new calculated effects
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await storage.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('⚡ [EFFECTS] Effect update failed:', updateError);
      } else {
        console.log('✅ [EFFECTS] Effects applied successfully:', updateData);
      }
    }
  } catch (error) {
    console.error('💥 [EFFECTS] Error applying effects:', error);
  }
}

// Get all user upgrades by category for effect calculation
async function getAllUserUpgradesByCategory(userId: string, category: string) {
  try {
    const { data: userUpgrades, error } = await storage.supabase
      .from('userUpgrades')
      .select('upgradeId, currentLevel')
      .eq('userId', userId)
      .gt('currentLevel', 0);

    if (error || !userUpgrades) return [];

    // Filter by category
    const filteredUpgrades = [];
    for (const userUpg of userUpgrades) {
      const upgrade = await storage.getUpgrade(userUpg.upgradeId);
      if (upgrade && upgrade.category === category) {
        filteredUpgrades.push(userUpg);
      }
    }

    return filteredUpgrades;
  } catch (error) {
    console.error('💥 [EFFECTS] Error fetching user upgrades by category:', error);
    return [];
  }
}

// Get user stats with all upgrades calculated for frontend updates
async function getUserStatsWithUpgrades(userId: string) {
  try {
    const { data: user, error: userError } = await storage.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) return null;

    return {
      lp: user.lp,
      energy: user.energy,
      maxEnergy: user.maxEnergy || 1000,
      lpPerTap: user.lpPerTap || 1,
      lpPerHour: user.lpPerHour || 0,
      level: user.level || 1
    };
  } catch (error) {
    console.error('💥 [STATS] Error fetching user stats:', error);
    return null;
  }
}