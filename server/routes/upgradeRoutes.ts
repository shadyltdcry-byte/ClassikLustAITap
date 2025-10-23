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
              .select('level')
              .eq('userId', userId)
              .eq('upgradeId', u.id)
              .maybeSingle(); // Use maybeSingle to avoid PGRST116
            currentLevel = data?.level || 0;
          } catch (e) {
            console.warn(`📦 [UPGRADES] Failed to get level for ${u.id}:`, e);
          }
        }
        
        const baseCost = Number(u.basecost || 0);
        const costMult = Number(u.costmultiplier || 1.2);
        const baseEffect = Number(u.baseeffect || 1);
        const effectMult = Number(u.effectmultiplier || 1.1);
        const cost = Math.max(1, Math.round(baseCost * Math.pow(costMult, currentLevel)));
        const effectValue = Math.round(baseEffect * Math.pow(effectMult, currentLevel));
        const effect = u.category === 'lpPerTap' ? `+${effectValue} LP/tap` : u.category === 'lpPerHour' ? `+${effectValue} LP/hour` : `+${effectValue}`;
        
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          category: u.category,
          currentLevel,
          maxLevel: u.maxlevel || 10,
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

  // Player: purchase upgrade with GUARANTEED persistence
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
        .select('level')
        .eq('userId', userId)
        .eq('upgradeId', id)
        .maybeSingle(); // Prevents PGRST116 "0 rows" error
      
      const currentLevel = userUpgrade?.level || 0;
      const nextLevel = currentLevel + 1;
      
      // Check max level
      if (upgrade.maxlevel && nextLevel > upgrade.maxlevel) {
        return res.status(400).json(createErrorResponse('Upgrade already at max level'));
      }

      // Compute cost for current level
      const baseCost = Number(upgrade.basecost || 0);
      const costMult = Number(upgrade.costmultiplier || 1.2);
      const cost = Math.max(1, Math.round(baseCost * Math.pow(costMult, currentLevel)));

      // Check LP balance
      const userLP = Number(user.lp || 0);
      if (userLP < cost) {
        return res.status(400).json(createErrorResponse('Insufficient LP'));
      }

      console.log(`🛒 [PURCHASE] Processing: Level ${currentLevel} → ${nextLevel}, Cost: ${cost} LP`);

      // TRY RPC FIRST (if exists)
      let success = false;
      try {
        const { data, error } = await storage.supabase.rpc('purchase_upgrade_transaction', {
          p_user_id: userId,
          p_upgrade_id: id,
          p_cost: cost,
          p_new_level: nextLevel
        });
        
        if (!error && data) {
          success = true;
          console.log('🛒 [PURCHASE] RPC transaction successful');
        }
      } catch (rpcError) {
        console.log('🛒 [PURCHASE] RPC not available, using manual transaction');
      }

      // FALLBACK: Manual transaction if RPC failed
      if (!success) {
        const { error: updateError } = await storage.supabase
          .from('users')
          .update({ lp: userLP - cost })
          .eq('id', userId);
        
        if (updateError) throw updateError;

        const { error: upsertError } = await storage.supabase
          .from('userUpgrades')
          .upsert({
            userId,
            upgradeId: id,
            level: nextLevel
          }, { onConflict: 'userId,upgradeId' });
        
        if (upsertError) throw upsertError;
        console.log('🛒 [PURCHASE] Manual transaction successful');
      }

      // VERIFY PERSISTENCE - Critical verification step
      const [verifyUser, verifyUpgrade] = await Promise.all([
        storage.getUser(userId),
        storage.supabase
          .from('userUpgrades')
          .select('level')
          .eq('userId', userId)
          .eq('upgradeId', id)
          .maybeSingle()
      ]);

      const finalLP = Number(verifyUser?.lp || 0);
      const finalLevel = verifyUpgrade.data?.level || 0;

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
        }
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

  console.log('📦 [ROUTES] Upgrade routes registered with verification');
}