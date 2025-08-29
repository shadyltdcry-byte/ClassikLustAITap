import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home,
  TrendingUp, 
  Settings, 
  Target, 
  MessageCircle,
  Gem,
  User,
  Heart
} from "lucide-react";

// ClassikLust Mock Data - matching screenshots
const mockPlayerData = {
  name: "ShadyLTDx",
  level: 72,
  lp: 64925095,
  lpPerHour: 29756000,
  lustGems: 11,
  avatar: "https://i.pravatar.cc/64?img=33"
};

const mockCharacter = {
  name: "Luna",
  level: 12,
  imageUrl: "https://cdn.donmai.us/original/d8/3c/d83c5819c29f3b16a7ba1e3c4e9b47b2.jpg",
  bond: 85
};

interface GameGUIProps {
  playerData?: any;
  onPluginAction: (action: string, data?: any) => void;
  onPluginChange?: (plugin: string) => void;
}

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {
  const [activeTab, setActiveTab] = useState("main");
  const [isTapping, setIsTapping] = useState(false);

  const player = mockPlayerData;
  const character = mockCharacter;

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Handle character tap
  const handleCharacterTap = () => {
    setIsTapping(true);
    onPluginAction('tap', { characterId: character.name });
    setTimeout(() => setIsTapping(false), 150);
  };

  // Navigation tabs
  const navTabs = [
    { id: "main", icon: Home, label: "Main" },
    { id: "levelup", icon: TrendingUp, label: "Level Up" },
    { id: "upgrades", icon: Settings, label: "Upgrades" },
    { id: "tasks", icon: Target, label: "Tasks" },
    { id: "chat", icon: MessageCircle, label: "Chat" }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white overflow-hidden">
      {/* ClassikLust Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20 p-3">
        <div className="flex items-center justify-between">
          {/* User Profile Section */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-purple-400">
              <img src={player.avatar} alt="Player Avatar" />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-purple-200">{player.name}</div>
              <div className="text-xs text-purple-300">Lv. {player.level}</div>
            </div>
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-4">
            {/* LP Display */}
            <div className="text-right">
              <div className="text-lg font-bold text-pink-300">{formatNumber(player.lp)}</div>
              <div className="text-xs text-purple-300">LP</div>
            </div>
            
            {/* Lust Gems */}
            <div className="flex items-center gap-1 bg-purple-800/50 px-2 py-1 rounded-full">
              <Gem className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-semibold">{player.lustGems}</span>
            </div>
          </div>
        </div>

        {/* LP Per Hour */}
        <div className="mt-2 text-center">
          <div className="text-xs text-purple-300">
            {formatNumber(player.lpPerHour)} LP/hr
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-120px)]">
        {activeTab === "main" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {/* Character Display */}
            <Card className="w-full max-w-sm bg-gradient-to-br from-purple-800/40 to-pink-800/40 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-0">
                {/* Character Info Header */}
                <div className="p-4 bg-black/20 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-purple-200">{character.name}</h3>
                      <div className="text-sm text-purple-300">Lv. {character.level}</div>
                    </div>
                    <div className="flex items-center gap-1 text-pink-300">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{character.bond}%</span>
                    </div>
                  </div>
                </div>

                {/* Character Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <button
                    onClick={handleCharacterTap}
                    className={`w-full h-full transition-transform duration-150 ${
                      isTapping ? 'scale-95' : 'hover:scale-105'
                    }`}
                    data-testid="character-tap-button"
                  >
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/300x400/6B46C1/FFFFFF?text=Luna";
                      }}
                    />
                    
                    {/* Tap Effect Overlay */}
                    {isTapping && (
                      <div className="absolute inset-0 bg-pink-400/20 animate-pulse" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-sm">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-pink-300">{formatNumber(player.lp)}</div>
                <div className="text-xs text-purple-300">Total LP</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-300">{player.level}</div>
                <div className="text-xs text-purple-300">Level</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-pink-300">{character.bond}%</div>
                <div className="text-xs text-purple-300">Bond</div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tab Content Placeholders */}
        {activeTab === "levelup" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-200 mb-2">Level Up</h2>
              <p className="text-purple-300">Upgrade your character's level</p>
            </div>
          </div>
        )}

        {activeTab === "upgrades" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-200 mb-2">Upgrades</h2>
              <p className="text-purple-300">Purchase powerful upgrades</p>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-200 mb-2">Tasks</h2>
              <p className="text-purple-300">Complete tasks for rewards</p>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-200 mb-2">Chat</h2>
              <p className="text-purple-300">Chat with {character.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-purple-500/20 p-2">
        <div className="flex justify-around">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 h-12 px-3 ${
                  isActive 
                    ? 'text-pink-300 bg-purple-800/50' 
                    : 'text-purple-300 hover:text-pink-300 hover:bg-purple-800/30'
                }`}
                data-testid={`nav-${tab.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}