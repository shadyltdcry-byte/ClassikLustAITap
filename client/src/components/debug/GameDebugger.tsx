import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Bug, 
  Activity, 
  Eye, 
  Settings, 
  Zap, 
  Heart, 
  Target,
  RefreshCw,
  Database,
  Monitor,
  Code
} from 'lucide-react';

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
  
  // Performance
  renderCount: number;
  lastUpdate: number;
  apiCalls: number;
}

interface GameDebuggerProps {
  // State exposure props - components pass their state here
  gameState: DebugState;
  onStateChange: (newState: Partial<DebugState>) => void;
  
  // Component refs for direct state access
  componentRefs: {
    gameGUI?: any;
    playerStats?: any;
    gameTabs?: any;
    tasksPanel?: any;
    achievementsPanel?: any;
  };
  
  // Real-time monitoring
  isVisible: boolean;
  onToggle: () => void;
}

export default function GameDebugger({ 
  gameState, 
  onStateChange, 
  componentRefs,
  isVisible, 
  onToggle 
}: GameDebuggerProps) {
  const [selectedComponent, setSelectedComponent] = useState('player');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshRate, setRefreshRate] = useState(1000);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Real-time state monitoring
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        // Force re-render to show live data
        onStateChange({ lastUpdate: Date.now() });
      }, refreshRate);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshRate, onStateChange]);

  // Safe state mutations - no hardcoded values
  const mutatePlayerState = (field: keyof DebugState, value: any) => {
    onStateChange({ [field]: value });
  };

  const resetToDefaults = () => {
    onStateChange({
      playerLP: 1000,
      playerEnergy: 1000,
      playerLevel: 1,
      activeTab: 'main',
      isTapping: false
    });
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-[60] bg-green-600 hover:bg-green-700 border-2 border-green-400"
        size="sm"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <>
      {/* Floating Debug Panel */}
      <div className="fixed top-4 left-4 z-[60] w-96 max-h-[80vh] bg-gray-900/95 border border-green-500/50 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between p-3 border-b border-green-500/30">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-white text-sm">Live Debugger</h3>
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
              className="scale-75"
            />
            <Button onClick={onToggle} variant="ghost" size="sm" className="text-gray-400">
              ×
            </Button>
          </div>
        </div>

        <Tabs value={selectedComponent} onValueChange={setSelectedComponent} className="h-full">
          <TabsList className="w-full bg-gray-800/50 p-1 m-2 grid grid-cols-4 gap-1">
            <TabsTrigger value="player" className="text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Player
            </TabsTrigger>
            <TabsTrigger value="game" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Game
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              API
            </TabsTrigger>
            <TabsTrigger value="perf" className="text-xs">
              <Monitor className="w-3 h-3 mr-1" />
              Perf
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] px-3 pb-3">
            {/* Player State Tab */}
            <TabsContent value="player" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    Player State
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {/* Live LP Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Lust Points:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/50">
                        {gameState.playerLP?.toLocaleString() || 'Loading...'}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerLP || 0}
                        onChange={(e) => mutatePlayerState('playerLP', Number(e.target.value))}
                        className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Live Energy Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Energy:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/50">
                        {gameState.playerEnergy || 0}/{gameState.playerMaxEnergy || 1000}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerEnergy || 0}
                        onChange={(e) => mutatePlayerState('playerEnergy', Number(e.target.value))}
                        className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Live Level Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Level:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/50">
                        {gameState.playerLevel || 1}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerLevel || 1}
                        onChange={(e) => mutatePlayerState('playerLevel', Number(e.target.value))}
                        className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Game State Tab */}
            <TabsContent value="game" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Game State
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {/* Active Tab */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Active Tab:</Label>
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/50">
                      {gameState.activeTab || 'main'}
                    </Badge>
                  </div>

                  {/* Tapping State */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Is Tapping:</Label>
                    <Badge className={`${gameState.isTapping ? 'bg-green-600/20 text-green-300 border-green-500/50' : 'bg-gray-600/20 text-gray-300 border-gray-500/50'}`}>
                      {gameState.isTapping ? 'YES' : 'NO'}
                    </Badge>
                  </div>

                  {/* Selected Character */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Character:</Label>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/50">
                      {gameState.selectedCharacter?.name || 'None'}
                    </Badge>
                  </div>

                  {/* Modal States */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-xs">Open Modals:</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Badge variant={gameState.showOfflineDialog ? "default" : "outline"} className="text-xs">
                        Offline
                      </Badge>
                      <Badge variant={gameState.showAdminMenu ? "default" : "outline"} className="text-xs">
                        Admin
                      </Badge>
                      <Badge variant={gameState.showWheelGame ? "default" : "outline"} className="text-xs">
                        Wheel
                      </Badge>
                      <Badge variant={gameState.showVIP ? "default" : "outline"} className="text-xs">
                        VIP
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Monitoring Tab */}
            <TabsContent value="api" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    API Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">API Calls:</Label>
                    <Badge className="bg-green-600/20 text-green-300 border-green-500/50">
                      {gameState.apiCalls || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Last Update:</Label>
                    <Badge className="bg-gray-600/20 text-gray-300 border-gray-500/50">
                      {gameState.lastUpdate ? new Date(gameState.lastUpdate).toLocaleTimeString() : 'Never'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="perf" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-yellow-400" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Render Count:</Label>
                    <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/50">
                      {gameState.renderCount || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Refresh Rate:</Label>
                    <Input
                      type="number"
                      value={refreshRate}
                      onChange={(e) => setRefreshRate(Number(e.target.value))}
                      className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                      min="100"
                      max="5000"
                      step="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="p-3 border-t border-gray-700 space-y-2">
            <Button
              onClick={resetToDefaults}
              className="w-full bg-red-600 hover:bg-red-700 text-xs h-8"
              size="sm"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Reset to Defaults
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => mutatePlayerState('playerEnergy', gameState.playerMaxEnergy || 1000)}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                size="sm"
              >
                <Zap className="w-3 h-3 mr-1" />
                Max Energy
              </Button>
              
              <Button
                onClick={() => mutatePlayerState('playerLP', (gameState.playerLP || 0) + 1000)}
                className="bg-pink-600 hover:bg-pink-700 text-xs h-7"
                size="sm"
              >
                <Heart className="w-3 h-3 mr-1" />
                +1000 LP
              </Button>
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
}