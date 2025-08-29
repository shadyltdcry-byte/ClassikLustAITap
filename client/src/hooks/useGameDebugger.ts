import { useState, useCallback, useRef, useEffect } from 'react';
import type { TapStats, GameUpgrade, GameCharacter } from '@/shared/types';

export interface DebugState {
  playerLP: number;
  playerEnergy: number;
  playerLevel: number;
  activeTab: string;
  isTapping: boolean;
  rerenderCount: number;
  apiCalls: number;
  errorCount: number;
  warnings: DebugAlert[];
  errors: DebugAlert[];
  components: Record<string, any>;
  states: Record<string, any>;
}

export interface DebugAlert {
  timestamp: number;
  type: 'error' | 'warning' | 'performance' | 'api';
  message: string;
  component: string;
}

export function useGameDebugger() {
  const [debugState, setDebugState] = useState<DebugState>({
    playerLP: 0,
    playerEnergy: 100,
    playerLevel: 1,
    activeTab: 'character',
    isTapping: false,
    rerenderCount: 0,
    apiCalls: 0,
    errorCount: 0,
    warnings: [],
    errors: [],
    components: {},
    states: {}
  });

  const [isDebuggerVisible, setIsDebuggerVisible] = useState(false);
  const componentRefs = useRef<Record<string, any>>({});
  
  // Simple tracking (no memory leaks)
  const renderCount = useRef(0);
  const apiCallCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  const updateDebugState = useCallback((updates: Partial<DebugState>) => {
    setDebugState(prev => ({ ...prev, ...updates }));
  }, []);

  // Simple render tracking
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    
    // Simple render spike detection (every 2 seconds)
    if (now - lastRenderTime.current > 2000) {
      if (renderCount.current > 50) {
        console.warn(`⚠️ High render count: ${renderCount.current} renders in 2s`);
      }
      renderCount.current = 0;
      lastRenderTime.current = now;
    }
  });

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setDebugState(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        errors: [...(prev.errors || []).slice(-4), {
          timestamp: Date.now(),
          type: 'error',
          message: event.message || 'Unknown error',
          component: 'Global'
        }]
      }));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setDebugState(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        errors: [...(prev.errors || []).slice(-4), {
          timestamp: Date.now(),
          type: 'error',
          message: `Promise rejection: ${event.reason}`,
          component: 'Promise'
        }]
      }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Component registration
  const registerComponent = useCallback((name: string, component: any) => {
    componentRefs.current[name] = component;
    setDebugState(prev => ({
      ...prev,
      components: { ...prev.components, [name]: component }
    }));
  }, []);

  // State exposure
  const exposeState = useCallback((key: string, state: any) => {
    setDebugState(prev => ({
      ...prev,
      states: { ...prev.states, [key]: state }
    }));
  }, []);

  // Simple API call tracking
  const trackApiCall = useCallback((endpoint: string, responseTime?: number) => {
    apiCallCount.current++;
    
    setDebugState(prev => ({ 
      ...prev,
      apiCalls: prev.apiCalls + 1
    }));
    
    // Simple slow API warning
    if (responseTime && responseTime > 3000) {
      console.warn(`🐌 Slow API call: ${endpoint} → ${responseTime}ms`);
    }
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
    
    // Enhanced debugging helpers
    clearErrors: () => updateDebugState({ errors: [], warnings: [], errorCount: 0 }),
    
    // Simple state watcher (no memory leaks)
    watchState: (key: keyof DebugState, threshold = 10) => {
      let changeCount = 0;
      let lastCheck = Date.now();
      
      return (newValue: any) => {
        const now = Date.now();
        
        // Reset counter every 2 seconds
        if (now - lastCheck > 2000) {
          changeCount = 0;
          lastCheck = now;
        }
        
        changeCount++;
        
        if (changeCount > threshold) {
          console.warn(`⚡ High ${key} mutation rate: ${changeCount} changes`);
        }
        
        updateDebugState({ [key]: newValue });
      };
    }
  };
}