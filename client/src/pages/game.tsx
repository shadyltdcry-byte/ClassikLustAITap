
/**
 * Game.tsx - Core Game Coordinator (NO GUI - ROUTING ONLY)
 * Last Edited: 2025-08-19 by Assistant
 * 
 * This file is the core coordinator that:
 * - Loads and manages game state
 * - Routes plugin calls
 * - Passes everything to GameGUI for rendering
 */

import React, { useState } from "react";
import { useGame } from "@/context/GameProvider";
import { apiRequest } from "@/lib/queryClient";
import LoadingScreen from "@/components/LoadingScreen";
import GameGUI from "@/components/GameGUI";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import AIChat from "@/plugins/aicore/AIChat";
import MistralDebugger from "@/plugins/aicore/MistralDebugger";
import FileManagerCore from "@/plugins/manager/FileManagerCore";
import Wheel from "@/plugins/gameplay/Wheel";
import Upgrades from "@/plugins/gameplay/Upgrades";
import Boosters from "@/plugins/gameplay/Boosters";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Task from "@/plugins/gameplay/Task";
import Achievements from "@/plugins/gameplay/Achievements";
import AdminMenu from "@/plugins/admin/AdminMenu";
import GameManagerCore from "@/plugins/manager/GameManagerCore";
import { Button } from "@/components/ui/button";

export default function Game() {
  const { playerData, setPlayerData, isLoading } = useGame();
  const [activePlugin, setActivePlugin] = useState<string>('game');

  // Handle plugin routing - this is where plugins get called from GameGUI
  const handlePluginAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'tap':
          // Handle character tap logic
          if (playerData && playerData.energy > 0) {
            const newLP = playerData.lp + playerData.lpPerTap;
            const newEnergy = Math.max(0, playerData.energy - 1);
            const newXP = playerData.xp + 1;
            let leveledUp = false;
            let newLevel = playerData.level;
            let newXPToNext = playerData.xpToNext;
            
            if (newXP >= playerData.xpToNext) {
              leveledUp = true;
              newLevel = playerData.level + 1;
              newXPToNext = Math.floor(playerData.xpToNext * 1.5);
            }
            
            const updatedData = { 
              ...playerData, 
              lp: newLP, 
              energy: newEnergy,
              xp: leveledUp ? newXP - playerData.xpToNext : newXP,
              level: newLevel,
              xpToNext: newXPToNext
            };
            setPlayerData(updatedData);
            
            // Force a re-render by updating the API
            try {
              await apiRequest('PUT', `/api/player/${playerData.id}`, {
                lp: newLP,
                energy: newEnergy,
                xp: leveledUp ? newXP - playerData.xpToNext : newXP,
                level: newLevel
              });
            } catch (error) {
              console.error('Failed to sync player data:', error);
            }
          }
          break;
        
        case 'collectOffline':
          // Handle offline LP collection
          const offlineLP = Math.floor(playerData?.lpPerHour || 0);
          if (playerData && offlineLP > 0) {
            setPlayerData({ ...playerData, lp: playerData.lp + offlineLP });
          }
          break;
        
        case 'purchaseUpgrade':
          // Handle upgrade purchases
          if (data && playerData && playerData.lp >= data.cost) {
            const newLP = playerData.lp - data.cost;
            const newLPPerHour = playerData.lpPerHour + (data.upgrade.includes('lpPerHour') ? data.effect : 0);
            const newLPPerTap = playerData.lpPerTap + (data.upgrade.includes('lpPerTap') ? data.effect : 0);
            const newMaxEnergy = playerData.maxEnergy + (data.upgrade.includes('energy') ? data.effect : 0);
            
            setPlayerData({ 
              ...playerData, 
              lp: newLP,
              lpPerHour: newLPPerHour,
              lpPerTap: newLPPerTap,
              maxEnergy: newMaxEnergy
            });
            
            // Sync with API
            try {
              await apiRequest('PUT', `/api/player/${playerData.id}`, {
                lp: newLP,
                lpPerHour: newLPPerHour,
                lpPerTap: newLPPerTap,
                maxEnergy: newMaxEnergy
              });
            } catch (error) {
              console.error('Failed to sync upgrade purchase:', error);
            }
          }
          break;
        
        case 'levelUp':
          // Handle level up logic
          if (playerData && playerData.xp >= playerData.xpToNext) {
            setPlayerData({
              ...playerData,
              level: playerData.level + 1,
              xp: playerData.xp - playerData.xpToNext,
              xpToNext: Math.floor(playerData.xpToNext * 1.5)
            });
          }
          break;
        
        case 'completeTask':
          // Handle task completion
          if (data && playerData) {
            const newLP = playerData.lp + (data.reward || 100);
            const newXP = playerData.xp + (data.xpReward || 50);
            
            setPlayerData({
              ...playerData,
              lp: newLP,
              xp: newXP
            });
            
            // Sync with API
            try {
              await apiRequest('PUT', `/api/player/${playerData.id}`, {
                lp: newLP,
                xp: newXP
              });
            } catch (error) {
              console.error('Failed to sync task reward:', error);
            }
          }
          break;
        
        case 'sendChatMessage':
          // Handle AI chat message
          console.log('Chat message sent:', data);
          break;
        
        case 'openProfile':
        case 'openCharacterCreation':
        case 'openSettings':
          // These are handled by GameGUI state changes
          break;
          
        default:
          console.log(`Unhandled plugin action: ${action}`, data);
      }
    } catch (error) {
      console.error('Plugin action error:', error);
    }
  };

  // Render the appropriate plugin based on activePlugin state
  const renderPlugin = () => {
    switch (activePlugin) {
      case 'characterCreation':
        return <CharacterCreation />;
      case 'characterEditor':
        return <CharacterEditor />;
      case 'aiChat':
        return <AIChat userId={playerData?.id || 'default-player'} />;
      case 'mistralDebugger':
        return <MistralDebugger isOpen={true} onClose={() => setActivePlugin('game')} />;
      case 'fileManager':
        return <FileManagerCore />;
      case 'wheel':
        return <Wheel playerId={playerData?.id || 'default-player'} isVIP={playerData?.isVip || false} isEventActive={false} />;
      case 'upgrades':
        return <Upgrades />;
      case 'boosters':
        return <Boosters isOpen={true} onClose={() => setActivePlugin('game')} user={playerData || { id: 'default-player', name: 'Player', level: 1 }} />;
      case 'levelUp':
        return <LevelUp />;
      case 'task':
        return <Task />;
      case 'achievements':
        return <Achievements />;
      case 'adminMenu':
        // Admin menu should only be accessible through GameGUI modals
        return (
          <GameGUI 
            playerData={playerData} 
            onPluginAction={handlePluginAction}
            onPluginChange={setActivePlugin}
          />
        );
      case 'gameManager':
        return <div className="text-white">Game Manager - Under Development</div>;
      case 'game':
      default:
        return (
          <GameGUI 
            playerData={playerData} 
            onPluginAction={handlePluginAction}
          />
        );
    }
  };

  if (isLoading) {
    return <LoadingScreen progress={75} />;
  }

  // For non-game plugins, show full screen with back button (excluding admin functions)
  if (activePlugin !== 'game' && activePlugin !== 'adminMenu') {
    return (
      <div className="min-h-screen p-4 bg-gray-900">
        <div className="mb-4">
          <Button onClick={() => setActivePlugin('game')} variant="outline" className="mb-2">
            ← Back to Game
          </Button>
          <h1 className="text-2xl font-bold text-white capitalize">{activePlugin.replace(/([A-Z])/g, ' $1')}</h1>
        </div>
        {renderPlugin()}
      </div>
    );
  }

  // Main game view - just pass everything to GameGUI
  return (
    <GameGUI 
      playerData={playerData} 
      onPluginAction={handlePluginAction}
      onPluginChange={setActivePlugin}
    />
  );
}
