import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Star, Settings, Send, Heart, Coins, Gem } from "lucide-react";
import { MessageCircle } from "lucide-react";
import CharacterDisplay from "@/components/CharacterDisplay";
import NewsTicker from "@/components/NewsTicker";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import CharacterGallery from "@/components/CharacterGallery";
// Admin Plugins
import AdminMenu from "@/plugins/admin/AdminMenu";
// AI Core Plugins
import AIChat from "@/plugins/aicore/AIChat";
import MistralDebugger from "@/plugins/aicore/MistralDebugger";
// Gameplay Plugins
import Upgrades from "@/plugins/gameplay/Upgrades";
import Task from "@/plugins/gameplay/Task";
import Achievements from "@/plugins/gameplay/Achievements";
import Boosters from "@/plugins/gameplay/Boosters";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Wheel from "@/plugins/gameplay/Wheel";
// Manager Plugins
import FileManagerCore from "@/plugins/manager/FileManagerCore";
import ImageManager from "@/plugins/manager/ImageManager";
// Mock Data (replace with actual data fetching)
const mockTask = [
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
  { id: "a5", icon: "🤝", title: "Social Butterfly", description: "Interact with 5 different characters.", status: "in_progress", progress: 3, maxProgress: 5, reward: "15 Coins", category: "interaction" },
];
// Function to simulate claiming a task reward
const claimTaskReward = (taskId: string) => {
  console.log(`Claiming reward for task: ${taskId}`);
  // In a real app, you would update the backend and refetch data
};
// Function to simulate claiming an achievement reward
const claimAchievementReward = (achievementId: string) => {
  console.log(`Claiming reward for achievement: ${achievementId}`);
  // In a real app, you would update the backend and refetch data
};
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
  showDebugger: boolean;
  showImageManager: boolean;
  showFileManager: boolean;
  showCharacterCreation: boolean;
  showCharacterEditor: boolean;
  showBoosterMenu: boolean;
  showAICustomFunctions: boolean;
  showEnhancedChat: boolean;
  showAdminMenu: boolean;
  selectedCharacter: any | null;
}
export default function GameGUI({ playerData, onPluginAction, onPluginChange }: GameGUIProps) {
  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showDebugger: false,
    showImageManager: false,
    showFileManager: false,
    showCharacterCreation: false,
    showCharacterEditor: false,
    showBoosterMenu: false,
    showAICustomFunctions: false,
    showEnhancedChat: false,
    showAdminMenu: false,
    selectedCharacter: null,
  });
  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      content: "Hello! I'm happy to chat with you!",
      sender: 'character' as const,
      timestamp: new Date(),
      mood: 'happy'
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTapping, setIsTapping] = useState(false);
  const updateGUIState = (updates: Partial<GUIState>) => {
    setGUIState(prev => ({ ...prev, ...updates }));
  };
  const handleTap = async () => {
    if (!playerData || playerData.energy <= 0 || isTapping) return;
    setIsTapping(true);
    onPluginAction('tap');
    setTimeout(() => setIsTapping(false), 200);
  };
  const handleClaimPrize = (type: 'task' | 'achievements') => {
    // Handle prize claiming logic here
    console.log(`Claiming ${type} prize`);
  };
  // Task Component with inline UI
  const TasksGUI = ({ onClaimPrize }: { onClaimPrize: () => void }) => {
    const [activeTab, setActiveTab] = useState("all");
    const filteredTask = activeTab === "all" ? mockTask : mockTask.filter(task => task.category === activeTab);

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black/30 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Daily Tasks</h3>
              <p className="text-sm text-gray-400">Complete tasks to earn rewards</p>
            </div>
          </div>
        </div>

        {/* Task Tabs */}
        <div className="flex gap-2 p-4 bg-black/20">
          <Button 
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 rounded-full ${activeTab === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            All
          </Button>
          <Button 
            onClick={() => setActiveTab("basic")}
            className={`px-6 py-2 rounded-full ${activeTab === "basic" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Basic
          </Button>
          <Button 
            onClick={() => setActiveTab("energy")}
            className={`px-6 py-2 rounded-full ${activeTab === "energy" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Energy
          </Button>
          <Button 
            onClick={() => setActiveTab("progression")}
            className={`px-6 py-2 rounded-full ${activeTab === "progression" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Progress
          </Button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {filteredTask.map((task) => (
                <Card key={task.id} className="bg-gray-700/50 border-gray-600/50 hover:border-purple-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{task.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <p className="text-sm text-gray-300">{task.description}</p>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : task.status === 'active' ? 'secondary' : 'outline'}>
                        {task.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{task.progress}/{task.maxProgress}</span>
                      </div>
                      <Progress value={(task.progress / task.maxProgress) * 100} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-green-400">Reward: {task.reward}</span>
                      <Button
                        size="sm"
                        disabled={task.status !== 'completed'}
                        onClick={() => {
                          claimTaskReward(task.id);
                          onClaimPrize();
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {task.status === 'completed' ? 'Claim' : 'In Progress'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTask.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks available in this category</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Achievements Component with inline UI
  const AchievementsGUI = ({ onClaimPrize }: { onClaimPrize: () => void }) => {
    const [activeTab, setActiveTab] = useState("all");
    const filteredAchievements = activeTab === "all" ? mockAchievements : mockAchievements.filter(achievements => achievements.category === activeTab);

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black/30 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-sm text-gray-400">Unlock achievements to earn rewards</p>
            </div>
          </div>
        </div>

        {/* Achievement Tabs */}
        <div className="flex gap-2 p-4 bg-black/20 overflow-x-auto">
          <Button 
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            All
          </Button>
          <Button 
            onClick={() => setActiveTab("beginner")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === "beginner" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Beginner
          </Button>
          <Button 
            onClick={() => setActiveTab("interaction")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === "interaction" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Interaction
          </Button>
          <Button 
            onClick={() => setActiveTab("progression")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === "progression" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Progress
          </Button>
          <Button 
            onClick={() => setActiveTab("collection")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === "collection" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"}`}
          >
            Collection
          </Button>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {filteredAchievements.map((achievements) => (
                <Card key={achievements.id} className="bg-gray-700/50 border-gray-600/50 hover:border-purple-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievements.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{achievements.title}</h3>
                          <p className="text-sm text-gray-300">{achievements.description}</p>
                        </div>
                      </div>
                      <Badge variant={achievements.status === 'completed' ? 'default' : achievements.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {achievements.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievements.progress}/{achievements.maxProgress}</span>
                      </div>
                      <Progress value={(achievements.progress / achievements.maxProgress) * 100} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-green-400">Reward: {achievements.reward}</span>
                      <Button
                        size="sm"
                        disabled={achievements.status !== 'completed'}
                        onClick={() => {
                          claimAchievementReward(achievements.id);
                          onClaimPrize();
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {achievements.status === 'completed' ? 'Claim' : achievements.status === 'in_progress' ? 'In Progress' : 'Locked'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredAchievements.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No achievements available in this category</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };
  // Main Content Area - Plugin or Character Display
  const renderActivePlugin = () => {
    if (guiState.activePlugin === "main") {
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
              lp: playerData?.lp || 0,
              lpPerHour: playerData?.lpPerHour || 0,
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
    } else if (guiState.activePlugin === "levelup") {
      return (
        <LevelUp />
      );
    } else if (guiState.activePlugin === "upgrades") {
      return (
        <div className="w-full max-w-2xl">
          <Tabs defaultValue="lpPerHour" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/20">
              <TabsTrigger value="lpPerHour">LP per Hour</TabsTrigger>
              <TabsTrigger value="energy">Energy Gain</TabsTrigger>
              <TabsTrigger value="lpPerTap">LP per Tap</TabsTrigger>
            </TabsList>
            <TabsContent value="lpPerHour">
              <Upgrades
                playerData={playerData}
                onUpgradeAction={onPluginAction}
              />
            </TabsContent>
            <TabsContent value="energy">
              <Upgrades
                playerData={playerData}
                onUpgradeAction={onPluginAction}
              />
            </TabsContent>
            <TabsContent value="lpPerTap">
              <Upgrades
                playerData={playerData}
                onUpgradeAction={onPluginAction}
              />
            </TabsContent>
          </Tabs>
        </div>
      );
    } else if (guiState.activePlugin === "task") {
      return (
        <div className="w-full max-w-2xl">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <TasksGUI onClaimPrize={() => handleClaimPrize('task')} />
            </TabsContent>
            <TabsContent value="achievements">
              <AchievementsGUI onClaimPrize={() => handleClaimPrize('achievements')} />
            </TabsContent>
          </Tabs>
        </div>
      );
    } else if (guiState.activePlugin === "aiChat") {
      return <AIChat userId={playerData?.id || 'default-player'} />;
    }
    return null; // Should not happen with current navigation
  };
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white overflow-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-center p-3 bg-gradient-to-r from-pink-900/50 to-red-900/50 border-b border-pink-500/30 flex-shrink-0">
        <h1 className="text-white text-xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">ClassikLust</h1>
      </div>
      {/* Status Bar */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
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
      <div className="h-full flex flex-col">
        {/* Main Content */}
        <div className="h-full flex items-center justify-center p-3">
          {renderActivePlugin()}
        </div>
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/90 to-red-900/90 border-t border-pink-500/30 p-1 backdrop-blur-sm">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
                guiState.activePlugin === "levelup" ? "bg-pink-600/30" : ""
              }`}
              onClick={() => updateGUIState({ activePlugin: "levelup" })}
            >
              <Star className="w-4 h-4" />
              <span className="text-xs">LevelUp</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
                guiState.activePlugin === "upgrades" ? "bg-pink-600/30" : ""
              }`}
              onClick={() => updateGUIState({ activePlugin: "upgrades" })}
            >
              <Star className="w-4 h-4" />
              <span className="text-xs">Upgrades</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
                guiState.activePlugin === "task" ? "bg-pink-600/30" : ""
              }`}
              onClick={() => updateGUIState({ activePlugin: "task" })}
            >
              <Zap className="w-4 h-4" />
              <span className="text-xs">Task</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
                guiState.activePlugin === "aiChat" ? "bg-pink-600/30" : ""
              }`}
              onClick={() => updateGUIState({ activePlugin: "aiChat" })}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">AI Chat</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2"
              onClick={() => updateGUIState({ showAdminMenu: true })}
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Admin</span>
            </Button>
          </div>
        </div>
        {/* Admin Menu */}
        {guiState.showAdminMenu && (
          <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
        )}
      </div>
    </div>
  );
}