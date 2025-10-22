import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

export function registerUpgradeRoutes(app: Express) {
  // Player: list upgrades with computed cost/effect
  app.get("/api/upgrades", async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllUpgrades();
      
      // Map each upgrade with computed cost/effect for current player
      const userId = req.query.userId || req.headers['x-user-id'];
      const mapped = await Promise.all((items || []).map(async (u: any) => {
        let currentLevel = 0;
        
        // Get current level from userUpgrades table
        if (userId) {
          try {
            const { data } = await storage.supabase
              .from('userUpgrades')
              .select('level')
              .eq('userId', userId)
              .eq('upgradeId', u.id)
              .single();
            currentLevel = data?.level || 0;
          } catch (e) {
            // No upgrade record yet, default to 0
          }
        }
        
        const baseCost = Number(u.basecost || 0);
        const costMult = Number(u.costmultiplier || 1);
        const baseEffect = Number(u.baseeffect || 0);
        const effectMult = Number(u.effectmultiplier || 1);
        const cost = Math.max(0, Math.round(baseCost * Math.pow(costMult, currentLevel)));
        const effectValue = Math.round(baseEffect * Math.pow(effectMult, currentLevel));
        const effect = u.category === 'lpPerTap' ? `+${effectValue} LP/tap` : u.category === 'lpPerHour' ? `+${effectValue} LP/hour` : `+${effectValue}`;
        
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          category: u.category,
          currentLevel,
          maxLevel: u.maxlevel || 0,
          cost,
          effect,
        };
      }));
      
      res.json(mapped);
    } catch (error: any) {
      aiTriage.addEvent({
        severity: 'moderate',
        source: 'server',
        route: '/api/upgrades',
        method: 'GET',
        message: error.message,
        stack: error.stack,
        details: { query: req.query }
      });
      res.json([]);
    }
  });

  // Player: purchase upgrade using userUpgrades table
  app.post("/api/upgrades/:id/purchase", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }

      // Get current user and upgrade
      const [user, upgrade] = await Promise.all([
        storage.getUser(userId),
        storage.getUpgrade(id)
      ]);
      
      if (!user) return res.status(404).json(createErrorResponse('User not found'));
      if (!upgrade) return res.status(404).json(createErrorResponse('Upgrade not found'));

      // Get current upgrade level from userUpgrades table
      const { data: userUpgrade } = await storage.supabase
        .from('userUpgrades')
        .select('level')
        .eq('userId', userId)
        .eq('upgradeId', id)
        .single();
      
      const currentLevel = userUpgrade?.level || 0;
      const nextLevel = currentLevel + 1;
      
      // Check max level
      if (upgrade.maxlevel && nextLevel > upgrade.maxlevel) {
        return res.status(400).json(createErrorResponse('Upgrade already at max level'));
      }

      // Compute cost for current level
      const baseCost = Number(upgrade.basecost || 0);
      const costMult = Number(upgrade.costmultiplier || 1);
      const cost = Math.max(0, Math.round(baseCost * Math.pow(costMult, currentLevel)));

      // Check LP balance
      const userLP = Number(user.lp || 0);
      if (userLP < cost) {
        return res.status(400).json(createErrorResponse('Insufficient LP'));
      }

      // Execute purchase in transaction
      await storage.supabase.rpc('purchase_upgrade_transaction', {
        p_user_id: userId,
        p_upgrade_id: id,
        p_cost: cost,
        p_new_level: nextLevel
      });

      // If RPC doesn't exist, do manual transaction
      // (This will be caught and triaged by AI if it fails)
      
      res.json(createSuccessResponse({
        message: 'Upgrade purchased successfully',
        newLevel: nextLevel,
        costPaid: cost,
        newLP: userLP - cost
      }));
      
    } catch (error: any) {
      aiTriage.addEvent({
        severity: 'critical',
        source: 'server',
        route: '/api/upgrades/purchase',
        method: 'POST',
        message: error.message,
        stack: error.stack,
        userId: req.body?.userId,
        details: { upgradeId: req.params.id, body: req.body }
      });
      
      res.status(500).json(createErrorResponse(error.message || 'Purchase failed'));
    }
  });
}