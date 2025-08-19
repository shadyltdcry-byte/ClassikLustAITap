/**
 * Game.tsx - Core Game Coordinator (NO GUI - ROUTING ONLY)
 * Last Edited: 2025-08-19 by Assistant
 * 
 * This file is the core coordinator that:
 * - Loads and manages game state
 * - Routes plugin calls
 * - Passes everything to GameGUI for rendering
 */

import React from "react";
import { useGame } from "@/context/GameProvider";
import LoadingScreen from "@/components/LoadingScreen";
import GameGUI from "@/components/GameGUI";

export default function Game() {
  const { playerData, setPlayerData, isLoading } = useGame();

  // Handle plugin routing - this is where plugins get called from GameGUI
  const handlePluginAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'tap':
          // Handle character tap logic
          if (playerData && playerData.energy > 0) {
            const newLP = playerData.lp + playerData.lpPerTap;
            const newEnergy = Math.max(0, playerData.energy - 1);
            setPlayerData({ ...playerData, lp: newLP, energy: newEnergy });
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
            setPlayerData({ 
              ...playerData, 
              lp: playerData.lp - data.cost,
              lpPerHour: playerData.lpPerHour + (data.upgrade.includes('lpPerHour') ? data.effect : 0),
              lpPerTap: playerData.lpPerTap + (data.upgrade.includes('lpPerTap') ? data.effect : 0),
              maxEnergy: playerData.maxEnergy + (data.upgrade.includes('energy') ? data.effect : 0)
            });
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
            setPlayerData({
              ...playerData,
              lp: playerData.lp + (data.reward || 100),
              xp: playerData.xp + (data.xpReward || 50)
            });
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

  if (isLoading) {
    return <LoadingScreen progress={75} />;
  }

  // Pass everything to GameGUI for rendering
  return (
    <GameGUI 
      playerData={playerData} 
      onPluginAction={handlePluginAction}
    />
  );
}