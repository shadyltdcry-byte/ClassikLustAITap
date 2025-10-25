import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import GameDebugger from './GameDebugger';
import { ComponentProbe } from '@/plugins/core';
import { 
  Bug, 
  Search, 
  Eye, 
  Settings
} from 'lucide-react';

interface DebugState {
  playerId: string;
  playerLevel: number;
  playerLP: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  activeTab: string;
  isTapping: boolean;
  selectedCharacter: any;
  showOfflineDialog: boolean;
  showAdminMenu: boolean;
  showWheelGame: boolean;
  showVIP: boolean;
  renderCount: number;
  lastUpdate: number;
  apiCalls: number;
}

interface EnhancedDebuggerProps {
  // Game state from GameGUI
  gameState: DebugState;
  onStateChange?: (newState: Partial<DebugState>) => void;
  
  // Real-time game state connection
  realGameState?: {
    selectedCharacter: any;
    user: any;
    activePlugin: string;
    isTapping: boolean;
    guiState: any;
    onToggleModal?: (modal: string) => void;
  };
  
  // Component references for direct access
  componentRefs?: {
    gameGUI?: any;
    playerStats?: any;
    gameTabs?: any;
  };
}

export default function EnhancedDebugger({ 
  gameState, 
  onStateChange, 
  realGameState,
  componentRefs 
}: EnhancedDebuggerProps) {
  const [gameDebuggerVisible, setGameDebuggerVisible] = useState(false);
  const [componentProbeVisible, setComponentProbeVisible] = useState(true); // Start with probe visible
  const [componentErrors, setComponentErrors] = useState<string[]>([]);
  
  // Handle component errors from probe
  const handleComponentError = (componentName: string, error: string) => {
    const errorMsg = `${componentName}: ${error}`;
    setComponentErrors(prev => {
      if (!prev.includes(errorMsg)) {
        return [...prev, errorMsg];
      }
      return prev;
    });
    
    console.error(`🚨 Component Error Detected:`, {
      component: componentName,
      error,
      timestamp: new Date().toISOString()
    });
  };
  
  // Auto-show probe if there are component errors
  useEffect(() => {
    if (componentErrors.length > 0) {
      setComponentProbeVisible(true);
    }
  }, [componentErrors]);
  
  return (
    <>
      {/* Component Probe - Highest Priority for Boot Issues */}
      <ComponentProbe 
        isVisible={componentProbeVisible}
        onToggle={() => setComponentProbeVisible(!componentProbeVisible)}
        onComponentError={handleComponentError}
      />
      
      {/* Traditional Game Debugger */}
      <GameDebugger 
        gameState={gameState}
        onStateChange={onStateChange}
        componentRefs={componentRefs}
        isVisible={gameDebuggerVisible}
        onToggle={() => setGameDebuggerVisible(!gameDebuggerVisible)}
        realGameState={realGameState}
      />
      
      {/* Central Debug Control - Only show if both debuggers are hidden */}
      {!gameDebuggerVisible && !componentProbeVisible && (
        <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
          <Button
            onClick={() => setComponentProbeVisible(true)}
            className="bg-red-600 hover:bg-red-700 border-2 border-red-400"
            size="sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Probe
          </Button>
          
          <Button
            onClick={() => setGameDebuggerVisible(true)}
            className="bg-green-600 hover:bg-green-700 border-2 border-green-400"
            size="sm"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </Button>
          
          {componentErrors.length > 0 && (
            <div className="bg-red-900/80 border border-red-500 rounded p-2 text-xs text-white max-w-48">
              <div className="font-bold text-red-300 mb-1">🚨 Boot Blocked</div>
              <div className="text-red-200">
                {componentErrors.length} component error{componentErrors.length !== 1 ? 's' : ''} detected.
                Click Probe to fix.
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Emergency Status Indicator */}
      {componentErrors.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] bg-red-900/95 border-2 border-red-500 rounded-lg px-4 py-2 text-white text-sm font-bold backdrop-blur-sm">
          ⚠️ BOOT FAILURE: {componentErrors.length} Component Error{componentErrors.length !== 1 ? 's' : ''}
        </div>
      )}
    </>
  );
}