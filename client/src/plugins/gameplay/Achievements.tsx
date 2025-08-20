
/**
 * Achievements.tsx - Achievement Data Management  
 * Last Edited: 2025-08-19 by Assistant
 *
 * Pure data logic for achievements - NO GUI components
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: 'completed' | 'in_progress' | 'locked';
  category: string;
  icon: string;
}

export const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first task",
    progress: 1,
    maxProgress: 1,
    reward: "100 LP",
    status: "completed",
    category: "beginner",
    icon: "🎯"
  },
  {
    id: "2",
    title: "Tap Master",
    description: "Tap character 100 times",
    progress: 45,
    maxProgress: 100,
    reward: "500 LP",
    status: "in_progress",
    category: "interaction",
    icon: "👆"
  },
  {
    id: "3",
    title: "Level Up",
    description: "Reach level 5", 
    progress: 3,
    maxProgress: 5,
    reward: "1000 LP + Energy Boost",
    status: "in_progress",
    category: "progression",
    icon: "⬆️"
  },
  {
    id: "4",
    title: "Collector",
    description: "Unlock 5 different characters",
    progress: 1,
    maxProgress: 5,
    reward: "Special Character Unlock",
    status: "in_progress",
    category: "collection",
    icon: "📦"
  },
  {
    id: "5",
    title: "VIP Status",
    description: "Purchase VIP membership",
    progress: 0,
    maxProgress: 1,
    reward: "VIP Benefits Access", 
    status: "locked",
    category: "premium",
    icon: "👑"
  }
];

export const getAchievementsByCategory = (category?: string) => {
  if (!category || category === "all") return mockAchievements;
  return mockAchievements.filter(achievement => achievement.category === category);
};

export const claimAchievementReward = (achievementId: string) => {
  console.log("Failed to claim achievement");
  return { success: false, error: "Achievement not ready to claim" };
};

export default function Achievements({ onClaimPrize }: { onClaimPrize?: () => void }) {
  // This component should only be called from GameGUI for rendering
  // All GUI logic should be in GameGUI.tsx
  return null;
}
