/**
 * GameProvider.tsx - Central Game State Management
 * Last Edited: 2025-08-18 by Assistant
 *
 * This is the central state management system for the Character Tap Game.
 * It handles all game logic, data persistence, and provides a clean interface
 * for components to interact with game state.
 *
 * Features:
 * - Player data management (LP, energy, level, etc.)
 * - Character management and selection
 * - Offline/online LP calculation with tick system
 * - Local storage persistence + API sync
 * - Upgrade system integration
 * - Booster and achievement tracking
 * - VIP/NSFW content gating
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Types based on your game's requirements
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
  xp: number;
  xpToNext: number;
  avatar?: string;
  lastTickTimestamp: number;
  offlineMultiplier: number;
  isVip: boolean;
  nsfwEnabled: boolean;
  charismaPoints: number;

  // Upgrades tracking
  upgrades: {
    lpPerHour: Record<string, number>;
    energy: Record<string, number>;
    lpPerTap: Record<string, number>;
  };

  // Active effects
  activeBoosters: Array<{
    id: string;
    name: string;
    effect: string;
    duration: number;
    startTime: number;
  }>;

  // Character data
  selectedCharacter?: any;
  characters: any[];
  inventory: any[];

  // Progress tracking
  achievements: string[];
  completedTasks: string[];
  dailyRewardsClaimed: string[];

  // Settings
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    autoSave: boolean;
  };
}

interface GameState {
  playerData: PlayerData;
  isLoading: boolean;
  lastSaveTime: number;
  gameVersion: string;
}

type GameAction = 
  | { type: 'SET_PLAYER_DATA'; payload: Partial<PlayerData> }
  | { type: 'TAP'; payload?: { multiplier?: number } }
  | { type: 'UPDATE_TICK' }
  | { type: 'PURCHASE_UPGRADE'; payload: { type: string; name: string; cost: number; effect: any } }
  | { type: 'ACTIVATE_BOOSTER'; payload: any }
  | { type: 'COMPLETE_TASK'; payload: any }
  | { type: 'LEVEL_UP' }
  | { type: 'SELECT_CHARACTER'; payload: any }
  | { type: 'ADD_CHARACTER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SYNC_WITH_SERVER'; payload: Partial<PlayerData> }
  | { type: 'RESET_GAME' };

const initialPlayerData: PlayerData = {
  id: 'default-player',
  name: 'Player',
  level: 1,
  lp: 5000,
  lpPerHour: 100,
  lpPerTap: 10,
  energy: 1000,
  maxEnergy: 1000,
  coins: 0,
  xp: 0,
  xpToNext: 100,
  lastTickTimestamp: Date.now(),
  offlineMultiplier: 1,
  isVip: false,
  nsfwEnabled: false,
  charismaPoints: 0,
  upgrades: {
    lpPerHour: {},
    energy: {},
    lpPerTap: {},
  },
  activeBoosters: [],
  selectedCharacter: null,
  characters: [],
  inventory: [],
  achievements: [],
  completedTasks: [],
  dailyRewardsClaimed: [],
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    autoSave: true,
  },
};

const initialState: GameState = {
  playerData: initialPlayerData,
  isLoading: true,
  lastSaveTime: Date.now(),
  gameVersion: '1.0.0',
};

/**
 * Game reducer - handles all game state transitions
 * Pure function that applies game rules and calculations
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_DATA':
      return {
        ...state,
        playerData: { ...state.playerData, ...action.payload },
      };

    case 'TAP':
      const tapMultiplier = action.payload?.multiplier || 1;
      const tapReward = Math.floor(state.playerData.lpPerTap * tapMultiplier);
      const energyCost = 1;

      // Check if player has enough energy
      if (state.playerData.energy < energyCost) {
        return state; // Not enough energy
      }

      return {
        ...state,
        playerData: {
          ...state.playerData,
          lp: state.playerData.lp + tapReward,
          energy: Math.max(0, state.playerData.energy - energyCost),
          xp: state.playerData.xp + Math.floor(tapReward / 10), // XP gain from tapping
        },
      };

    case 'UPDATE_TICK':
      const now = Date.now();
      const timeDiff = now - state.playerData.lastTickTimestamp;
      const hoursPassed = timeDiff / (1000 * 60 * 60);

      // Calculate offline LP (capped at 2 hours as per README)
      const maxOfflineHours = 2;
      const effectiveHours = Math.min(hoursPassed, maxOfflineHours);
      const offlineLP = Math.floor(state.playerData.lpPerHour * effectiveHours * state.playerData.offlineMultiplier);

      // Calculate energy regeneration (example: 1 energy per 3 seconds)
      const energyRegenRate = 1 / 3; // per second
      const energyToAdd = Math.floor((timeDiff / 1000) * energyRegenRate);
      const newEnergy = Math.min(state.playerData.maxEnergy, state.playerData.energy + energyToAdd);

      return {
        ...state,
        playerData: {
          ...state.playerData,
          lp: state.playerData.lp + offlineLP,
          energy: newEnergy,
          lastTickTimestamp: now,
        },
      };

    case 'PURCHASE_UPGRADE':
      const { type: upgradeType, name: upgradeName, cost, effect } = action.payload;

      // Check if player can afford upgrade
      if (state.playerData.lp < cost) {
        return state;
      }

      // Apply upgrade effect
      const newUpgrades = {
        ...state.playerData.upgrades,
        [upgradeType]: {
          ...state.playerData.upgrades[upgradeType as keyof typeof state.playerData.upgrades],
          [upgradeName]: ((state.playerData.upgrades[upgradeType as keyof typeof state.playerData.upgrades] as Record<string, number>)[upgradeName] || 0) + 1,
        },
      };

      // Calculate new stats based on upgrade
      let updatedStats: Partial<PlayerData> = {
        lp: state.playerData.lp - cost,
        upgrades: newUpgrades,
      };

      // Apply specific upgrade effects
      if (upgradeType === 'lpPerHour') {
        updatedStats.lpPerHour = state.playerData.lpPerHour + effect.increase;
      } else if (upgradeType === 'energy') {
        updatedStats.maxEnergy = state.playerData.maxEnergy + effect.increase;
      } else if (upgradeType === 'lpPerTap') {
        updatedStats.lpPerTap = state.playerData.lpPerTap + effect.increase;
      }

      return {
        ...state,
        playerData: { ...state.playerData, ...updatedStats },
      };

    case 'ACTIVATE_BOOSTER':
      const newBooster = {
        ...action.payload,
        startTime: Date.now(),
      };

      return {
        ...state,
        playerData: {
          ...state.playerData,
          activeBoosters: [...state.playerData.activeBoosters, newBooster],
        },
      };

    case 'LEVEL_UP':
      // Check if player has enough XP
      if (state.playerData.xp < state.playerData.xpToNext) {
        return state;
      }

      const newLevel = state.playerData.level + 1;
      const remainingXP = state.playerData.xp - state.playerData.xpToNext;
      const newXPRequired = Math.floor(state.playerData.xpToNext * 1.5); // 50% increase per level

      return {
        ...state,
        playerData: {
          ...state.playerData,
          level: newLevel,
          xp: remainingXP,
          xpToNext: newXPRequired,
          // Level up bonuses
          maxEnergy: state.playerData.maxEnergy + 10,
          lpPerHour: state.playerData.lpPerHour + 5,
        },
      };

    case 'SELECT_CHARACTER':
      return {
        ...state,
        playerData: {
          ...state.playerData,
          selectedCharacter: action.payload,
        },
      };

    case 'ADD_CHARACTER':
      return {
        ...state,
        playerData: {
          ...state.playerData,
          characters: [...state.playerData.characters, action.payload],
        },
      };

    case 'COMPLETE_TASK':
      const task = action.payload;
      return {
        ...state,
        playerData: {
          ...state.playerData,
          completedTasks: [...state.playerData.completedTasks, task.id],
          lp: state.playerData.lp + (task.reward?.lp || 0),
          xp: state.playerData.xp + (task.reward?.xp || 0),
          coins: state.playerData.coins + (task.reward?.coins || 0),
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SYNC_WITH_SERVER':
      return {
        ...state,
        playerData: { ...state.playerData, ...action.payload },
        lastSaveTime: Date.now(),
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        isLoading: false,
      };

    default:
      return state;
  }
}

interface GameContextType {
  // State
  playerData: PlayerData;
  isLoading: boolean;
  gameVersion: string;

  // Actions
  setPlayerData: (data: Partial<PlayerData>) => void;
  tap: (multiplier?: number) => void;
  purchaseUpgrade: (type: string, name: string, cost: number, effect: any) => void;
  activateBooster: (booster: any) => void;
  levelUp: () => void;
  selectCharacter: (character: any) => void;
  addCharacter: (character: any) => void;
  completeTask: (task: any) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

/**
 * Custom hook to use the game context
 * Provides easy access to game state and actions
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

/**
 * GameProvider - Main context provider for the game
 * Handles state management, persistence, and server sync
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Auto-save to localStorage
  useEffect(() => {
    if (!state.isLoading && state.playerData.settings.autoSave) {
      localStorage.setItem('characterTapGame_playerData', JSON.stringify(state.playerData));
      localStorage.setItem('characterTapGame_lastSave', Date.now().toString());
    }
  }, [state.playerData, state.isLoading]);

  // Periodic tick system for offline calculations
  useEffect(() => {
    const tickInterval = setInterval(() => {
      dispatch({ type: 'UPDATE_TICK' });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(tickInterval);
  }, []);

  // Clean up expired boosters
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const activeBoosters = state.playerData.activeBoosters.filter(
        booster => (now - booster.startTime) < booster.duration
      );

      if (activeBoosters.length !== state.playerData.activeBoosters.length) {
        dispatch({ 
          type: 'SET_PLAYER_DATA', 
          payload: { activeBoosters } 
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, [state.playerData.activeBoosters]);

  // Load game data on mount
  const loadGame = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Try to load from localStorage first with validation
      const savedData = localStorage.getItem('characterTapGame_playerData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Clear localStorage and force default stats if data is invalid
          if (!parsed || parsed.lp <= 0 && parsed.energy <= 0 && parsed.lpPerHour <= 0) {
            console.warn('Found invalid saved data with zero values, clearing localStorage and using defaults');
            localStorage.clear();
            // Force default values
            dispatch({ type: 'SET_PLAYER_DATA', payload: {
              lp: 5000,
              energy: 1000,
              maxEnergy: 1000,
              lpPerHour: 250,
              lpPerTap: 1.5,
              level: 1
            }});
          } else {
            dispatch({ type: 'SET_PLAYER_DATA', payload: parsed });
          }
        } catch (error) {
          console.warn('Invalid saved data, clearing localStorage and using defaults:', error);
          localStorage.clear();
          // Force default values
          dispatch({ type: 'SET_PLAYER_DATA', payload: {
            lp: 5000,
            energy: 1000,
            maxEnergy: 1000,
            lpPerHour: 250,
            lpPerTap: 1.5,
            level: 1
          }});
        }
      }

      // Then try to sync with server
      try {
        const response = await apiRequest('GET', `/api/player/${state.playerData.id}`);
        if (response.ok) {
          const serverData = await response.json();
          dispatch({ type: 'SYNC_WITH_SERVER', payload: serverData });
        }
      } catch (serverError) {
        console.warn('Failed to sync with server, using local data:', serverError);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.playerData.id]);

  // Save game data
  const saveGame = useCallback(async () => {
    try {
      // Save to localStorage
      localStorage.setItem('characterTapGame_playerData', JSON.stringify(state.playerData));

      // Sync with server
      await apiRequest('POST', `/api/player/${state.playerData.id}/save`, state.playerData);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [state.playerData]);

  // Initialize game on mount
  useEffect(() => {
    loadGame();
  }, []);

  // Action creators
  const actions = {
    setPlayerData: (data: Partial<PlayerData>) => 
      dispatch({ type: 'SET_PLAYER_DATA', payload: data }),

    tap: (multiplier?: number) => 
      dispatch({ type: 'TAP', payload: { multiplier } }),

    purchaseUpgrade: (type: string, name: string, cost: number, effect: any) =>
      dispatch({ type: 'PURCHASE_UPGRADE', payload: { type, name, cost, effect } }),

    activateBooster: (booster: any) =>
      dispatch({ type: 'ACTIVATE_BOOSTER', payload: booster }),

    levelUp: () => 
      dispatch({ type: 'LEVEL_UP' }),

    selectCharacter: (character: any) =>
      dispatch({ type: 'SELECT_CHARACTER', payload: character }),

    addCharacter: (character: any) =>
      dispatch({ type: 'ADD_CHARACTER', payload: character }),

    completeTask: (task: any) =>
      dispatch({ type: 'COMPLETE_TASK', payload: task }),

    resetGame: () => 
      dispatch({ type: 'RESET_GAME' }),

    saveGame,
    loadGame,
  };

  const contextValue: GameContextType = {
    playerData: state.playerData,
    isLoading: state.isLoading,
    gameVersion: state.gameVersion,
    ...actions,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};