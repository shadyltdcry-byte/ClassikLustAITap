/**
 * GameGUI.tsx - Game Presentation Layer
 * Last Edited: 2025-08-19 by Assistant
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Star, Settings } from "lucide-react";

import CharacterDisplay from "@/components/CharacterDisplay";
import NewsTicker from "@/components/NewsTicker";

import Upgrades from "@/plugins/gameplay/Upgrades";
import Tasks from "@/plugins/gameplay/Task";
import Achievements from "@/plugins/gameplay/Achievements";
import LevelUp from "@/plugins/gameplay/LevelUp";
import AIChat from "@/plugins/aicore/AIChat";
import Wheel from "@/plugins/gameplay/Wheel";
import Boosters from "@/plugins/gameplay/Boosters";

interface GameGUIProps {
  gameState: {
    activePlugin: string;
    showAdminMenu: boolean;
    [key: string]: any;
  };
  onStateChange: (updates: any) => void;
  playerData?: {
    id: string;
    name: string;
    level: number;
    lp: number;
    lpPerHour: number;
    energy: number;
    maxEnergy: number;
    coins: number;
    xp: number;
    xpToNext: number;
    avatar?: string;
    activeBoosters?: { name: string }[];
    isVIP?: boolean;
    [key: string]: any;
  };
  onPlayerAction?: (action: string, data?: any) => void;
  onTap?: () => void;
  onAdminToggle?: () => void;
}

export default function GameGUI({
  gameState,
  onStateChange,
  playerData,
  onPlayerAction,
  onTap,
  onAdminToggle,
}: GameGUIProps) {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState(gameState.activePlugin || "upgrades");

  const handleTabChange = (tabId: string) => {
    setActiveBottomTab(tabId);
    onStateChange?.({ activePlugin: tabId });
  };

  const handlePlayerAction = (action: string, data?: any) => {
    onPlayerAction?.(action, data);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-2), message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const energyPercentage = playerData ? (playerData.energy / playerData.maxEnergy) * 100 : 0;
  const xpPercentage = playerData ? (playerData.xp / playerData.xpToNext) * 100 : 0;

  return (
    <div className="game-gui-container">
      <style>{`
        .game-gui-container {
          display: grid;
          grid-template-areas:
            "top-left top-middle top-right"
            "under-top under-top under-top"
            "middle middle right"
            "bottom bottom bottom";
          grid-template-rows: 80px 40px 1fr 280px;
          grid-template-columns: 280px 1fr 320px;
          height: 100vh;
          width: 100vw;
          gap: 8px;
          padding: 8px;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #000000 100%);
        }
        .gui-zone {
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .top-left { grid-area: top-left; background: rgba(0,0,0,0.4); }
        .top-middle { grid-area: top-middle; background: rgba(30,27,75,0.6); }
        .top-right { grid-area: top-right; background: rgba(0,0,0,0.4); }
        .under-top { grid-area: under-top; background: rgba(49,46,129,0.3); }
        .middle { grid-area: middle; background: rgba(0,0,0,0.2); border: 2px solid rgba(139,92,246,0.5); }
        .right { grid-area: right; background: rgba(0,0,0,0.4); }
        .bottom { grid-area: bottom; background: rgba(0,0,0,0.6); }
        .tap-area { cursor: pointer; transition: all 0.2s ease; user-select: none; }
        .tap-area:hover { transform: scale(1.02); filter: brightness(1.1); }
        .tap-area:active { transform: scale(0.98); filter: brightness(1.3); }
        .notification-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(139,92,246,0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          z-index: 1000;
          animation: popupFade 2s ease-out;
        }
        @keyframes popupFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `}</style>

      {/* TOP LEFT */}
      <div className="top-left gui-zone">
        <Card className="h-full bg-transparent border-0">
          <CardContent className="p-3 h-full flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer"
              onClick={() => handlePlayerAction('openProfile')}
            >
              {playerData?.avatar ? (
                <img src={playerData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : playerData?.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div className="flex-1 text-white">
              <div className="font-bold text-sm">{playerData?.name || "Player"}</div>
              <div className="text-xs opacity-75">Level {playerData?.level || 1}</div>
              <Progress value={xpPercentage} className="h-1 mt-1 bg-gray-700" />
            </div>
            <Button variant="ghost" size="sm" onClick={onAdminToggle} className="p-2 text-purple-300 hover:text-white hover:bg-purple-600/20">
              <Settings className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* TOP MIDDLE */}
      <div className="top-middle gui-zone tap-area" onClick={onTap}>
        <Card className="h-full bg-transparent border-0">
          <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center text-white">
            <div className="text-3xl font-bold text-purple-300">{(playerData?.lp || 0).toLocaleString()}</div>
            <div className="text-sm opacity-75">Lust Points</div>
            <div className="text-xs mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {(playerData?.lpPerHour || 0).toLocaleString()}/hour
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOP RIGHT */}
      <div className="top-right gui-zone">
        <Card className="h-full bg-transparent border-0">
          <CardContent className="p-3 h-full grid grid-cols-2 gap-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold text-blue-400">{playerData?.energy || 0}</div>
              <div className="text-xs opacity-75">Energy</div>
              <Progress value={energyPercentage} className="h-1 mt-1 bg-gray-700" />
            </div>
            <div className="text-center text-white">
              <div className="text-lg font-bold text-yellow-400">{(playerData?.coins || 0).toLocaleString()}</div>
              <div className="text-xs opacity-75">Coins</div>
            </div>
            <div className="col-span-2 flex gap-1 justify-center">
              {playerData?.activeBoosters?.map((b, i) => (
                <Badge key={i} variant="outline" className="text-xs text-purple-300 border-purple-500">
                  <Star className="w-3 h-3 mr-1" />
                  {b.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UNDER TOP */}
      <div className="under-top gui-zone flex items-center px-4">
        <NewsTicker />
      </div>

      {/* MIDDLE */}
      <div className="middle gui-zone tap-area" onClick={onTap}>
        <div className="h-full relative">
          <CharacterDisplay user={playerData} onTap={onTap} />
          {notifications.map((msg, idx) => <div key={idx} className="notification-popup">{msg}</div>)}
        </div>
      </div>

      {/* RIGHT */}
      <div className="right gui-zone h-full p-3 space-y-3 overflow-y-auto">
        <Wheel playerId={playerData?.id || "player1"} isVIP={!!playerData?.isVIP} isEventActive={true} />
        <Card className="bg-blue-900/30 border-blue-500/30">
          <CardHeader className="p-2"><CardTitle className="text-sm text-white">Active Boosters</CardTitle></CardHeader>
          <CardContent className="p-2"><Boosters onBoosterActivate={b => addNotification(`${b} activated!`)} /></CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-500/30">
          <CardHeader className="p-2"><CardTitle className="text-sm text-white">Quick Actions</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-2">
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handlePlayerAction('collectOffline')}>Collect Offline LP</Button>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handlePlayerAction('openCharacterCreation')}>Create Character</Button>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM */}
      <div className="bottom gui-zone">
        <Tabs value={activeBottomTab} onValueChange={handleTabChange} className="h-full">
          <TabsList className="w-full bg-black/50 rounded-t-lg border-b border-purple-500/30">
            <TabsTrigger value="upgrades" className="text-white data-[state=active]:bg-purple-600">Upgrades</TabsTrigger>
            <TabsTrigger value="levelup" className="text-white data-[state=active]:bg-purple-600">Level Up</TabsTrigger>
            <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-purple-600">Tasks</TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-purple-600">Achievements</TabsTrigger>
            <TabsTrigger value="chat" className="text-white data-[state=active]:bg-purple-600">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="upgrades" className="h-full p-4 overflow-y-auto">
            <Upgrades onUpgrade={(u,c) => { handlePlayerAction('purchaseUpgrade',{upgrade:u,cost:c}); addNotification(`Upgraded ${u}!`); }} />
          </TabsContent>
          <TabsContent value="levelup" className="h-full p-4 overflow-y-auto">
            <LevelUp onLevelUp={() => { handlePlayerAction('levelUp'); addNotification('Level Up!'); }} />
          </TabsContent>
          <TabsContent value="tasks" className="h-full p-4 overflow-y-auto">
            <Tasks onTaskComplete={t => { handlePlayerAction('completeTask', t); addNotification(`Task completed: ${t.name}`); }} />
          </TabsContent>
          <TabsContent value="achievements" className="h-full p-4 overflow-y-auto">
            <Achievements onAchievementUnlock={a => addNotification(`Achievement unlocked: ${a.name}!`)} />
          </TabsContent>
          <TabsContent value="chat" className="h-full p-4 overflow-y-auto">
            <AIChat onMessage={m => handlePlayerAction('sendChatMessage', m)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}