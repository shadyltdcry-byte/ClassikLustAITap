import { useState, useCallback, useRef, useEffect } from 'react';

// Debug state interface - all game state that can be monitored/mutated
interface DebugState {
  // Player State
  playerId: string;
  playerLevel: number;
  playerLP: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  
  // Game State  
  activeTab: string;
  isTapping: boolean;
  selectedCharacter: any;
  
  // UI State
  showOfflineDialog: boolean;
  showAdminMenu: boolean;
  showWheelGame: boolean;
  showVIP: boolean;
  
  // Performance Metrics
  renderCount: number;
  lastUpdate: number;
  apiCalls: number;
}

// Hook for exposing component state to debugger
export function useGameDebugger(initialState: Partial<DebugState> = {}) {
  const [debugState, setDebugState] = useState<DebugState>({
    playerId: '',
    playerLevel: 1,
    playerLP: 0,
    playerEnergy: 1000,
    playerMaxEnergy: 1000,
    activeTab: 'main',
    isTapping: false,
    selectedCharacter: null,
    showOfflineDialog: false,
    showAdminMenu: false,
    showWheelGame: false,
    showVIP: false,
    renderCount: 0,
    lastUpdate: Date.now(),
    apiCalls: 0,
    ...initialState
  });

  const [isDebuggerVisible, setIsDebuggerVisible] = useState(false);
  const componentRefs = useRef<Record<string, any>>({});
  const renderCountRef = useRef(0);

  // Track renders WITHOUT causing re-renders (moved outside render cycle)
  renderCountRef.current += 1;

  // Safe state mutation - allows debugger to change any state
  const updateDebugState = useCallback((updates: Partial<DebugState>) => {
    setDebugState(prev => ({
      ...prev,
      ...updates,
      renderCount: renderCountRef.current, // Always get latest render count
      lastUpdate: Date.now()
    }));
  }, []);

  // Register component ref for direct state access
  const registerComponent = useCallback((name: string, ref: any) => {
    componentRefs.current[name] = ref;
  }, []);

  // Expose state clearly for components to use
  const exposeState = useCallback((componentState: Partial<DebugState>) => {
    updateDebugState(componentState);
  }, [updateDebugState]);

  // API call tracking - use functional update to avoid dependency loops
  const trackApiCall = useCallback(() => {
    setDebugState(prev => ({ 
      ...prev,
      apiCalls: prev.apiCalls + 1,
      lastUpdate: Date.now()
    }));
  }, []);

  return {
    // Debug state
    debugState,
    updateDebugState,
    
    // Component registration
    registerComponent,
    componentRefs: componentRefs.current,
    
    // State exposure
    exposeState,
    
    // Performance tracking
    trackApiCall,
    
    // Debugger visibility
    isDebuggerVisible,
    toggleDebugger: () => setIsDebuggerVisible(!isDebuggerVisible),
    
    // Helper functions for common mutations
    setPlayerLP: (lp: number) => updateDebugState({ playerLP: lp }),
    setPlayerEnergy: (energy: number) => updateDebugState({ playerEnergy: energy }),
    setPlayerLevel: (level: number) => updateDebugState({ playerLevel: level }),
    setActiveTab: (tab: string) => updateDebugState({ activeTab: tab }),
    setTapping: (tapping: boolean) => updateDebugState({ isTapping: tapping }),
  };
}