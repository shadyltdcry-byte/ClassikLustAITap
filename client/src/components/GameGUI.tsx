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
import { Zap, Star, Settings, Send, Heart, Coins, Gem } from "lucide-react";

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
  showAdminMenu: boolean;
  showDebugger: boolean;
  showImageManager: boolean;
  showFileManager: boolean;
  showCharacterCreation: boolean;
  showCharacterEditor: boolean;
  showBoosterMenu: boolean;
  showAICustomFunctions: boolean;
  showEnhancedChat: boolean;
  selectedCharacter: any | null;
}

export default function GameGUI({ playerData, onPluginAction, onPluginChange }: GameGUIProps) {
  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showAdminMenu: false,
    showDebugger: false,
    showImageManager: false,
    showFileManager: false,
    showCharacterCreation: false,
    showCharacterEditor: false,
    showBoosterMenu: false,
    showAICustomFunctions: false,
    showEnhancedChat: false,
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
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 bg-black/30 border-b border-gray-800">
        <h1 className="text-white text-2xl font-bold">ClassikLust</h1>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => onPluginChange?.('upgrades')} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Upgrades
          </Button>
          <Button 
            size="sm" 
            onClick={() => onPluginChange?.('fileManager')} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Media
          </Button>
          <Button 
            size="sm" 
            onClick={() => onPluginChange?.('aiChat')} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Chat
          </Button>
          <Button 
            size="sm" 
            onClick={() => onPluginChange?.('gameManager')} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Manager
          </Button>
          <Button 
            size="sm" 
            onClick={() => onPluginChange?.('adminMenu')} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Admin
          </Button>
          <Button 
            size="sm" 
            onClick={() => updateGUIState({ showCharacterCreation: true })} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Create Character
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center p-4 bg-black/30 border-b border-gray-800">
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
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{playerData?.coins || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gem className="w-4 h-4 text-purple-400" />
              <span>{playerData?.lustGems || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span>
                {playerData?.energy || 0}/{playerData?.maxEnergy || 100}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <NewsTicker />

        {/* Character Display */}
        <div className="p-4 max-w-md mx-auto">
          <CharacterDisplay
            user={playerData}
            onTap={handleTap}
            isTapping={isTapping}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/50 border-t border-gray-800 p-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPluginChange?.('upgrades')}
              className="text-gray-400 hover:text-white"
            >
              <Star className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPluginChange?.('task')}
              className="text-gray-400 hover:text-white"
            >
              <Zap className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPluginChange?.('aiChat')}
              className="text-gray-400 hover:text-white"
            >
              <Send className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateGUIState({ showAdminMenu: true })}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Floating Overlays */}
        {guiState.showAdminMenu && (
          <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
        )}
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
      </div>
    </div>
  );
}