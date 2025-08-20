
/**
 * Task.tsx - Task Management Interface
 * Last Edited: 2025-08-19 by Assistant
 * 
 * Complete task interface with proper styling matching AI Chat
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Star, Zap, Gift, Target } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: "available" | "in_progress" | "completed" | "claimed";
  difficulty: "easy" | "medium" | "hard";
  category: "daily" | "weekly" | "achievement" | "special";
  icon: string;
}

interface TaskProps {
  onClaimPrize?: () => void;
}

export default function Task({ onClaimPrize }: TaskProps) {
  const [activeTab, setActiveTab] = useState("all");

  // Mock data for tasks organized by category
  const tasks: Task[] = [
    {
      id: "1",
      title: "Daily Login",
      description: "Log in to the game",
      progress: 1,
      maxProgress: 1,
      reward: "50 LP",
      status: "completed",
      difficulty: "easy",
      category: "daily",
      icon: "🎯"
    },
    {
      id: "2",
      title: "Tap 50 Times",
      description: "Tap your character 50 times",
      progress: 35,
      maxProgress: 50,
      reward: "100 LP",
      status: "in_progress",
      difficulty: "easy",
      category: "daily",
      icon: "👆"
    },
    {
      id: "3",
      title: "Earn 1000 LP",
      description: "Accumulate 1000 LP total",
      progress: 750,
      maxProgress: 1000,
      reward: "200 LP + Energy Boost",
      status: "in_progress",
      difficulty: "medium",
      category: "weekly",
      icon: "💰"
    },
    {
      id: "4",
      title: "Purchase Upgrade",
      description: "Buy your first upgrade",
      progress: 0,
      maxProgress: 1,
      reward: "Special Character Unlock",
      status: "available",
      difficulty: "medium",
      category: "achievement",
      icon: "⬆️"
    },
    {
      id: "5",
      title: "Chat with Character",
      description: "Send 10 messages in AI Chat",
      progress: 3,
      maxProgress: 10,
      reward: "AI Personality Unlock",
      status: "in_progress",
      difficulty: "easy",
      category: "special",
      icon: "💬"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600 text-white";
      case "in_progress":
        return "bg-blue-600 text-white";
      case "available":
        return "bg-gray-600 text-white";
      case "claimed":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "hard":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getFilteredTasks = () => {
    if (activeTab === "all") return tasks;
    return tasks.filter(task => task.category === activeTab);
  };

  const handleClaimTask = (taskId: string) => {
    console.log("Task claimed successfully");
    if (onClaimPrize) {
      onClaimPrize();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black/30 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Tasks & Objectives</h3>
            <p className="text-sm text-gray-400">Complete tasks to earn rewards and progress</p>
          </div>
        </div>
      </div>

      {/* Task Tabs */}
      <div className="flex gap-2 p-4 bg-black/20">
        <Button 
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2 rounded-full ${activeTab === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          📋 All
        </Button>
        <Button 
          onClick={() => setActiveTab("daily")}
          className={`px-6 py-2 rounded-full ${activeTab === "daily" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          📅 Daily
        </Button>
        <Button 
          onClick={() => setActiveTab("weekly")}
          className={`px-6 py-2 rounded-full ${activeTab === "weekly" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          📆 Weekly
        </Button>
        <Button 
          onClick={() => setActiveTab("special")}
          className={`px-6 py-2 rounded-full ${activeTab === "special" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          ⭐ Special
        </Button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {getFilteredTasks().map((task) => (
              <div
                key={task.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Task Icon */}
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{task.icon}</span>
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold">{task.title}</h4>
                      <Badge className={getDifficultyColor(task.difficulty)}>
                        {task.difficulty}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}/{task.maxProgress}</span>
                      </div>
                      <Progress 
                        value={(task.progress / task.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Reward & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">{task.reward}</span>
                      </div>
                      
                      {task.status === "completed" && (
                        <Button
                          onClick={() => handleClaimTask(task.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Claim
                        </Button>
                      )}
                      
                      {task.status === "in_progress" && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">In Progress</span>
                        </div>
                      )}
                      
                      {task.status === "claimed" && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Claimed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
