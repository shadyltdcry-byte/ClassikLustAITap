import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

// NUCLEAR NORMALIZER - handles both camelCase AND lowercase from DB
function normalizeUpgradeFromDB(u: any) {
  return {
    id: u.id,
    name: u.name,
    description: u.description,
    category: u.category,
    icon: u.icon,
    maxLevel: u.maxLevel ?? u.maxlevel ?? 10,
    // HANDLE BOTH CASES
    baseCost: Number(u.baseCost ?? u.basecost ?? 100),
    hourlyBonus: Number(u.hourlyBonus ?? u.hourlybonus ?? 0),
    tapBonus: Number(u.tapBonus ?? u.tapbonus ?? 0),
    costMultiplier: Number(u.costMultiplier ?? u.costmultiplier ?? 1.5),
    baseEffect: Number(u.baseEffect ?? u.baseeffect ?? 1),
    effectMultiplier: Number(u.effectMultiplier ?? u.effectmultiplier ?? 1.1),
  };
}

export function registerUpgradeRoutes(app: Express) {
  // Player: list upgrades with computed cost/effect
  app.get("/api/upgrades", async (req: Request, res: Response) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      
      const rawItems = await storage.getAllUpgrades();
      
      if (!rawItems || rawItems.length === 0) {
        console.log('📦 [UPGRADES] No upgrades found in database');
        return res.json([]);
      }
      
      const userId = req.query.userId || req.headers['x-user-id'];
      console.log(`📦 [UPGRADES] Fetching ${rawItems.length} upgrades for user: ${userId || 'anonymous'}`);
      
      const mapped = await Promise.all((rawItems || []).map(async (raw: any) => {
        // NORMALIZE THE RAW DB DATA FIRST
        const u = normalizeUpgradeFromDB(raw);
        
        let currentLevel = 0;
        
        // Get current level from userUpgrades table
        if (userId && userId !== 'anonymous') {
          try {
            const { data } = await storage.supabase
              .from('userUpgrades')
              .select('currentLevel')
              .eq('userId', userId)
              .eq('upgradeId', u.id)
              .maybeSingle();
            currentLevel = data?.currentLevel || 0;
          } catch (e) {
            console.warn(`📦 [UPGRADES] Failed to get level for ${u.id}:`, e);
          }
        }
        
        // CALCULATE WITH NORMALIZED VALUES
        const cost = Math.max(1, Math.round(u.baseCost * Math.pow(u.costMultiplier, currentLevel)));
        const effectValue = Math.round(u.baseEffect * Math.pow(u.effectMultiplier, currentLevel));
        const effect = u.category === 'lpPerTap' ? `+${u.tapBonus || effectValue} LP/tap` : 
                      u.category === 'lpPerHour' ? `+${u.hourlyBonus || effectValue} LP/hour` : 
                      `+${effectValue}`;
        
        console.log(`🔧 [UPGRADE] ${u.name}: baseCost=${u.baseCost}, cost=${cost}, level=${currentLevel}/${u.maxLevel}`);
        
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          category: u.category,
          icon: u.icon,
          currentLevel,
          maxLevel: u.maxLevel,
          // RETURN BOTH FOR COMPATIBILITY
          baseCost: u.baseCost,
          hourlyBonus: u.hourlyBonus,
          tapBonus: u.tapBonus,
          cost,
          effect,
        };
      }));
      
      console.log(`📦 [UPGRADES] Returning ${mapped.length} normalized upgrades`);
      res.json(mapped);
    } catch (error: any) {
      console.error('📦 [UPGRADES] Error:', error);
      res.json([]);
    }
  });

  // Player: purchase upgrade
  app.post("/api/upgrades/:id/purchase", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }

      console.log(`🛒 [PURCHASE] Starting upgrade ${id} for user ${userId}`);

      // Get current user and upgrade
      const [user, rawUpgrade] = await Promise.all([
        storage.getUser(userId),
        storage.getUpgrade(id)
      ]);
      
      if (!user) return res.status(404).json(createErrorResponse('User not found'));
      if (!rawUpgrade) return res.status(404).json(createErrorResponse('Upgrade not found'));

      // NORMALIZE THE UPGRADE DATA
      const upgrade = normalizeUpgradeFromDB(rawUpgrade);

      // Get current upgrade level
      const { data: userUpgrade } = await storage.supabase
        .from('userUpgrades')
        .select('currentLevel, totalSpent')
        .eq('userId', userId)
        .eq('upgradeId', id)
        .maybeSingle();
      
      const currentLevel = userUpgrade?.currentLevel || 0;
      const totalSpent = userUpgrade?.totalSpent || 0;
      const nextLevel = currentLevel + 1;
      
      // Check max level
      if (nextLevel > upgrade.maxLevel) {
        return res.status(400).json(createErrorResponse('Upgrade already at max level'));
      }

      // Compute cost for current level WITH NORMALIZED VALUES
      const cost = Math.max(1, Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel)));

      // Check LP balance
      const userLP = Number(user.lp || 0);
      if (userLP < cost) {
        return res.status(400).json(createErrorResponse('Insufficient LP'));
      }

      console.log(`🛒 [PURCHASE] Processing: Level ${currentLevel} → ${nextLevel}, Cost: ${cost} LP (baseCost: ${upgrade.baseCost})`);

      // Update user LP
      const { error: updateError } = await storage.supabase
        .from('users')
        .update({ lp: userLP - cost })
        .eq('id', userId);
      
      if (updateError) throw updateError;

      // Update user upgrade level
      const { error: upsertError } = await storage.supabase
        .from('userUpgrades')
        .upsert({
          userId,
          upgradeId: id,
          currentLevel: nextLevel,
          totalSpent: totalSpent + cost,
          lastPurchased: new Date().toISOString()
        }, { 
          onConflict: 'userId,upgradeId'
        });
      
      if (upsertError) {
        console.error('🛒 [PURCHASE] Upsert error:', upsertError);
        throw upsertError;
      }

      console.log('🛒 [PURCHASE] Transaction successful');

      res.json(createSuccessResponse({
        transaction: {
          costPaid: cost,
          newLP: userLP - cost,
          oldLP: userLP
        },
        upgrade: {
          name: upgrade.name,
          newLevel: nextLevel,
          oldLevel: currentLevel
        }
      }));
      
    } catch (error: any) {
      console.error('🛒 [PURCHASE] Error:', error);
      res.status(500).json(createErrorResponse(error.message || 'Purchase failed'));
    }
  });

  console.log('📦 [ROUTES] Upgrade routes registered with DB field normalization');
}