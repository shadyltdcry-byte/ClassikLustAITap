/**
 * Achievements.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 * Please leave a detailed description
 *      of each function you add
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ListChecks } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: "locked" | "in_progress" | "completed" | "claimable";
  category: string;
}

export default function Achievements() {
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Mock data for achievements
  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Achievement",
      description: "Complete your first task",
      progress: 50,
      maxProgress: 100,
      reward: "100 points",
      status: "in_progress",
      category: "beginner"
    },
    // Add more achievements as needed
  ];

  return (
    <div>
      <Button onClick={() => setShowAchievementsModal(true)}>
        <ListChecks /> Achievements
      </Button>
      <Dialog open={showAchievementsModal} onOpenChange={setShowAchievementsModal}>
        <DialogContent>
          <DialogTitle>Achievements</DialogTitle>
          <DialogDescription>
            Here are your achievements and progress.
          </DialogDescription>
          <div>
            {achievements.map(achievement => (
              <div key={achievement.id}>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                <p>Reward: {achievement.reward}</p>
                <p>Status: {achievement.status}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
