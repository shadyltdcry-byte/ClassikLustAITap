/**
 * Task.tsx
 * Last Edited 2025-08-17 by MistralAI
 *
 *
 *
 * Please leave a detailed description
 *      of each function you add
 */

// NewStructure/Achievements.tsx



import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  maxProgress: number;
  difficulty: string;
  timeLimit?: string;
}

export default function Task() {
  const [activeTab, setActiveTab] = useState<"all" | "progress" | "completed">("all");

  // Mock task data
  const MOCK_TASKS: Task[] = [
    {
      id: "1",
      title: "Daily Login",
      description: "Log in to the game",
      reward: "50 Lust Points",
      progress: 1,
      maxProgress: 1,
      difficulty: "easy",
      timeLimit: "Resets in 18h",
    },
    {
      id: "2",
      title: "Tap Master",
      description: "Tap characters 100 times",
      reward: "200 Lust Points",
      progress: 45,
      maxProgress: 100,
      difficulty: "medium",
    },
    {
      id: "3",
      title: "Spin the Wheel",
      description: "Use the daily wheel",
      reward: "Random Reward",
      progress: 1,
      maxProgress: 1,
      difficulty: "easy",
      timeLimit: "Daily",
    },
    {
      id: "4",
      title: "Chat Champion",
      description: "Send 20 messages in chat",
      reward: "500 Lust Points",
      progress: 3,
      maxProgress: 20,
      difficulty: "hard",
    },
  ];

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "progress") return task.progress < task.maxProgress;
    if (activeTab === "completed") return task.progress >= task.maxProgress;
    return true;
  });

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-600/50";
      case "medium":
        return "bg-blue-600/50";
      case "hard":
        return "bg-red-600/50";
      default:
        return "bg-gray-600/50";
    }
  };

  const handleClaimTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/claim/${taskId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: "default-player" }), // Replace with actual user ID
      });
      if (response.ok) {
        console.log("Task claimed successfully");
        // Refresh task data
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, progress: 0 } : task
        );
        setTasks(updatedTasks);
      } else {
        console.error("Failed to claim task");
      }
    } catch (error) {
      console.error("Error claiming task:", error);
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 rounded-full text-sm ${
              activeTab === "all" ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            All
          </Button>
          <Button
            onClick={() => setActiveTab("progress")}
            className={`px-6 py-2 rounded-full text-sm ${
              activeTab === "progress" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            In Progress
          </Button>
          <Button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-2 rounded-full text-sm ${
              activeTab === "completed" ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-black/20 rounded-xl p-4 border border-gray-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">📋</span>
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-2">
                    {task.description}
                  </p>
                  {task.timeLimit && (
                    <p className="text-xs text-orange-400 mb-2">
                      ⏰ {task.timeLimit}
                    </p>
                  )}
                  {/* Progress */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Progress</span>
                      <span>
                        {task.progress}/{task.maxProgress}
                      </span>
                    </div>
                    <Progress
                      value={(task.progress / task.maxProgress) * 100}
                      className="h-2 bg-gray-700"
                    />
                  </div>
                  {/* Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      <span>🎁</span>
                      <span className="text-green-400 font-medium">
                        {task.reward}
                      </span>
                    </div>
                    {task.progress >= task.maxProgress && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={() => handleClaimTask(task.id)}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
