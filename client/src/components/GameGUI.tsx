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
    activePlugin: "chat",
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
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white overflow-hidden flex flex-col">
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

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Side - Character Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-black/20 rounded-3xl p-6 border border-purple-500/30 max-w-md w-full">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-purple-300">Seraphina</h2>
              <p className="text-gray-400 text-sm">A mysterious and charming companion</p>
              <div className="flex justify-center gap-2 mt-2">
                <Badge className="bg-purple-600">playful</Badge>
                <Badge className="bg-blue-600">Level 1</Badge>
              </div>
            </div>
            
            <div 
              className="relative cursor-pointer group"
              onClick={handleTap}
            >
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-6xl font-bold hover:scale-105 transition-transform">
                {playerData?.name?.[0] || "S"}
              </div>
              {isTapping && (
                <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div className="w-80 p-4 space-y-4">
          {/* Wheel */}
          <Card className="bg-black/20 border-purple-500/30">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-center text-purple-300 mb-3">Spin the Wheel</h3>
              <p className="text-sm text-gray-400 text-center mb-3">VIP/Event only! Spin for rewards!</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-3">
                Spin
              </Button>
              <div className="text-xs text-gray-400">
                <div>Prizes:</div>
                <div>100 LP x100 (Common)</div>
                <div>Booster x1 (Rare)</div>
                <div>500 LP x500 (Uncommon)</div>
                <div>1000 LP x1000 (Epic)</div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-full"
              onClick={() => updateGUIState({ showBoosterMenu: true })}
            >
              <Zap className="w-4 h-4 mr-2" />
              Booster
            </Button>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-full"
              onClick={() => updateGUIState({ showEnhancedChat: true })}
            >
              <Heart className="w-4 h-4 mr-2" />
              AI
            </Button>
          </div>

          {/* Active Boosters */}
          <Card className="bg-black/20 border-purple-500/30">
            <CardContent className="p-3">
              <h4 className="text-sm font-bold text-white mb-2">Active Boosters</h4>
              <div className="text-xs text-gray-400">No active boosters</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom - Enhanced Chat */}
      <div className="h-80 bg-black/30 backdrop-blur-sm border-t border-purple-500/30">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-600 text-white">S</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold">Chat with Seraphina</h3>
              <p className="text-xs text-gray-400">Have conversations with your favorite character.</p>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 mb-3">
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      {message.sender === 'character' && message.mood && (
                        <span className="ml-2">😊</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Responses */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Quick responses:</p>
            <div className="flex flex-wrap gap-2">
              {["Hi there! 🧡", "How are you feeling today?", "Tell me about yourself", "You look amazing! ✨", "Want to play a game?", "What do you like to do?"].map((response, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage(response)}
                  className="text-xs border-purple-500 text-purple-300 hover:bg-purple-600/20"
                >
                  {response}
                </Button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message Seraphina..."
              className="bg-black/30 border-purple-500/30 text-white rounded-full"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 rounded-full px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex bg-black/50 border-t border-purple-500/30">
        <Button 
          variant="ghost" 
          className="flex-1 py-3 text-purple-300 hover:bg-purple-600/20"
          onClick={() => setGUIState(prev => ({ ...prev, activePlugin: "upgrades" }))}
        >
          Upgrade
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 py-3 text-purple-300 hover:bg-purple-600/20"
          onClick={() => setGUIState(prev => ({ ...prev, activePlugin: "tasks" }))}
        >
          Task
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 py-3 text-purple-300 hover:bg-purple-600/20"
          onClick={() => setGUIState(prev => ({ ...prev, activePlugin: "shop" }))}
        >
          Shop
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 py-3 text-purple-300 hover:bg-purple-600/20 bg-purple-600/30"
          onClick={() => setGUIState(prev => ({ ...prev, activePlugin: "chat" }))}
        >
          Chat
        </Button>
      </div>

      {/* Floating Overlays */}
      {guiState.showAdminMenu && (
        <AdminMenu />
      )}
      {guiState.showCharacterCreation && (
        <CharacterCreation />
      )}
      {guiState.showCharacterEditor && guiState.selectedCharacter && (
        <CharacterEditor character={guiState.selectedCharacter} />
      )}
      {guiState.showImageManager && (
        <ImageManager onClose={() => updateGUIState({ showImageManager: false })} />
      )}
      {guiState.showFileManager && (
        <FileManagerCore />
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