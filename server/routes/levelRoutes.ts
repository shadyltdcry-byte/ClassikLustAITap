import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

export function registerLevelRoutes(app: Express) {
  // Get level requirements for UI display
  app.get("/api/level-requirements", async (req: Request, res: Response) => {
    try {
      console.log('🎆 [LEVELS] Fetching level requirements');
      
      // Default level requirements if database doesn't have them
      const defaultRequirements = [
        { level: 1, lpRequired: 0, name: "Novice", rewards: ["Basic tapping unlocked"] },
        { level: 2, lpRequired: 100, name: "Apprentice", rewards: ["Energy regeneration +10%"] },
        { level: 3, lpRequired: 250, name: "Skilled", rewards: ["LP per tap +1"] },
        { level: 4, lpRequired: 500, name: "Expert", rewards: ["Upgrade slots +1"] },
        { level: 5, lpRequired: 1000, name: "Master", rewards: ["Special abilities unlocked"] },
        { level: 6, lpRequired: 2000, name: "Elite", rewards: ["LP per hour +50"] },
        { level: 7, lpRequired: 4000, name: "Champion", rewards: ["Energy cap +100"] },
        { level: 8, lpRequired: 7500, name: "Legend", rewards: ["All upgrades +10% efficiency"] },
        { level: 9, lpRequired: 12000, name: "Mythic", rewards: ["Prestige system unlocked"] },
        { level: 10, lpRequired: 20000, name: "Transcendent", rewards: ["Ultimate abilities unlocked"] }
      ];
      
      try {
        // Try to get from database first
        const { data: dbRequirements } = await storage.supabase
          .from('levelRequirements')
          .select('*')
          .order('level', { ascending: true });
          
        if (dbRequirements && dbRequirements.length > 0) {
          console.log(`🎆 [LEVELS] Found ${dbRequirements.length} requirements in database`);
          return res.json(dbRequirements);
        }
      } catch (dbError) {
        console.log('🎆 [LEVELS] Database lookup failed, using defaults');
      }
      
      console.log('🎆 [LEVELS] Using default level requirements');
      res.json(defaultRequirements);
      
    } catch (error: any) {
      console.error('🎆 [LEVELS] Error:', error);
      aiTriage.addEvent({
        id: `level_req_${Date.now()}`,
        severity: 'moderate',
        source: 'server',
        route: '/api/level-requirements',
        method: 'GET',
        message: error.message,
        stack: error.stack
      });
      
      // Fallback to basic requirements
      res.json([
        { level: 1, lpRequired: 0, name: "Novice", rewards: ["Basic gameplay"] },
        { level: 2, lpRequired: 100, name: "Skilled", rewards: ["Enhanced features"] }
      ]);
    }
  });

  // Calculate user's current level based on LP
  app.get("/api/user/:userId/level", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      const userLP = Number(user.lp || 0);
      
      // Get level requirements to calculate current level
      const reqResponse = await fetch(`${req.protocol}://${req.get('host')}/api/level-requirements`);
      const requirements = await reqResponse.json();
      
      let currentLevel = 1;
      let nextLevelLP = 100;
      
      for (const req of requirements) {
        if (userLP >= req.lpRequired) {
          currentLevel = req.level;
        } else {
          nextLevelLP = req.lpRequired;
          break;
        }
      }
      
      console.log(`🎆 [LEVELS] User ${userId}: ${userLP} LP = Level ${currentLevel}`);
      
      res.json({
        userId,
        currentLevel,
        totalLP: userLP,
        nextLevelLP,
        progressToNext: Math.min(1, userLP / nextLevelLP)
      });
      
    } catch (error: any) {
      console.error('🎆 [LEVELS] User level calc error:', error);
      res.status(500).json(createErrorResponse(error.message));
    }
  });

  console.log('🎆 [ROUTES] Level routes registered successfully');
}