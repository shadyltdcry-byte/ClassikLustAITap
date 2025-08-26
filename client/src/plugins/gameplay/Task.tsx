
/**
 * Task.tsx - Task Data Management
 * Last Edited: 2025-08-19 by Assistant
 *
 * Pure data logic for task management - NO GUI components
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: 'active' | 'completed' | 'locked';
  category: string;
  icon: string;
}

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "First Tap",
    description: "Tap your character 5 times",
    progress: 3,
    maxProgress: 5,
    reward: "50 LP",
    status: "active",
    category: "basic",
    icon: "👆"
  },
  {
    id: "2", 
    title: "Energy Master",
    description: "Reach maximum energy",
    progress: 80,
    maxProgress: 100,
    reward: "100 LP + Energy Boost",
    status: "active",
    category: "energy",
    icon: "⚡"
  },
  {
    id: "3",
    title: "Level Up",
    description: "Reach level 3",
    progress: 1,
    maxProgress: 3,
    reward: "200 LP + Upgrade Unlock",
    status: "active", 
    category: "progression",
    icon: "⬆️"
  },
  {
    id: "4",
    title: "Coin Collector",
    description: "Collect 1000 coins",
    progress: 450,
    maxProgress: 1000,
    reward: "Special Character Unlock",
    status: "active",
    category: "collection",
    icon: "💰"
  },
  {
    id: "5",
    title: "VIP Achievement", 
    description: "Purchase VIP membership",
    progress: 0,
    maxProgress: 1,
    reward: "VIP Benefits Access",
    status: "locked",
    category: "premium",
    icon: "👑"
  }
];

export const getTasksByCategory = (category?: string) => {
  if (!category || category === "all") return mockTasks;
  return mockTasks.filter(task => task.category === category);
};

export const claimTaskReward = (taskId: string) => {
  console.log("Task claimed successfully");
  return { success: true, reward: "Task reward claimed!" };
};

export default function Task({ onClaimPrize }: { onClaimPrize?: () => void }) {
  
  // All GUI  should be in GameGUI.tsx
  return null;
}
