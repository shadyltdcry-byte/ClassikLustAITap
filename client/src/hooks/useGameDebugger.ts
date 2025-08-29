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
  const renderTimestamps = useRef<number[]>([]);
  const apiCallTimes = useRef<{endpoint: string, time: number, responseTime?: number, payload?: any}[]>([]);
  const componentLastRender = useRef<Record<string, number>>({});
  const stateHistory = useRef<{timestamp: number, key: string, value: any}[]>([]);

  // Track renders WITHOUT causing re-renders (moved outside render cycle)
  renderCountRef.current += 1;
  
  // Render spike detection
  const now = Date.now();
  renderTimestamps.current.push(now);
  // Keep only timestamps from last 1 second
  renderTimestamps.current = renderTimestamps.current.filter(time => now - time < 1000);
  
  // Alert on render spikes (>10 renders per second)
  if (renderTimestamps.current.length > 10) {
    setDebugState(prev => ({
      ...prev,
      warnings: [...prev.warnings.slice(-4), {
        timestamp: now,
        type: 'performance',
        message: `⚠️ Render spike: ${renderTimestamps.current.length} renders in 1s`,
        component: 'Multiple components'
      }]
    }));
    renderTimestamps.current = []; // Reset after alert
  }
  
  // 🚀 RENDER PREDICTION ALERTS - Trend analysis
  else if (renderTimestamps.current.length > 5) {
    const renderRate = renderTimestamps.current.length;
    const timeSpan = (now - renderTimestamps.current[0]) / 1000;
    const rendersPerSecond = renderRate / timeSpan;
    
    // Predict if we're trending toward a spike
    if (rendersPerSecond > 7 && rendersPerSecond < 10) {
      const projectedRate = Math.round(rendersPerSecond * 1.5);
      setDebugState(prev => ({
        ...prev,
        warnings: [...prev.warnings.slice(-4), {
          timestamp: now,
          type: 'performance',
          message: `🔮 Heads up! Components trending toward ${projectedRate} renders/sec in 3s`,
          component: 'Prediction Engine'
        }]
      }));
    }
  }

  // Enhanced error/warning interception
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setDebugState(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), {
          timestamp: Date.now(),
          type: 'api',
          message: `Unhandled promise rejection: ${event.reason?.message || event.reason}`,
          component: 'Unknown - likely API call'
        }],
        errorCount: prev.errorCount + 1
      }));
      event.preventDefault(); // Prevent default browser behavior
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
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
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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

  // 🕵️ COMPONENT FREEZE DETECTOR
  const trackComponentRender = useCallback((componentName: string) => {
    const now = Date.now();
    const lastRender = componentLastRender.current[componentName] || 0;
    const timeSinceLastRender = now - lastRender;
    
    // If a component hasn't rendered in >30 seconds but state changed, it might be frozen
    if (timeSinceLastRender > 30000 && lastRender > 0) {
      setDebugState(prev => ({
        ...prev,
        warnings: [...prev.warnings.slice(-4), {
          timestamp: now,
          type: 'performance',
          message: `😴 Component freeze detected: ${componentName} hasn't rendered in ${Math.round(timeSinceLastRender/1000)}s`,
          component: componentName
        }]
      }));
    }
    
    componentLastRender.current[componentName] = now;
  }, []);
  
  // Enhanced API call tracking with profiling and anomaly detection
  const trackApiCall = useCallback((endpoint: string, responseTime?: number, payload?: any) => {
    const callInfo = { endpoint, time: Date.now(), responseTime, payload };
    apiCallTimes.current.push(callInfo);
    
    // 🔍 API ANOMALY SCORING
    if (payload !== undefined) {
      // Detect suspiciously empty responses
      if (Array.isArray(payload) && payload.length === 0 && endpoint.includes('inventory')) {
        setDebugState(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), {
            timestamp: Date.now(),
            type: 'api',
            message: `🤔 ${endpoint} returned 0 items... suspicious`,
            component: 'API Layer'
          }]
        }));
      }
      
      // Detect massive payloads that might cause performance issues
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > 50000) { // >50KB
        setDebugState(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), {
            timestamp: Date.now(),
            type: 'api',
            message: `📦 Huge payload detected: ${endpoint} → ${Math.round(payloadSize/1024)}KB`,
            component: 'API Layer'
          }]
        }));
      }
    }
    // Keep only last 50 API calls
    if (apiCallTimes.current.length > 50) {
      apiCallTimes.current = apiCallTimes.current.slice(-50);
    }
    
    setDebugState(prev => ({ 
      ...prev,
      apiCalls: prev.apiCalls + 1
    }));
    
    // Alert on slow API calls (>2 seconds)
    if (responseTime && responseTime > 2000) {
      setDebugState(prev => ({
        ...prev,
        warnings: [...prev.warnings.slice(-4), {
          timestamp: Date.now(),
          type: 'api',
          message: `🐌 Slow API call: ${endpoint} → ${responseTime}ms`,
          component: 'API Layer'
        }]
      }));
    }
    
    // Alert on repeated API calls (same endpoint >3 times in 5 seconds)
    const recentCalls = apiCallTimes.current.filter(call => 
      call.endpoint === endpoint && (Date.now() - call.time) < 5000
    );
    if (recentCalls.length > 3) {
      setDebugState(prev => ({
        ...prev,
        warnings: [...prev.warnings.slice(-4), {
          timestamp: Date.now(),
          type: 'api',
          message: `🔄 Repeated API calls: ${endpoint} (${recentCalls.length}x in 5s)`,
          component: 'API Layer'
        }]
      }));
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
    
    // Access to internal data for advanced debugging
    getStateHistory: () => stateHistory.current,
    getApiCallHistory: () => apiCallTimes.current,
    getRenderHistory: () => renderTimestamps.current,
    
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
    
    // Enhanced State Mutation Watchdog with history tracking
    watchState: (key: keyof DebugState, threshold = 5) => {
      const changes = useRef<number[]>([]);
      return (newValue: any) => {
        const now = Date.now();
        changes.current.push(now);
        // Keep only changes from last 1 second
        changes.current = changes.current.filter(time => now - time < 1000);
        
        // Track state history for dependency analysis
        stateHistory.current.push({ timestamp: now, key, value: newValue });
        if (stateHistory.current.length > 100) {
          stateHistory.current = stateHistory.current.slice(-100);
        }
        
        // Alert on rapid mutations
        if (changes.current.length > threshold) {
          updateDebugState({ 
            warnings: [...debugState.warnings.slice(-4), {
              timestamp: now,
              type: 'performance',
              message: `⚡ Rapid ${key} mutations: ${changes.current.length} changes in 1s`,
              component: 'State Layer'
            }]
          });
          changes.current = []; // Reset after alert
        }
        
        updateDebugState({ [key]: newValue });
      };
    },
    
    // 🎛️ CUSTOM ALERT SCRIPTING - Let users write custom triggers
    watchCustom: (name: string, condition: () => boolean, callback: () => void, checkInterval = 1000) => {
      const intervalRef = useRef<NodeJS.Timeout>();
      
      useEffect(() => {
        intervalRef.current = setInterval(() => {
          try {
            if (condition()) {
              callback();
              // Auto-log custom alerts to debugger
              updateDebugState({
                warnings: [...debugState.warnings.slice(-4), {
                  timestamp: Date.now(),
                  type: 'performance',
                  message: `🎯 Custom alert triggered: ${name}`,
                  component: 'Custom Script'
                }]
              });
            }
          } catch (error) {
            console.error(`Custom watch '${name}' failed:`, error);
          }
        }, checkInterval);
        
        return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
      }, [condition, callback, checkInterval]);
    },
    
    // Component tracking
    trackComponentRender,
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