import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";

const storage = SupabaseStorage.getInstance();

export function registerUpgradeRoutes(app: Express) {
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
      res.json([]);
    }
  });
}
