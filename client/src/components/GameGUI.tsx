import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  Star, 
  Settings, 
  Heart, 
  Coins, 
  Gem, 
  TrendingUp, 
  MessageCircle,
  Trophy,
  Target,
  Activity
} from "lucide-react";
import CharacterDisplay from "@/components/CharacterDisplay";
import AdminMenu from "@/plugins/admin/AdminMenu";
import AIChat from "@/plugins/aicore/AIChat";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Upgrades from "@/plugins/gameplay/Upgrades";
//import { AdminUIToggler } from './debugger/modules/adminUI';


// Mock Data
const mockTasks = [
  { id: "t1", icon: "⭐", title: "Login Daily", description: "Log in to the game every day.", status: "completed", progress: 1, maxProgress: 1, reward: "10 Coins", category: "basic" },
  { id: "t2", icon: "⚡", title: "Gain 100 Energy", description: "Reach 100 energy points.", status: "active", progress: 75, maxProgress: 100, reward: "5 Gems", category: "energy" },
  { id: "t3", icon: "⬆️", title: "Level Up", description: "Reach level 5.", status: "in_progress", progress: 3, maxProgress: 5, reward: "20 Coins", category: "progression" },
  { id: "t4", icon: "💬", title: "Send a Message", description: "Send a message in the chat.", status: "completed", progress: 1, maxProgress: 1, reward: "5 Coins", category: "basic" },
];

const mockAchievements = [
  { id: "a1", icon: "🏆", title: "First Steps", description: "Complete your first task.", status: "completed", progress: 1, maxProgress: 1, reward: "5 Coins", category: "beginner" },
  { id: "a2", icon: "💖", title: "Chat Enthusiast", description: "Send 10 messages.", status: "in_progress", progress: 7, maxProgress: 10, reward: "10 Coins", category: "interaction" },
  { id: "a3", icon: "🚀", title: "Rising Star", description: "Reach level 10.", status: "locked", progress: 5, maxProgress: 10, reward: "50 Coins", category: "progression" },
  { id: "a4", icon: "💎", title: "Gem Hoarder", description: "Collect 100 Gems.", status: "locked", progress: 40, maxProgress: 100, reward: "1 Gem Package", category: "collection" },
];

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
  lustGems?: number;
  xp: number;
  xpToNext: number;
  avatar?: string;
  activeBoosters?: Array<{ name: string }>;
  isVip?: boolean;
  [key: string]: any;
}

interface GameGUIProps {
  playerData?: PlayerData;
  onPluginAction: (action: string, data?: any) => void;
  onPluginChange?: (plugin: string) => void;
}

interface GUIState {
  activePlugin: string;
  showAdminMenu: boolean;
}

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {
  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showAdminMenu: false,
  });

  console.log("GameGUI rendering, activePlugin:", guiState.activePlugin);

  const [isTapping, setIsTapping] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [achievementFilter, setAchievementFilter] = useState("all");

  const updateGUIState = (updates: Partial<GUIState>) => {
    setGUIState(prev => ({ ...prev, ...updates }));
  };

  const handleTap = async () => {
    if (!playerData || playerData.energy <= 0 || isTapping) return;
    setIsTapping(true);
    onPluginAction('tap');
    setTimeout(() => setIsTapping(false), 200);
  };

  const claimReward = (id: string, type: 'task' | 'achievement') => {
    console.log(`Claiming ${type} reward:`, id);
    // Handle reward claiming logic
  };

  // Tasks Component (No nested tabs)
  const TasksComponent = () => {
    const filteredTasks = taskFilter === "all" ? mockTasks : mockTasks.filter(task => task.category === taskFilter);

    return (
      <div className="w-full max-w-2xl h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black/30 border-b border-purple-500/30 rounded-t-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Daily Tasks</h3>
              <p className="text-sm text-gray-400">Complete tasks to earn rewards</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {["all", "basic", "energy", "progression"].map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={taskFilter === filter ? "default" : "outline"}
                onClick={() => setTaskFilter(filter)}
                className={`${
                  taskFilter === filter
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-transparent border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="bg-gray-800/50 border-gray-600/50 hover:border-purple-500/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{task.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                          <p className="text-xs text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{task.progress}/{task.maxProgress}</span>
                      </div>
                      <Progress value={(task.progress / task.maxProgress) * 100} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-green-400">Reward: {task.reward}</span>
                      <Button
                        size="sm"
                        disabled={task.status !== 'completed'}
                        onClick={() => claimReward(task.id, 'task')}
                        className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1"
                      >
                        {task.status === 'completed' ? 'Claim' : 'In Progress'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Achievements Component (No nested tabs)
  const AchievementsComponent = () => {
    const filteredAchievements = achievementFilter === "all" ? mockAchievements : mockAchievements.filter(achievement => achievement.category === achievementFilter);

    return (
      <div className="w-full max-w-2xl h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black/30 border-b border-yellow-500/30 rounded-t-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-sm text-gray-400">Unlock achievements for rewards</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {["all", "beginner", "interaction", "progression", "collection"].map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={achievementFilter === filter ? "default" : "outline"}
                onClick={() => setAchievementFilter(filter)}
                className={`${
                  achievementFilter === filter
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-transparent border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/20"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} className="bg-gray-800/50 border-gray-600/50 hover:border-yellow-500/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{achievement.title}</h3>
                          <p className="text-xs text-gray-400">{achievement.description}</p>
                        </div>
                      </div>
                      <Badge variant={achievement.status === 'completed' ? 'default' : achievement.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {achievement.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-green-400">Reward: {achievement.reward}</span>
                      <Button
                        size="sm"
                        disabled={achievement.status !== 'completed'}
                        onClick={() => claimReward(achievement.id, 'achievement')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
                      >
                        {achievement.status === 'completed' ? 'Claim' : achievement.status === 'in_progress' ? 'In Progress' : 'Locked'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Main render function for active plugin
  const renderActivePlugin = () => {
    switch (guiState.activePlugin) {
      case "main":
        return (
          <div className="max-w-sm w-full">
            <CharacterDisplay
              character={{
                id: "seraphina",
                name: "Seraphina",
                personality: "playful",
                backstory: "Tap to interact with Seraphina!",
                mood: "flirty",
                level: 1,
                isNsfw: false,
                isVip: false,
                levelRequirement: 1,
                customTriggers: [],
                createdAt: new Date(),
              }}
              user={{
                ...playerData,
                id: playerData?.id || 'default-player',
                username: playerData?.name || 'Player',
                password: '',
                level: playerData?.level || 1,
                lp: playerData?.lp || 1000,
                lpPerHour: playerData?.lpPerHour || 250,
                lpPerTap: playerData?.lpPerTap || 1,
                energy: playerData?.energy || 1000,
                maxEnergy: playerData?.maxEnergy || 1000,
                charisma: playerData?.charismaPoints || 0,
                vipStatus: playerData?.isVip || false,
                nsfwConsent: playerData?.nsfwEnabled || false,
                lastTick: new Date(playerData?.lastTickTimestamp || Date.now()),
                createdAt: new Date()
              } as any}
              onTap={handleTap}
              isTapping={isTapping}
            />
          </div>
        );

      case "levelup":
        return <LevelUp />;

      case "upgrades":
        return (
          <div className="w-full max-w-2xl">
            <Upgrades
              playerData={playerData}
              onUpgradeAction={onPluginAction}
            />
          </div>
        );

      case "tasks":
        return (
          <div className="w-full max-w-2xl h-full flex flex-col">
            {/* Combined Header */}
            <div className="p-4 bg-black/30 border-b border-purple-500/30 rounded-t-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Tasks & Achievements</h3>
                  <p className="text-sm text-gray-400">Complete tasks and unlock achievements</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={taskFilter === "tasks" ? "default" : "outline"}
                  onClick={() => setTaskFilter("tasks")}
                  className={`${
                    taskFilter === "tasks"
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-transparent border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
                  }`}
                >
                  <Target className="w-4 h-4 mr-1" />
                  Tasks
                </Button>
                <Button
                  size="sm"
                  variant={taskFilter === "achievements" ? "default" : "outline"}
                  onClick={() => setTaskFilter("achievements")}
                  className={`${
                    taskFilter === "achievements"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-transparent border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/20"
                  }`}
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Achievements
                </Button>
              </div>

              {/* Sub-filters */}
              {taskFilter === "tasks" && (
                <div className="flex gap-2 flex-wrap">
                  {["all", "basic", "energy", "progression"].map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={achievementFilter === filter ? "default" : "ghost"}
                      onClick={() => setAchievementFilter(filter)}
                      className={`text-xs ${
                        achievementFilter === filter
                          ? "bg-purple-500 text-white"
                          : "text-purple-300 hover:bg-purple-600/20"
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              )}

              {taskFilter === "achievements" && (
                <div className="flex gap-2 flex-wrap">
                  {["all", "beginner", "interaction", "progression", "collection"].map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={achievementFilter === filter ? "default" : "ghost"}
                      onClick={() => setAchievementFilter(filter)}
                      className={`text-xs ${
                        achievementFilter === filter
                          ? "bg-yellow-500 text-white"
                          : "text-yellow-300 hover:bg-yellow-600/20"
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {taskFilter === "tasks" ? (
                    // Tasks
                    (achievementFilter === "all" ? mockTasks : mockTasks.filter(task => task.category === achievementFilter)).map((task) => (
                      <Card key={task.id} className="bg-gray-800/50 border-gray-600/50 hover:border-purple-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{task.icon}</span>
                              <div>
                                <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                                <p className="text-xs text-gray-400">{task.description}</p>
                              </div>
                            </div>
                            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{task.progress}/{task.maxProgress}</span>
                            </div>
                            <Progress value={(task.progress / task.maxProgress) * 100} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-green-400">Reward: {task.reward}</span>
                            <Button
                              size="sm"
                              disabled={task.status !== 'completed'}
                              onClick={() => claimReward(task.id, 'task')}
                              className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1"
                            >
                              {task.status === 'completed' ? 'Claim' : 'In Progress'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Achievements
                    (achievementFilter === "all" ? mockAchievements : mockAchievements.filter(achievement => achievement.category === achievementFilter)).map((achievement) => (
                      <Card key={achievement.id} className="bg-gray-800/50 border-gray-600/50 hover:border-yellow-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{achievement.icon}</span>
                              <div>
                                <h3 className="font-semibold text-white text-sm">{achievement.title}</h3>
                                <p className="text-xs text-gray-400">{achievement.description}</p>
                              </div>
                            </div>
                            <Badge variant={achievement.status === 'completed' ? 'default' : achievement.status === 'in_progress' ? 'secondary' : 'outline'}>
                              {achievement.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-green-400">Reward: {achievement.reward}</span>
                            <Button
                              size="sm"
                              disabled={achievement.status !== 'completed'}
                              onClick={() => claimReward(achievement.id, 'achievement')}
                              className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
                            >
                              {achievement.status === 'completed' ? 'Claim' : achievement.status === 'in_progress' ? 'In Progress' : 'Locked'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="w-full max-w-2xl h-full">
            <AIChat userId={playerData?.id || 'default-player'} />
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-400">
            <p>Select a section from the bottom navigation</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white overflow-hidden">

      {/* Status Bar */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs">{playerData?.name?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{playerData?.name || "Player"}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Lv. {playerData?.level || 1}</span>
                <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-1 w-20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xs">{playerData?.lp || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-bold text-xs">{playerData?.lpPerHour || 0}/h</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Gem className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 font-bold text-xs">{playerData?.lustGems || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold text-xs">
                {playerData?.energy || 0}/{playerData?.maxEnergy || 1000}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex items-center justify-center p-3 pb-20">
        {renderActivePlugin()}
      </div>

      {/* Bottom Navigation - NO NESTED TABS */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/90 to-red-900/90 border-t border-pink-500/30 backdrop-blur-sm z-40">
        <div className="flex justify-around items-center p-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
              guiState.activePlugin === "main" ? "bg-pink-600/30" : ""
            }`}
            onClick={() => updateGUIState({ activePlugin: "main" })}
          >
            <Heart className="w-4 h-4" />
            <span className="text-xs">Main</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
              guiState.activePlugin === "levelup" ? "bg-pink-600/30" : ""
            }`}
            onClick={() => updateGUIState({ activePlugin: "levelup" })}
          >
            <Star className="w-4 h-4" />
            <span className="text-xs">Level Up</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
              guiState.activePlugin === "upgrades" ? "bg-pink-600/30" : ""
            }`}
            onClick={() => updateGUIState({ activePlugin: "upgrades" })}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Upgrades</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
              guiState.activePlugin === "tasks" ? "bg-pink-600/30" : ""
            }`}
            onClick={() => updateGUIState({ activePlugin: "tasks" })}
          >
            <Activity className="w-4 h-4" />
            <span className="text-xs">Tasks</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
              guiState.activePlugin === "chat" ? "bg-pink-600/30" : ""
            }`}
            onClick={() => updateGUIState({ activePlugin: "chat" })}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Chat</span>
          </Button>
        </div>
      </div>

      {/* Floating Admin Button */}
      <Button
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-600/50"
        onClick={() => updateGUIState({ showAdminMenu: true })}
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Admin Menu Modal */}
      {guiState.showAdminMenu && (
        <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
      )}
    </div>
  );
}


/**  Admin Debugger UI Menu Modal 

    
      const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Open Admin UI"
        className="fixed bottom-4 right-4 bg-blue-600 p-3 rounded-full shadow-lg text-white hover:bg-blue-700 z-50"
      >
        <Bug className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-5/6 h-5/6 overflow-auto p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500"
            >✕</button>
            <AdminUI />
          </div>
        </div>
      )}
    </>
  );
}
*/