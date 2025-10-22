import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";

const storage = SupabaseStorage.getInstance();

export function registerUpgradeRoutes(app: Express) {
  // Player: list upgrades with computed cost/effect
  app.get("/api/upgrades", async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllUpgrades();
      const mapped = (items || []).map((u: any) => {
        const currentLevel = Number(u.currentlevel || 0);
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
          currentLevel: currentLevel,
          maxLevel: u.maxlevel || 0,
          cost,
          effect,
        };
      });
      res.json(mapped);
    } catch (e) {
      console.error(e);
      res.json([]);
    }
  });

  // Player: purchase upgrade and persist
  app.post("/api/upgrades/:id/purchase", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      // Load user
      const user = await storage.getUser(userId) || await storage.getUser(`telegram_${userId}`);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Load upgrade definition
      const upgrade = await storage.getUpgrade(id);
      if (!upgrade) return res.status(404).json({ error: 'Upgrade not found' });

      // Determine current level for this user (fallback 0)
      // If you have a userUpgrades table, fetch it; for now, use user[`${id}_level`] style as a soft fallback
      const currentLevel = Number((user as any)[`${id}_level`] || 0);
      const nextLevel = currentLevel + 1;

      // Compute cost for next level
      const baseCost = Number(upgrade.basecost || 0);
      const costMult = Number(upgrade.costmultiplier || 1);
      const cost = Math.max(0, Math.round(baseCost * Math.pow(costMult, currentLevel)));

      // Check LP
      const lp = Number((user as any).lp || 0);
      if (lp < cost) return res.status(400).json({ error: 'Not enough LP' });

      // Deduct LP and persist user level for this upgrade
      const updates: any = { lp: lp - cost };
      updates[`${id}_level`] = nextLevel;
      const updatedUser = await storage.updateUser(user.id || userId, updates);

      // Respond with new user state and new computed cost for UI refresh
      return res.json({
        success: true,
        data: {
          user: updatedUser,
          upgrade: {
            id,
            currentLevel: nextLevel,
            nextCost: Math.max(0, Math.round(baseCost * Math.pow(costMult, nextLevel)))
          }
        }
      });
    } catch (e: any) {
      console.error('Purchase failed', e);
      return res.status(500).json({ error: e?.message || 'Failed to purchase upgrade' });
    }
  });
}
