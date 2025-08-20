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
import Achievements from "@/plugins/gameplay/Achievements";
import Boosters from "@/plugins/gameplay/Boosters";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Tasks from "@/plugins/gameplay/Task";
import Upgrades from "@/plugins/gameplay/Upgrades";
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-center p-4 bg-gradient-to-r from-pink-900/50 to-red-900/50 border-b border-pink-500/30">
        <h1 className="text-white text-2xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">ClassikLust</h1>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{playerData?.name?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{playerData?.name || "Player"}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Lv. {playerData?.level || 1}</span>
                <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-2 w-24" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{playerData?.lp || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold">{playerData?.lpPerHour || 0}/h</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
              <Gem className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold">{playerData?.lustGems || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold">
                {playerData?.energy || 0}/{playerData?.maxEnergy || 100}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-pink-900/10 via-purple-900/10 to-red-900/10">
        {/* News ticker removed temporarily to fix layout */}

        {/* Character Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
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
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/50 to-red-900/50 border-t border-pink-500/30 p-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20"
              onClick={() => onPluginChange?.('upgrades')}
            >
              <Star className="w-5 h-5" />
              <span className="text-xs">Upgrades</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20"
              onClick={() => onPluginChange?.('tasks')}
            >
              <Zap className="w-5 h-5" />
              <span className="text-xs">Task</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20"
              onClick={() => onPluginChange?.('aiChat')}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">AI Chat</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20"
              onClick={() => updateGUIState({ showAdminMenu: true })}
            >
              <Settings className="w-5 h-5" />
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