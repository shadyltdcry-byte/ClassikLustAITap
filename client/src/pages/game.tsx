/**
 * Game.tsx - Core Game Hub (NO LOGIC - LAYOUT ONLY)
 * Last Edited: 2025-08-19 by Assistant
 */

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Core Components
import CharacterDisplay from "@/components/CharacterDisplay";
import GameGUI from "@/components/GameGUI";
import LoadingScreen from "@/components/LoadingScreen";
import NewsTicker from "@/components/NewsTicker";
import CharacterGallery from "@/components/CharacterGallery";

// Character Management
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";

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

interface GameState {
  isLoading: boolean;
  activePlugin: string | null;
  showAdminMenu: boolean;
  showDebugger: boolean;
  showImageManager: boolean;
  showFileManager: boolean;
  showCharacterCreation: boolean;
  showCharacterEditor: boolean;
  selectedCharacter: any | null;
}

export default function Game() {
  const { playerData, setPlayerData, isLoading } = useGame();

  const [gameState, setGameState] = useState<GameState>({
    isLoading: true,
    activePlugin: "main",
    showAdminMenu: false,
    showDebugger: false,
    showImageManager: false,
    showFileManager: false,
    showCharacterCreation: false,
    showCharacterEditor: false,
    selectedCharacter: null,
  });

  // Initialize game state
  useEffect(() => {
    const initGame = async () => {
      try {
        const savedState = localStorage.getItem("gameState");
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setGameState(prev => ({ ...prev, ...parsed, isLoading: false }));
        } else {
          setGameState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to initialize game state:", error);
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initGame();
  }, []);

  // Save game state to localStorage
  useEffect(() => {
    if (!gameState.isLoading) {
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }
  }, [gameState]);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  const toggleAdminMenu = () => updateGameState({ showAdminMenu: !gameState.showAdminMenu });
  const handlePluginSwitch = (pluginId: string) => updateGameState({ activePlugin: pluginId });
  const openCharacterCreation = () => updateGameState({ showCharacterCreation: true });
  const openCharacterEditor = (character: any) =>
    updateGameState({ showCharacterEditor: true, selectedCharacter: character });

  if (gameState.isLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black overflow-hidden">
      <div className="absolute inset-0 opacity-20">{/* Background particles/hearts */}</div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-black/50 backdrop-blur-sm border-b border-purple-500/30 z-40">
        <div className="h-full flex items-center justify-between px-6">
          {/* Player info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              {playerData?.name?.[0] || "P"}
            </div>
            <div className="text-white">
              <div className="text-sm opacity-75">Level {playerData?.level || 1}</div>
              <div className="font-semibold">{playerData?.name || "Player"}</div>
            </div>
          </div>

          {/* LP display */}
          <div className="text-center text-white">
            <div className="text-2xl font-bold">{playerData?.lp || 0} LP</div>
            <div className="text-sm opacity-75">{playerData?.lpPerHour || 0} LP/hour</div>
          </div>

          {/* Resources & Admin */}
          <div className="flex items-center gap-4 text-white">
            <div className="text-center">
              <div className="text-lg font-bold">{playerData?.energy || 0}</div>
              <div className="text-xs opacity-75">Energy</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{playerData?.coins || 0}</div>
              <div className="text-xs opacity-75">Coins</div>
            </div>
            <Button onClick={toggleAdminMenu} variant="outline" size="sm" className="border-purple-500 text-purple-300 hover:bg-purple-500/20">
              Admin
            </Button>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="absolute top-20 left-0 right-0 z-30">
        <NewsTicker />
      </div>

      {/* Main CharacterDisplay */}
      <div className="absolute top-32 left-0 right-80 bottom-60 z-20 flex items-center justify-center">
        <CharacterDisplay 
          user={playerData!}
          character={gameState.selectedCharacter || undefined}
          onTap={() => console.log("Character tapped!")}
          isTapping={false}
        />
      </div>

      {/* Right Panel */}
      <div className="absolute top-32 right-0 w-80 bottom-60 bg-black/30 backdrop-blur-sm border-l border-purple-500/30 z-20 p-4 space-y-4 overflow-y-auto">
        <Card className="bg-purple-900/50 border-purple-500/30">
          <CardContent><Wheel /></CardContent>
        </Card>

        <Card className="bg-purple-900/50 border-purple-500/30">
          <CardContent><Boosters /></CardContent>
        </Card>

        <Card className="bg-purple-900/50 border-purple-500/30">
          <CardContent>
            <CharacterGallery onCharacterSelect={openCharacterEditor} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tabs */}
      <div className="absolute bottom-0 left-0 right-0 h-60 bg-black/50 backdrop-blur-sm border-t border-purple-500/30 z-20">
        <Tabs value={gameState.activePlugin} onValueChange={handlePluginSwitch} className="h-full">
          <TabsList className="w-full bg-transparent border-b border-purple-500/30">
            <TabsTrigger value="main" className="text-white data-[state=active]:bg-purple-600">Main</TabsTrigger>
            <TabsTrigger value="levelup" className="text-white data-[state=active]:bg-purple-600">Level Up</TabsTrigger>
            <TabsTrigger value="upgrades" className="text-white data-[state=active]:bg-purple-600">Upgrades</TabsTrigger>
            <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-purple-600">Tasks</TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-purple-600">Achievements</TabsTrigger>
            <TabsTrigger value="chat" className="text-white data-[state=active]:bg-purple-600">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="h-full p-4">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={openCharacterCreation} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create Character
                </Button>
                <Button onClick={() => updateGameState({ showFileManager: true })} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Manage Files
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="levelup" className="h-full p-4 overflow-y-auto"><LevelUp /></TabsContent>
          <TabsContent value="upgrades" className="h-full p-4 overflow-y-auto"><Upgrades /></TabsContent>
          <TabsContent value="tasks" className="h-full p-4 overflow-y-auto"><Tasks /></TabsContent>
          <TabsContent value="achievements" className="h-full p-4 overflow-y-auto"><Achievements /></TabsContent>
          <TabsContent value="chat" className="h-full p-4 overflow-y-auto"><AIChat /></TabsContent>
        </Tabs>
      </div>

      {/* Floating Overlays */}
      {gameState.showAdminMenu && <AdminMenu onClose={() => updateGameState({ showAdminMenu: false })} />}
      {gameState.showCharacterCreation && <CharacterCreation />}
      {gameState.showCharacterEditor && <CharacterEditor character={gameState.selectedCharacter} />}
      {gameState.showImageManager && <ImageManager onClose={() => updateGameState({ showImageManager: false })} />}
      {gameState.showFileManager && <FileManagerCore />}
      {gameState.showDebugger && <MistralDebugger onClose={() => updateGameState({ showDebugger: false })} />}

      <GameGUI gameState={gameState} onStateChange={updateGameState} playerData={playerData} onTap={() => console.log("Tapped!")} />
    </div>
  );
}