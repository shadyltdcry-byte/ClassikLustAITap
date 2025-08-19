/**
 * GameGUI.tsx - Complete Game Interface matching screenshots
 * Last Edited: 2025-08-19 by Assistant
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

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user' as const,
      timestamp: new Date(),
      mood: 'normal'
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's really interesting! Tell me more! 😊",
        "I love talking with you! You're so thoughtful! ✨",
        "*blushes* You're so sweet! 💕",
        "Hehe, you're so funny! I can't stop smiling! 😄"
      ];
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: 'character' as const,
        timestamp: new Date(),
        mood: 'happy'
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
    
    setNewMessage("");
  };

  const energyPercentage = playerData ? (playerData.energy / playerData.maxEnergy) * 100 : 0;
  const xpPercentage = playerData ? (playerData.xp / playerData.xpToNext) * 100 : 0;

  // Convert PlayerData to User format for CharacterDisplay
  const userForDisplay = playerData ? {
    id: playerData.id,
    username: playerData.name,
    password: "",
    level: playerData.level,
    lp: playerData.lp,
    energy: playerData.energy,
    maxEnergy: playerData.maxEnergy,
    charisma: 0,
    lpPerHour: playerData.lpPerHour,
    lpPerTap: playerData.lpPerTap,
    vipStatus: playerData.isVip || false,
    nsfwConsent: false,
    lastTick: new Date(),
    createdAt: new Date(),
  } : null;

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white flex flex-col relative">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
        {/* Player Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-purple-400">
            <AvatarFallback className="bg-purple-600 text-white text-lg font-bold">
              {playerData?.name?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold">{playerData?.name || "Player"}</div>
            <div className="text-sm text-blue-300">Level: {playerData?.level || 1}/50</div>
            <Progress value={xpPercentage} className="h-1 w-20 bg-gray-700" />
          </div>
        </div>

        {/* Central LP Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-pink-300">
            <Heart className="inline w-6 h-6 mr-2" />
            LP {(playerData?.lp || 0).toLocaleString()}
          </div>
          <div className="text-lg text-purple-300 font-semibold">
            <Zap className="inline w-4 h-4 mr-1" />
            +{(playerData?.lpPerHour || 0).toLocaleString()}/hr
          </div>
        </div>

        {/* Right Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              <Gem className="inline w-4 h-4 mr-1" />
              {(playerData?.lustGems || 50).toLocaleString()}
            </div>
            <div className="text-xs text-green-300">Lust Gems</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              <Zap className="inline w-4 h-4 mr-1" />
              {playerData?.energy || 0}
            </div>
            <div className="text-xs text-blue-300">Energy</div>
            <Progress value={energyPercentage} className="h-1 w-16 bg-gray-700" />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateGUIState({ showAdminMenu: !guiState.showAdminMenu })}
            className="border-purple-500 text-purple-300 hover:bg-purple-600/20"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* News Ticker */}
      <div className="bg-red-500/80 px-4 py-2 text-center font-bold text-white">
        EVENT NEWS
      </div>

      {/* Main Content Area - Character Display Front and Center */}
      <div className="flex-1 flex items-center justify-center p-6 pb-24">
        <div className="bg-black/20 rounded-3xl p-6 border border-purple-500/30 max-w-lg w-full text-center">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-purple-300 mb-2">Seraphina</h2>
            <p className="text-gray-400">A mysterious and charming companion</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge className="bg-purple-600">playful</Badge>
              <Badge className="bg-blue-600">Level 1</Badge>
            </div>
          </div>
          
          <div 
            className="relative cursor-pointer group mx-auto"
            onClick={handleTap}
          >
            <div className="w-80 aspect-[3/4] bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-6xl font-bold hover:scale-105 transition-transform">
              {playerData?.name?.[0] || "S"}
            </div>
            {isTapping && (
              <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse pointer-events-none"></div>
            )}
          </div>
          
          <div className="mt-4 text-gray-400">
            Tap to interact!
          </div>
        </div>
      </div>


      {/* Bottom Navigation - Fixed Position */}
      <div className="fixed bottom-0 left-0 right-0 flex bg-black/80 backdrop-blur-sm border-t border-purple-500/30 z-40">
        <Button 
          variant="ghost" 
          className={`flex-1 py-4 text-purple-300 hover:bg-purple-600/20 flex flex-col items-center gap-1 ${guiState.activePlugin === "upgrades" ? "bg-purple-600/30" : ""}`}
          onClick={() => updateGUIState({ activePlugin: guiState.activePlugin === "upgrades" ? "main" : "upgrades" })}
        >
          <Star className="w-5 h-5" />
          <span className="text-xs">Upgrade</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 py-4 text-purple-300 hover:bg-purple-600/20 flex flex-col items-center gap-1 ${guiState.activePlugin === "tasks" ? "bg-purple-600/30" : ""}`}
          onClick={() => updateGUIState({ activePlugin: guiState.activePlugin === "tasks" ? "main" : "tasks" })}
        >
          <Zap className="w-5 h-5" />
          <span className="text-xs">Task</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 py-4 text-purple-300 hover:bg-purple-600/20 flex flex-col items-center gap-1 ${guiState.activePlugin === "wheel" ? "bg-purple-600/30" : ""}`}
          onClick={() => updateGUIState({ activePlugin: guiState.activePlugin === "wheel" ? "main" : "wheel" })}
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs">Wheel</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 py-4 text-purple-300 hover:bg-purple-600/20 flex flex-col items-center gap-1 ${guiState.activePlugin === "chat" ? "bg-purple-600/30" : ""}`}
          onClick={() => updateGUIState({ activePlugin: guiState.activePlugin === "chat" ? "main" : "chat" })}
        >
          <Send className="w-5 h-5" />
          <span className="text-xs">Chat</span>
        </Button>
      </div>

      {/* Modal Overlays for Bottom Navigation */}
      {guiState.activePlugin === "upgrades" && (
        <div className="fixed bottom-16 left-0 right-0 h-80 bg-black/95 backdrop-blur-sm border-t border-purple-500/30 p-4 overflow-y-auto z-30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Upgrades</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => updateGUIState({ activePlugin: "main" })}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="text-white">
            <Upgrades />
          </div>
        </div>
      )}

      {guiState.activePlugin === "tasks" && (
        <div className="fixed bottom-16 left-0 right-0 h-80 bg-black/95 backdrop-blur-sm border-t border-purple-500/30 p-4 overflow-y-auto z-30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Tasks</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => updateGUIState({ activePlugin: "main" })}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="text-white">
            <Tasks />
          </div>
        </div>
      )}

      {guiState.activePlugin === "wheel" && (
        <div className="fixed bottom-16 left-0 right-0 h-80 bg-black/95 backdrop-blur-sm border-t border-purple-500/30 p-4 overflow-y-auto z-30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Spin the Wheel</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => updateGUIState({ activePlugin: "main" })}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="text-white">
            <Wheel 
              playerId={playerData?.id || "player1"} 
              isVIP={!!playerData?.isVip} 
              isEventActive={true}
              onPrizeAwarded={(prize) => console.log(`Won: ${prize.name}`)}
            />
          </div>
        </div>
      )}

      {guiState.activePlugin === "chat" && (
        <div className="fixed bottom-16 left-0 right-0 h-80 bg-black/95 backdrop-blur-sm border-t border-purple-500/30 p-4 overflow-y-auto z-30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">AI Chat</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => updateGUIState({ activePlugin: "main" })}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="text-white">
            <AIChat userId={playerData?.id || "player1"} />
          </div>
        </div>
      )}

      {/* Floating Overlays */}
      {guiState.showAdminMenu && (
        <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
      )}
      {guiState.showCharacterCreation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full mx-4">
            <CharacterCreation />
            <Button 
              onClick={() => updateGUIState({ showCharacterCreation: false })}
              className="mt-4 w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      {guiState.showCharacterEditor && guiState.selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full mx-4">
            <CharacterEditor character={guiState.selectedCharacter} />
            <Button 
              onClick={() => updateGUIState({ showCharacterEditor: false })}
              className="mt-4 w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      {guiState.showImageManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-2xl w-full mx-4 h-3/4 overflow-auto">
            <ImageManager onClose={() => updateGUIState({ showImageManager: false })} />
          </div>
        </div>
      )}
      {guiState.showFileManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-4xl w-full mx-4 h-3/4 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">File Manager</h2>
              <Button 
                onClick={() => updateGUIState({ showFileManager: false })}
                variant="outline"
              >
                Close
              </Button>
            </div>
            <FileManagerCore />
          </div>
        </div>
      )}
      {guiState.showDebugger && (
        <MistralDebugger 
          isOpen={true}
          onClose={() => updateGUIState({ showDebugger: false })} 
        />
      )}
      {guiState.showBoosterMenu && userForDisplay && (
        <Boosters
          isOpen={true}
          onClose={() => updateGUIState({ showBoosterMenu: false })}
          user={userForDisplay}
        />
      )}
    </div>
  );
}