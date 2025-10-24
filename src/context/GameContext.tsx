/**
 * GameContext.tsx - Enhanced Game State Management
 * Last Edited: 2025-10-24 by Assistant - Added stats refresh methods for new menu system
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Types
interface User {
  id?: string;
  telegramId?: string;
  username?: string;
  lp?: number;
  level?: number;
  energy?: number;
  maxEnergy?: number;
  lpPerHour?: number;
  [key: string]: any;
}

interface EffectiveStats {
  lpPerTap: number;
  lpPerHour: number;
  maxEnergy: number;
  energyRegen: number;
  tapCooldown: number;
}

interface GameState {
  user: User | null;
  effectiveStats: EffectiveStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface GameContextValue {
  // State
  user: User | null;
  effectiveStats: EffectiveStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setEffectiveStats: (stats: EffectiveStats | null) => void;
  updateUserLP: (newLP: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 🎯 NEW METHODS FOR MENU INTEGRATION
  refreshPlayerStats: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type GameAction = 
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_EFFECTIVE_STATS'; stats: EffectiveStats | null }
  | { type: 'UPDATE_USER_LP'; lp: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

const GameContext = createContext<GameContextValue | null>(null);

/**
 * 🎯 GAME STATE REDUCER
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, isAuthenticated: !!action.user };
      
    case 'SET_EFFECTIVE_STATS':
      return { ...state, effectiveStats: action.stats };
      
    case 'UPDATE_USER_LP':
      return {
        ...state,
        user: state.user ? { ...state.user, lp: action.lp } : null
      };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
      
    case 'SET_ERROR':
      return { ...state, error: action.error };
      
    default:
      return state;
  }
}

const initialState: GameState = {
  user: null,
  effectiveStats: null,
  isLoading: false,
  isAuthenticated: false,
  error: null
};

interface GameProviderProps {
  children: ReactNode;
}

/**
 * 🎮 ENHANCED GAME PROVIDER
 * Now with menu integration methods!
 */
export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Basic actions
  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', user });
  }, []);
  
  const setEffectiveStats = useCallback((stats: EffectiveStats | null) => {
    dispatch({ type: 'SET_EFFECTIVE_STATS', stats });
  }, []);
  
  const updateUserLP = useCallback((newLP: number) => {
    console.log(`💰 [GAME STATE] Updating user LP: ${newLP}`);
    dispatch({ type: 'UPDATE_USER_LP', lp: newLP });
  }, []);
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);
  
  /**
   * 🎯 REFRESH PLAYER STATS (FIXES LP PER TAP!)
   * This is called after upgrade purchases to update computed values
   */
  const refreshPlayerStats = useCallback(async () => {
    if (!state.user?.telegramId) {
      console.warn('🎯 [GAME STATE] Cannot refresh stats - no user');
      return;
    }
    
    try {
      console.log(`🎯 [GAME STATE] Refreshing player stats for ${state.user.telegramId}`);
      
      const response = await fetch(`/api/player/${state.user.telegramId}/stats`);
      const result = await response.json();
      
      if (result.success && result.data.effectiveStats) {
        setEffectiveStats(result.data.effectiveStats);
        console.log(`✅ [GAME STATE] Stats refreshed - LP per tap: ${result.data.effectiveStats.lpPerTap}`);
      } else {
        console.error('❌ [GAME STATE] Failed to refresh stats:', result.error);
      }
    } catch (error: any) {
      console.error('❌ [GAME STATE] Exception refreshing stats:', error);
    }
  }, [state.user?.telegramId, setEffectiveStats]);
  
  /**
   * 🔄 REFRESH USER DATA
   * Reloads complete user profile
   */
  const refreshUser = useCallback(async () => {
    if (!state.user?.telegramId) {
      console.warn('🔄 [GAME STATE] Cannot refresh user - no telegramId');
      return;
    }
    
    try {
      console.log(`🔄 [GAME STATE] Refreshing user data for ${state.user.telegramId}`);
      
      const response = await fetch(`/api/player/${state.user.telegramId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setUser(result.data);
        
        // Also update effective stats if included
        if (result.data.effectiveStats) {
          setEffectiveStats(result.data.effectiveStats);
        }
        
        console.log(`✅ [GAME STATE] User data refreshed`);
      } else {
        console.error('❌ [GAME STATE] Failed to refresh user:', result.error);
      }
    } catch (error: any) {
      console.error('❌ [GAME STATE] Exception refreshing user:', error);
    }
  }, [state.user?.telegramId, setUser, setEffectiveStats]);
  
  const contextValue: GameContextValue = {
    // State
    user: state.user,
    effectiveStats: state.effectiveStats,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    
    // Actions
    setUser,
    setEffectiveStats,
    updateUserLP,
    setLoading,
    setError,
    
    // 🎯 NEW MENU INTEGRATION METHODS
    refreshPlayerStats,
    refreshUser
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * 🎮 USE GAME STATE HOOK
 */
export function useGameState(): GameContextValue {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useGameState must be used within GameProvider');
  }
  
  return context;
}

export default GameProvider;