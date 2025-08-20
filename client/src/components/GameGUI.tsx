/**
 * GameGUI.tsx - Complete Game Interface
 * Last Edited: 2025-08-19 by Le Chat
 *
 * Fixed overlay sizing, centering, and button functionality.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Star, Settings, Send, Heart, Coins, Gem, MessageCircle } from "lucide-react";

import CharacterDisplay from "@/components/CharacterDisplay";
import NewsTicker from "@/components/NewsTicker";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import CharacterGallery from "@/components/CharacterGallery";

// Admin Plugins
import AdminMenu from "@/plugins/admin/AdminMenu";

// AI Core Plugins
import AIChat from "@/plugins/aicore/AIChat";
import MistralDebugger from "@/plugins/aicore/MistralDebugger";

// Gameplay Plugins
import Upgrades from "@/plugins/gameplay/Upgrades";
import Task from "@/plugins/gameplay/Task";
import Achievements from "@/plugins/gameplay/Achievements";
import Boosters from "@/plugins/gameplay/Boosters";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Wheel from "@/plugins/gameplay/Wheel";

// Manager Plugins
import FileManagerCore from "@/plugins/manager/FileManagerCore";
import ImageManager from "@/plugins/manager/ImageManager";

interface PlayerData {
  id: string;
  name: string;
  level: number;
  lp: number;
  lpPerHour: number;
  lpPerTap: number;
  energy: number;
  maxEnergy: number;
  coins: number;
  lustGems?: number;
  xp: number;
  xpToNext: number;
  avatar?: string;
  activeBoosters?: Array<{ name: string }>;
  isVip?: boolean;
  [key: string]: any;
}

interface GameGUIProps {
  playerData?: PlayerData;
  onPluginAction: (action: string, data?: any) => void;
  onPluginChange?: (plugin: string) => void;
}

interface GUIState {
  activePlugin: string;
  showDebugger: boolean;
  showImageManager: boolean;
  showFileManager: boolean;
  showCharacterCreation: boolean;
  showCharacterEditor: boolean;
  showBoosterMenu: boolean;
  showAICustomFunctions: boolean;
  showEnhancedChat: boolean;
  showAdminMenu: boolean;
  selectedCharacter: any | null;
}

export default function GameGUI({ playerData, onPluginAction, onPluginChange }: GameGUIProps) {
  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showDebugger: false,
    showImageManager: false,
    showFileManager: false,
    showCharacterCreation: false,
    showCharacterEditor: false,
    showBoosterMenu: false,
    showAICustomFunctions: false,
    showEnhancedChat: false,
    showAdminMenu: false,
    selectedCharacter: null,
  });

  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      content: "Hello! I'm happy to chat with you!",
      sender: 'character' as const,
      timestamp: new Date(),
      mood: 'happy'
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTapping, setIsTapping] = useState(false);

  const updateGUIState = (updates: Partial<GUIState>) => {
    setGUIState(prev => ({ ...prev, ...updates }));
  };

  const handleTap = async () => {
    if (!playerData || playerData.energy <= 0 || isTapping) return;

    setIsTapping(true);
    onPluginAction('tap');

    setTimeout(() => setIsTapping(false), 200);
  };

  const handleClaimPrize = (type: 'task' | 'achievement') => {
    onPluginAction('claimPrize', { type });
  };

  // This state is for the bottom navigation buttons
  const [activeMenu, setActiveMenu] = useState<string | null>("main");

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white overflow-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-center p-3 bg-gradient-to-r from-pink-900/50 to-red-900/50 border-b border-pink-500/30 flex-shrink-0">
        <h1 className="text-white text-xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">ClassikLust</h1>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs">{playerData?.name?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{playerData?.name || "Player"}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Lv. {playerData?.level || 1}</span>
                <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-1 w-20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xs">{playerData?.lp || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-bold text-xs">{playerData?.lpPerHour || 0}/h</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Gem className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 font-bold text-xs">{playerData?.lustGems || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold text-xs">
                {playerData?.energy || 0}/{playerData?.maxEnergy || 100}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-pink-900/10 via-purple-900/10 to-red-900/10 pb-16">
        {/* Main Content Area - Plugin or Character Display */}
        <div className="h-full flex items-center justify-center p-3">
          {guiState.activePlugin === "main" ? (
            <div className="max-w-sm w-full">
              <CharacterDisplay
                character={{
                  id: "seraphina",
                  name: "Seraphina",
                  personality: "playful",
                  backstory: "Tap to interact with Seraphina!",
                  mood: "flirty",
                  level: 1,
                  isNsfw: false,
                  isVip: false,
                  levelRequirement: 1,
                  customTriggers: [],
                  createdAt: new Date(),
                }}
                user={{
                  ...playerData,
                  id: playerData?.id || 'default-player',
                  username: playerData?.name || 'Player',
                  password: '',
                  level: playerData?.level || 1,
                  lp: playerData?.lp || 0,
                  lpPerHour: playerData?.lpPerHour || 0,
                  lpPerTap: playerData?.lpPerTap || 1,
                  energy: playerData?.energy || 100,
                  maxEnergy: playerData?.maxEnergy || 100,
                  charisma: playerData?.charismaPoints || 0,
                  vipStatus: playerData?.isVip || false,
                  nsfwConsent: playerData?.nsfwEnabled || false,
                  lastTick: new Date(playerData?.lastTickTimestamp || Date.now()),
                  createdAt: new Date()
                } as any}
                onTap={handleTap}
                isTapping={isTapping}
              />
            </div>
          ) : (
            <div className="w-full h-full max-w-4xl mx-auto overflow-hidden">
              <div className="h-full bg-black/20 rounded-xl border border-purple-500/30 overflow-hidden">
                {guiState.activePlugin === "upgrades" && (
                  <Upgrades
                    playerData={playerData}
                    onUpgradeAction={onPluginAction}
                  />
                )}
                {guiState.activePlugin === "tasks" && (
                  <Task onClaimPrize={() => handleClaimPrize('task')} />
                )}
                {guiState.activePlugin === "achievements" && (
                  <Achievements onClaimPrize={() => handleClaimPrize('achievement')} />
                )}
                {guiState.activePlugin === "aiChat" && (
                  <AIChat userId={playerData?.id || 'default-player'} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/90 to-red-900/90 border-t border-pink-500/30 p-1 backdrop-blur-sm">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${guiState.activePlugin === "main" ? "bg-pink-600/30" : ""}`}
              onClick={() => updateGUIState({ activePlugin: "main" })}
            >
              <Heart className="w-4 h-4" />
              <span className="text-xs">Character</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${guiState.activePlugin === "upgrades" ? "bg-pink-600/30" : ""}`}
              onClick={() => updateGUIState({ activePlugin: "upgrades" })}
            >
              <Star className="w-4 h-4" />
              <span className="text-xs">Upgrades</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${guiState.activePlugin === "tasks" ? "bg-pink-600/30" : ""}`}
              onClick={() => updateGUIState({ activePlugin: "tasks" })}
            >
              <Zap className="w-4 h-4" />
              <span className="text-xs">Tasks</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${guiState.activePlugin === "achievements" ? "bg-pink-600/30" : ""}`}
              onClick={() => updateGUIState({ activePlugin: "achievements" })}
            >
              <Star className="w-4 h-4" />
              <span className="text-xs">Achievements</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${guiState.activePlugin === "aiChat" ? "bg-pink-600/30" : ""}`}
              onClick={() => updateGUIState({ activePlugin: "aiChat" })}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">AI Chat</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2"
              onClick={() => updateGUIState({ showAdminMenu: true })}
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>

        {/* Floating Overlays */}
        {guiState.showCharacterCreation && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <CharacterCreation
                onSuccess={() => updateGUIState({ showCharacterCreation: false })}
                onCancel={() => updateGUIState({ showCharacterCreation: false })}
              />
            </div>
          </div>
        )}
        {guiState.showCharacterEditor && guiState.selectedCharacter && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <CharacterEditor
                character={guiState.selectedCharacter}
                onSuccess={() => updateGUIState({ showCharacterEditor: false })}
                onCancel={() => updateGUIState({ showCharacterEditor: false })}
              />
            </div>
          </div>
        )}
        {guiState.showImageManager && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <ImageManager onClose={() => updateGUIState({ showImageManager: false })} />
            </div>
          </div>
        )}
        {guiState.showFileManager && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <FileManagerCore onClose={() => updateGUIState({ showFileManager: false })} />
            </div>
          </div>
        )}
        {guiState.showAdminMenu && (
          <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
        )}
      </div>
    </div>
  );
}