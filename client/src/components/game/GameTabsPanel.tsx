import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, Zap, Trophy, MessageCircle } from "lucide-react";

interface GameTabsPanelProps {
  activePlugin: string;
  onPluginChange: (plugin: string) => void;
}

export default function GameTabsPanel({ 
  activePlugin, 
  onPluginChange
}: GameTabsPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/90 to-red-900/90 border-t border-pink-500/30 backdrop-blur-sm z-40">
      <div className="flex justify-around items-center p-2">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "main" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("main")}
        >
          <Heart className="w-4 h-4" />
          <span className="text-xs">Main</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "levelup" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("levelup")}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">Level Up</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "upgrades" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("upgrades")}
        >
          <Zap className="w-4 h-4" />
          <span className="text-xs">Upgrades</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "tasks" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("tasks")}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-xs">Tasks</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "achievements" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("achievements")}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-xs">Achievements</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "chat" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("chat")}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">Chat</span>
        </Button>

      </div>
    </div>
  );
}