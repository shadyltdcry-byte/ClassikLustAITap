import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

export function registerAchievementRoutes(app: Express) {
  // Get all achievements with user progress
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      console.log(`🏆 [ACHIEVEMENTS] Fetching achievements for user: ${userId || 'anonymous'}`);
      
      // Default achievement templates
      const defaultAchievements = [
        {
          id: "achievement_first_steps",
          title: "First Steps",
          description: "Complete your first tap",
          icon: "👣",
          category: "basic",
          requirement: { type: "taps", value: 1 },
          reward: { lp: 25, title: "Beginner" }
        },
        {
          id: "achievement_tap_master",
          title: "Tap Master",
          description: "Tap 100 times",
          icon: "💪",
          category: "tapping",
          requirement: { type: "taps", value: 100 },
          reward: { lp: 200, booster: "tap_multiplier_2x" }
        },
        {
          id: "achievement_energy_hoarder",
          title: "Energy Hoarder",
          description: "Reach 1000 total energy",
          icon: "⚡",
          category: "energy",
          requirement: { type: "energy", value: 1000 },
          reward: { lp: 150, energy: 500 }
        },
        {
          id: "achievement_level_climber",
          title: "Level Climber",
          description: "Reach level 5",
          icon: "🧗",
          category: "progression",
          requirement: { type: "level", value: 5 },
          reward: { lp: 500, upgrade_discount: 0.1 }
        },
        {
          id: "achievement_upgrade_collector",
          title: "Upgrade Collector",
          description: "Purchase 10 upgrades",
          icon: "🔧",
          category: "upgrades",
          requirement: { type: "upgrades", value: 10 },
          reward: { lp: 300, special_upgrade: "mega_booster" }
        },
        {
          id: "achievement_task_completer",
          title: "Task Completer",
          description: "Complete 5 tasks",
          icon: "✅",
          category: "tasks",
          requirement: { type: "tasks_completed", value: 5 },
          reward: { lp: 250, xp_multiplier: 1.5 }
        },
        {
          id: "achievement_wealthy",
          title: "Wealthy Player",
          description: "Accumulate 10,000 LP",
          icon: "💰",
          category: "wealth",
          requirement: { type: "lp_total", value: 10000 },
          reward: { lp: 1000, premium_character: true }
        }
      ];
      
      if (!userId || userId === 'anonymous') {
        // Return default achievements with 0 progress
        const achievements = defaultAchievements.map(ach => ({
          ...ach,
          progress: 0,
          completed: false,
          claimed: false
        }));
        return res.json(achievements);
      }
      
      // Get user data for progress calculation
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      // Get user achievement completions
      const { data: userAchievements } = await storage.supabase
        .from('userAchievements')
        .select('achievementId, completed, claimedAt, progress')
        .eq('userId', userId);
      
      const completedMap = new Map();
      const claimedMap = new Map();
      const progressMap = new Map();
      
      userAchievements?.forEach(ua => {
        if (ua.completed) completedMap.set(ua.achievementId, true);
        if (ua.claimedAt) claimedMap.set(ua.achievementId, true);
        progressMap.set(ua.achievementId, ua.progress || 0);
      });
      
      // Calculate progress for each achievement
      const achievementsWithProgress = defaultAchievements.map(achievement => {
        let progress = progressMap.get(achievement.id) || 0;
        
        // Calculate current progress based on requirement type
        switch (achievement.requirement.type) {
          case 'taps':
            progress = Math.min(user.totalTaps || 0, achievement.requirement.value);
            break;
          case 'energy':
            progress = Math.min(user.maxEnergy || user.energy || 0, achievement.requirement.value);
            break;
          case 'level':
            progress = Math.min(user.level || 1, achievement.requirement.value);
            break;
          case 'lp_total':
            progress = Math.min(user.totalLPEarned || user.lp || 0, achievement.requirement.value);
            break;
          case 'upgrades':
            progress = Math.min(user.upgradesPurchased || 0, achievement.requirement.value);
            break;
          case 'tasks_completed':
            progress = Math.min(user.tasksCompleted || 0, achievement.requirement.value);
            break;
        }
        
        const completed = progress >= achievement.requirement.value;
        const claimed = claimedMap.has(achievement.id);
        
        return {
          ...achievement,
          progress,
          progressPercent: Math.round((progress / achievement.requirement.value) * 100),
          completed,
          claimed,
          canClaim: completed && !claimed
        };
      });
      
      console.log(`🏆 [ACHIEVEMENTS] Returning ${achievementsWithProgress.length} achievements (${achievementsWithProgress.filter(a => a.canClaim).length} claimable)`);
      res.json(achievementsWithProgress);
      
    } catch (error: any) {
      console.error('🏆 [ACHIEVEMENTS] Error:', error);
      aiTriage.addEvent({
        id: `achievement_fetch_${Date.now()}`,
        severity: 'moderate',
        source: 'server',
        route: '/api/achievements',
        method: 'GET',
        message: error.message,
        stack: error.stack
      });
      res.json([]);
    }
  });

  // Claim achievement reward
  app.post("/api/achievements/:achievementId/claim", async (req: Request, res: Response) => {
    try {
      const { achievementId } = req.params;
      const { userId } = req.body || {};
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }
      
      console.log(`🏆 [ACHIEVEMENT_CLAIM] User ${userId} claiming ${achievementId}`);
      
      // Get user and verify achievement exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      // Check if already claimed
      const { data: existingClaim } = await storage.supabase
        .from('userAchievements')
        .select('claimedAt, completed')
        .eq('userId', userId)
        .eq('achievementId', achievementId)
        .maybeSingle();
        
      if (existingClaim?.claimedAt) {
        return res.status(400).json(createErrorResponse('Achievement already claimed'));
      }
      
      if (!existingClaim?.completed) {
        return res.status(400).json(createErrorResponse('Achievement not yet completed'));
      }
      
      // Apply achievement rewards (basic implementation)
      let lpReward = 0;
      let energyReward = 0;
      
      // Simple reward mapping - in production, this would be more sophisticated
      const rewardMap: Record<string, any> = {
        'achievement_first_steps': { lp: 25 },
        'achievement_tap_master': { lp: 200 },
        'achievement_energy_hoarder': { lp: 150, energy: 500 },
        'achievement_level_climber': { lp: 500 },
        'achievement_upgrade_collector': { lp: 300 },
        'achievement_task_completer': { lp: 250 },
        'achievement_wealthy': { lp: 1000 }
      };
      
      const reward = rewardMap[achievementId];
      if (!reward) {
        return res.status(404).json(createErrorResponse('Achievement not found'));
      }
      
      lpReward = reward.lp || 0;
      energyReward = reward.energy || 0;
      
      // Apply rewards to user
      const newLP = (user.lp || 0) + lpReward;
      const newEnergy = Math.min(1000, (user.energy || 0) + energyReward);
      
      // Update user stats
      const { error: updateError } = await storage.supabase
        .from('users')
        .update({ 
          lp: newLP,
          energy: newEnergy
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      // Mark achievement as claimed
      const { error: claimError } = await storage.supabase
        .from('userAchievements')
        .upsert({
          userId,
          achievementId,
          completed: true,
          claimedAt: new Date().toISOString()
        }, { onConflict: 'userId,achievementId' });
        
      if (claimError) throw claimError;
      
      console.log(`🏆 [ACHIEVEMENT_CLAIM] Success: +${lpReward} LP, +${energyReward} Energy`);
      
      res.json(createSuccessResponse({
        message: 'Achievement claimed successfully',
        rewards: {
          lp: lpReward,
          energy: energyReward
        },
        newStats: {
          lp: newLP,
          energy: newEnergy
        }
      }));
      
    } catch (error: any) {
      console.error('🏆 [ACHIEVEMENT_CLAIM] Error:', error);
      aiTriage.addEvent({
        id: `achievement_claim_${Date.now()}`,
        severity: 'critical',
        source: 'server',
        route: '/api/achievements/claim',
        method: 'POST',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json(createErrorResponse(error.message || 'Failed to claim achievement'));
    }
  });
  
  console.log('🏆 [ROUTES] Achievement routes registered with reward system');
}