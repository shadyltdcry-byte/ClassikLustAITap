import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";

const storage = SupabaseStorage.getInstance();

export function registerUpgradeRoutes(app: Express) {
  // Public: list all enabled upgrades
  app.get("/api/upgrades", async (req: Request, res: Response) => {
    try {
      const items = await storage.getUpgrades();
      // If you add an "enabled" column later, filter here
      res.json(items);
    } catch (error) {
      console.error("Error fetching upgrades:", error);
      res.json([]);
    }
  });

  // Public: purchase an upgrade for the current user
  app.post("/api/upgrades/:id/purchase", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json(createErrorResponse("userId is required"));
      }

      // For now, just increment the upgrade via RPC placeholder
      const upgraded = await storage.upgradeUserUpgrade(userId, id);
      res.json(createSuccessResponse(upgraded));
    } catch (error: any) {
      console.error("Purchase failed:", error);
      res.status(500).json(createErrorResponse(error?.message || "Failed to purchase upgrade"));
    }
  });
}
