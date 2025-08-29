import { useState, useCallback, useRef, useEffect } from 'react';

// Enhanced error detection and monitoring
interface ErrorLog {
  timestamp: number;
  type: 'react' | 'typescript' | 'api' | 'performance' | 'security';
  message: string;
  stack?: string;
  component?: string;
}

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
  
  // Enhanced Debugging
  errors: ErrorLog[];
  warnings: ErrorLog[];
  lastError?: ErrorLog;
  errorCount: number;
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
    errors: [],
    warnings: [],
    errorCount: 0,
    ...initialState
  });

  const [isDebuggerVisible, setIsDebuggerVisible] = useState(false);
  const componentRefs = useRef<Record<string, any>>({});
  const renderCountRef = useRef(0);
  const originalConsoleError = useRef(console.error);
  const originalConsoleWarn = useRef(console.warn);

  // Track renders WITHOUT causing re-renders (moved outside render cycle)
  renderCountRef.current += 1;

  // Enhanced error/warning interception
  useEffect(() => {
    // Intercept console.error for React warnings and errors
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Detect React key warnings
      if (message.includes('Warning: Encountered two children with the same key')) {
        const keyMatch = message.match(/key, `([^`]+)`/);
        const duplicateKey = keyMatch ? keyMatch[1] : 'unknown';
        
        setDebugState(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), {
            timestamp: Date.now(),
            type: 'react',
            message: `Duplicate React key detected: ${duplicateKey}`,
            component: 'TasksPanel or AchievementsPanel'
          }]
        }));
      }
      
      // Detect other React warnings
      else if (message.includes('Warning:')) {
        setDebugState(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), {
            timestamp: Date.now(),
            type: 'react',
            message: message.substring(0, 100) + '...',
          }]
        }));
      }
      
      // Detect TypeScript/runtime errors
      else if (message.includes('TypeError') || message.includes('ReferenceError')) {
        setDebugState(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-4), {
            timestamp: Date.now(),
            type: 'typescript',
            message: message.substring(0, 100) + '...',
          }],
          errorCount: prev.errorCount + 1,
          lastError: {
            timestamp: Date.now(),
            type: 'typescript',
            message
          }
        }));
      }
      
      originalConsoleError.current(...args);
    };
    
    // Intercept console.warn
    console.warn = (...args) => {
      const message = args.join(' ');
      
      setDebugState(prev => ({
        ...prev,
        warnings: [...prev.warnings.slice(-4), {
          timestamp: Date.now(),
          type: 'performance',
          message: message.substring(0, 100) + '...',
        }]
      }));
      
      originalConsoleWarn.current(...args);
    };

    // Cleanup
    return () => {
      console.error = originalConsoleError.current;
      console.warn = originalConsoleWarn.current;
    };
  }, []);

  // Safe state mutation - allows debugger to change any state
  const updateDebugState = useCallback((updates: Partial<DebugState>) => {
    setDebugState(prev => ({
      ...prev,
      ...updates
      // Removed automatic renderCount and lastUpdate to stop render loops
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
      apiCalls: prev.apiCalls + 1
      // Removed lastUpdate to stop render loops
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
    
    // Enhanced debugging helpers
    clearErrors: () => updateDebugState({ errors: [], warnings: [], errorCount: 0 }),
    logError: (type: ErrorLog['type'], message: string, component?: string) => {
      const error: ErrorLog = {
        timestamp: Date.now(),
        type,
        message,
        component
      };
      setDebugState(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), error],
        errorCount: prev.errorCount + 1,
        lastError: error
      }));
    },
  };
}