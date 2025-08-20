
/**
 * Achievements.tsx - Achievement System Interface
 * Last Edited: 2025-08-19 by Assistant
 * 
 * Complete achievement interface with proper styling matching AI Chat
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Crown, Target, Gift, CheckCircle, Lock } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: "locked" | "in_progress" | "completed" | "claimed";
  category: "beginner" | "interaction" | "progression" | "collection" | "premium";
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface AchievementsProps {
  onClaimPrize?: () => void;
}

// Mock data for achievements organized by category
const achievements: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first task",
    progress: 1,
    maxProgress: 1,
    reward: "100 LP",
    status: "completed",
    category: "beginner",
    icon: "🎯",
    rarity: "common"
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
    icon: "👆",
    rarity: "common"
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
    icon: "⬆️",
    rarity: "rare"
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
    icon: "📦",
    rarity: "epic"
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
    icon: "👑",
    rarity: "legendary"
  }
];

export default function Achievements({ onClaimPrize }: AchievementsProps) {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600 text-white";
      case "in_progress":
        return "bg-blue-600 text-white";
      case "locked":
        return "bg-gray-600 text-white";
      case "claimed":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/20 text-gray-300";
      case "rare":
        return "bg-blue-500/20 text-blue-400";
      case "epic":
        return "bg-purple-500/20 text-purple-400";
      case "legendary":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getFilteredAchievements = () => {
    if (activeTab === "all") return achievements;
    return achievements.filter(achievement => achievement.category === activeTab);
  };

  const handleClaimAchievement = (achievementId: string) => {
    console.log("Achievement claimed successfully");
    if (onClaimPrize) {
      onClaimPrize();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black/30 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
            <p className="text-sm text-gray-400">Unlock rewards by completing challenges</p>
          </div>
          <div className="text-right">
            <div className="text-2xl">🏆</div>
            <div className="text-xs text-purple-400">
              {achievements.filter(a => a.status === "completed").length}/{achievements.length}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Tabs */}
      <div className="flex gap-2 p-4 bg-black/20 overflow-x-auto">
        <Button 
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2 rounded-full flex-shrink-0 ${activeTab === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          🏆 All
        </Button>
        <Button 
          onClick={() => setActiveTab("beginner")}
          className={`px-6 py-2 rounded-full flex-shrink-0 ${activeTab === "beginner" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          🎯 Beginner
        </Button>
        <Button 
          onClick={() => setActiveTab("interaction")}
          className={`px-6 py-2 rounded-full flex-shrink-0 ${activeTab === "interaction" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          💫 Interaction
        </Button>
        <Button 
          onClick={() => setActiveTab("progression")}
          className={`px-6 py-2 rounded-full flex-shrink-0 ${activeTab === "progression" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          📈 Progress
        </Button>
        <Button 
          onClick={() => setActiveTab("premium")}
          className={`px-6 py-2 rounded-full flex-shrink-0 ${activeTab === "premium" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
        >
          👑 Premium
        </Button>
      </div>

      {/* Achievement List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {getFilteredAchievements().map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-lg p-4 border transition-colors ${
                  achievement.status === "locked" 
                    ? "bg-gray-800/50 border-gray-700/50" 
                    : "bg-gray-700/50 border-gray-600/50 hover:border-purple-500/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Achievement Icon */}
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    achievement.status === "locked" 
                      ? "bg-gray-700/50" 
                      : achievement.rarity === "legendary" 
                        ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20" 
                        : achievement.rarity === "epic"
                          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                          : "bg-purple-600/20"
                  }`}>
                    {achievement.status === "locked" ? (
                      <Lock className="w-8 h-8 text-gray-500" />
                    ) : (
                      <span className="text-3xl">{achievement.icon}</span>
                    )}
                  </div>

                  {/* Achievement Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-semibold ${achievement.status === "locked" ? "text-gray-500" : "text-white"}`}>
                        {achievement.title}
                      </h4>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <Badge className={getStatusColor(achievement.status)}>
                        {achievement.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <p className={`text-sm mb-3 ${achievement.status === "locked" ? "text-gray-600" : "text-gray-400"}`}>
                      {achievement.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {achievement.status !== "locked" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Reward & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className={`w-4 h-4 ${achievement.status === "locked" ? "text-gray-500" : "text-yellow-400"}`} />
                        <span className={`font-medium ${achievement.status === "locked" ? "text-gray-500" : "text-yellow-400"}`}>
                          {achievement.reward}
                        </span>
                      </div>
                      
                      {achievement.status === "completed" && (
                        <Button
                          onClick={() => handleClaimAchievement(achievement.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Claim
                        </Button>
                      )}
                      
                      {achievement.status === "claimed" && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Claimed</span>
                        </div>
                      )}
                      
                      {achievement.status === "locked" && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm">Locked</span>
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
