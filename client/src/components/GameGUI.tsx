import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
// Auth is handled at App level
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
  Activity,
  RotateCcw,
  Crown
} from "lucide-react";
import CharacterDisplay from "@/components/CharacterDisplay";
import CharacterGallery from "@/components/CharacterGallery";
import OfflineIncomeDialog from "@/components/OfflineIncomeDialog";
import AdminMenu from "@/plugins/admin/AdminMenu";
import AIChat from "@/plugins/aicore/AIChat";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Upgrades from "@/plugins/gameplay/Upgrades";
import WheelGame from "@/components/wheel/WheelGame";
import VIP from "@/components/vip/VIP";
import { useGameState } from "@/hooks/use-game-state";
import { useGame } from "@/context/GameProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
//import { AdminUIToggler } from './debugger/modules/adminUI';


// Mock Data
const mockTasks = [
  { id: "t1", icon: "⭐", title: "Login Daily", description: "Log in to the game every day.", status: "completed", progress: 1, maxProgress: 1, reward: "100 LP", category: "basic" },
  { id: "t2", icon: "⚡", title: "Gain 100 Energy", description: "Reach 100 energy points.", status: "active", progress: 75, maxProgress: 100, reward: "75 LP", category: "energy" },
  { id: "t3", icon: "⬆️", title: "Level Up", description: "Reach level 5.", status: "in_progress", progress: 3, maxProgress: 5, reward: "250 LP", category: "progression" },
  { id: "t4", icon: "💬", title: "Send a Message", description: "Send a message in the chat.", status: "completed", progress: 1, maxProgress: 1, reward: "50 LP", category: "basic" },
];

const mockAchievements = [
  { id: "a1", icon: "🏆", title: "First Steps", description: "Complete your first task.", status: "completed", progress: 1, maxProgress: 1, reward: "100 LP", category: "beginner" },
  { id: "a2", icon: "💖", title: "Chat Enthusiast", description: "Send 10 messages.", status: "in_progress", progress: 7, maxProgress: 10, reward: "200 LP", category: "interaction" },
  { id: "a3", icon: "🚀", title: "Rising Star", description: "Reach level 10.", status: "locked", progress: 5, maxProgress: 10, reward: "500 LP", category: "progression" },
  { id: "a4", icon: "💎", title: "Lust Master", description: "Reach 10,000 LP total.", status: "locked", progress: 40, maxProgress: 100, reward: "1000 LP", category: "collection" },
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
  showCharacterGallery: boolean;
  showWheelGame: boolean;
  showVIP: boolean;
}

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {
  // Use auth context for consistent authentication
  const { userId: authUserId } = useAuth();
  const userId = authUserId || playerData?.id;
  const isAuthenticated = !!userId;
  
  // Use game state hook to get selected character
  const { user, character: selectedCharacter, stats, isLoading, tap, isTapping: gameStateTapping } = useGameState();
  
  // Use game provider for offline income
  const { playerData: gamePlayerData, claimOfflineIncome } = useGame();
  
  // Toast notifications
  const { toast } = useToast();

  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showAdminMenu: false,
    showCharacterGallery: false,
    showWheelGame: false,
    showVIP: false,
  });

  // Offline income dialog state
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  
  // Watch for offline income to become available
  React.useEffect(() => {
    if ((gamePlayerData?.pendingOfflineLP || 0) > 0 && !showOfflineDialog) {
      setShowOfflineDialog(true);
    }
  }, [gamePlayerData?.pendingOfflineLP, showOfflineDialog]);


  const [isTapping, setIsTapping] = useState(false);
  
  // Use game state tapping if available, otherwise use local state
  const actuallyTapping = gameStateTapping || isTapping;
  const [taskFilter, setTaskFilter] = useState("all");
  const [achievementFilter, setAchievementFilter] = useState("all");

  const updateGUIState = (updates: Partial<GUIState>) => {
    setGUIState(prev => ({ ...prev, ...updates }));
  };

  // Calculate progress percentages
  const calculateTasksProgress = () => {
    const completedTasks = mockTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / mockTasks.length) * 100);
  };

  const calculateAchievementsProgress = () => {
    const completedAchievements = mockAchievements.filter(achievement => achievement.status === 'completed').length;
    return Math.round((completedAchievements / mockAchievements.length) * 100);
  };

  // Milestone rewards
  const milestones = [
    { percent: 25, icon: "🎁", reward: "Bronze Chest", unlocked: false },
    { percent: 50, icon: "💎", reward: "Silver Chest", unlocked: false },
    { percent: 75, icon: "👑", reward: "Gold Chest", unlocked: false },
    { percent: 100, icon: "🏆", reward: "Master Chest", unlocked: false },
  ];

  // Progress Panel Component
  const ProgressPanel = ({ type, progress }: { type: 'tasks' | 'achievements', progress: number }) => {
    const isTask = type === 'tasks';
    const updatedMilestones = milestones.map(milestone => ({
      ...milestone,
      unlocked: progress >= milestone.percent
    }));

    // Use proper conditional classes instead of template literals
    const headerClasses = isTask 
      ? "relative p-4 bg-gradient-to-br from-purple-900/60 to-purple-800/40 border-2 border-purple-500/30 rounded-t-xl shadow-xl"
      : "relative p-4 bg-gradient-to-br from-yellow-900/60 to-yellow-800/40 border-2 border-yellow-500/30 rounded-t-xl shadow-xl";
    
    const titleClasses = isTask 
      ? "text-2xl font-bold text-purple-200 mb-1"
      : "text-2xl font-bold text-yellow-200 mb-1";
    
    const progressBarBorderClasses = isTask
      ? "mt-3 bg-black/40 rounded-full p-1 border border-purple-500/20"
      : "mt-3 bg-black/40 rounded-full p-1 border border-yellow-500/20";
      
    const progressBarClasses = isTask
      ? "h-2 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-700 shadow-lg"
      : "h-2 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700 shadow-lg";
      
    const contentClasses = isTask
      ? "flex-1 p-4 bg-gradient-to-b from-black/20 to-black/40 border-2 border-t-0 border-purple-500/30 rounded-b-xl shadow-xl backdrop-blur-sm"
      : "flex-1 p-4 bg-gradient-to-b from-black/20 to-black/40 border-2 border-t-0 border-yellow-500/30 rounded-b-xl shadow-xl backdrop-blur-sm";
      
    const sectionTitleClasses = isTask
      ? "text-sm font-semibold text-purple-300 mb-1"
      : "text-sm font-semibold text-yellow-300 mb-1";
      
    const nextMilestoneClasses = isTask
      ? "text-sm font-semibold text-purple-300"
      : "text-sm font-semibold text-yellow-300";

    return (
      <div className="w-72 h-full flex flex-col">
        {/* Decorative Frame Header */}
        <div className={headerClasses}>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-lg shadow-md"></div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full"></div>
          
          <div className="text-center">
            <div className={titleClasses}>
              {progress}%
            </div>
            <div className="text-xs text-gray-300 uppercase tracking-wide">
              {type === 'tasks' ? 'Tasks Complete' : 'Achievements Unlocked'}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className={progressBarBorderClasses}>
            <div 
              className={progressBarClasses}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Milestone Chests */}
        <div className={contentClasses}>
          <div className="text-center mb-4">
            <div className={sectionTitleClasses}>Milestone Rewards</div>
            <div className="text-xs text-gray-400">Unlock chests as you progress</div>
          </div>
          
          <div className="space-y-3">
            {updatedMilestones.map((milestone, index) => {
              const itemClasses = milestone.unlocked 
                ? (isTask 
                  ? "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gradient-to-r from-purple-900/40 to-purple-800/20 border-purple-400/50 shadow-lg"
                  : "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-yellow-400/50 shadow-lg")
                : 'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gray-900/30 border-gray-700/30';
                
              const rewardTextClasses = milestone.unlocked 
                ? (isTask ? "text-sm font-semibold text-purple-200" : "text-sm font-semibold text-yellow-200")
                : 'text-sm font-semibold text-gray-500';
                
              const indicatorClasses = isTask
                ? "w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg"
                : "w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg";
                
              return (
                <div key={index} className={itemClasses}>
                  <div className={`text-2xl transition-all duration-300 ${
                    milestone.unlocked ? 'animate-pulse' : 'grayscale opacity-50'
                  }`}>
                    {milestone.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className={rewardTextClasses}>
                      {milestone.reward}
                    </div>
                    <div className="text-xs text-gray-400">
                      {milestone.percent}% Complete
                    </div>
                  </div>
                  
                  {milestone.unlocked && (
                    <div className={indicatorClasses}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Milestone */}
          {progress < 100 && (
            <div className="mt-4 p-3 bg-black/30 rounded-lg border border-gray-600/30">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Next Milestone</div>
                <div className={nextMilestoneClasses}>
                  {updatedMilestones.find(m => !m.unlocked)?.percent || 100}% 
                  ({(updatedMilestones.find(m => !m.unlocked)?.percent || 100) - progress}% to go)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTap = async () => {
    if (!user || user.energy <= 0 || actuallyTapping) return;
    setIsTapping(true);
    
    try {
      // Use game state tap function if available, otherwise use API directly
      if (tap) {
        tap();
      } else {
        const response = await apiRequest('POST', `/api/player/${userId}/tap`);
        // REMOVED - Was causing API cascade spam after every tap
      }
    } catch (error) {
      console.error('Tap error:', error);
    }
    
    setTimeout(() => setIsTapping(false), 200);
  };

  // Prevent spam clicking
  const [claimingRewards, setClaimingRewards] = useState<Set<string>>(new Set());
  
  const claimReward = async (id: string, type: 'task' | 'achievement') => {
    // Prevent multiple claims of the same reward
    if (claimingRewards.has(id)) return;
    
    setClaimingRewards(prev => new Set(prev).add(id));
    
    try {
      console.log(`Claiming ${type} reward:`, id);
      
      const response = await apiRequest('POST', `/api/rewards/claim`, {
        rewardId: id,
        rewardType: type,
        userId: userId || playerData?.id
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Reward Claimed!",
          description: `${result.reward} added to your account`,
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      } else {
        throw new Error('Failed to claim reward');
      }
    } catch (error) {
      console.error(`Error claiming ${type} reward:`, error);
      toast({
        title: "Claim Failed",
        description: `Unable to claim ${type} reward. Please try again.`,
        variant: "destructive",
      });
    } finally {
      // Remove from claiming set after a short delay
      setTimeout(() => {
        setClaimingRewards(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 1000);
    }
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
                        disabled={task.status !== 'completed' || claimingRewards.has(task.id)}
                        onClick={() => claimReward(task.id, 'task')}
                        className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1"
                      >
                        {claimingRewards.has(task.id) ? 'Claiming...' : 
                         task.status === 'completed' ? 'Claim' : 'In Progress'}
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

  // Achievements Component with Leveled System
  const AchievementsComponent = () => {
    const { data: achievements = [], isLoading } = useQuery({
      queryKey: ['/api/admin/achievements'],
    });

    const filteredAchievements = achievementFilter === "all" ? achievements : achievements.filter(achievement => achievement.category === achievementFilter);

    return (
      <div className="w-full max-w-2xl h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black/30 border-b border-yellow-500/30 rounded-t-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-sm text-gray-400">Track your progress and unlock rewards</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{filteredAchievements.filter(a => a.completed).length}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {["all", "tapping", "chatting", "progression", "interaction"].map((filter) => (
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
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-400">Loading achievements...</div>
                </div>
              ) : filteredAchievements.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-400">No achievements available</div>
                </div>
              ) : (
                filteredAchievements.map((achievement) => {
                  const currentLevel = achievement.currentLevel || 1;
                  const maxLevel = achievement.maxLevel || 10;
                  const progress = achievement.progress || 0;
                  const levels = achievement.levels || [];
                  
                  const currentLevelData = levels.find(l => l.level === currentLevel);
                  const nextLevelData = levels.find(l => l.level === currentLevel + 1);
                  const target = currentLevelData?.target || 0;
                  const nextTarget = nextLevelData?.target || target;
                  const reward = currentLevelData?.reward || { type: 'lp', amount: 0 };
                  
                  const isCompleted = currentLevel >= maxLevel;
                  const isReadyToClaim = progress >= target && !isCompleted;

                  return (
                    <Card key={achievement.id} className="bg-gray-800/50 border-gray-600/50 hover:border-yellow-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{achievement.icon || '🏆'}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white text-sm">{achievement.name}</h3>
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                                  Level {currentLevel}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400">{achievement.description}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-300">Progress</div>
                            <div className="text-sm font-bold text-white">{currentLevel}/{maxLevel}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-300">Current Level: {target.toLocaleString()}</span>
                            <span className="text-white font-mono">{progress.toLocaleString()}/{target.toLocaleString()}</span>
                          </div>
                          <Progress value={(progress / target) * 100} className="h-2" />
                          
                          {nextLevelData && !isCompleted && (
                            <div className="text-xs text-gray-400">
                              Next Level: {nextTarget.toLocaleString()} ({nextLevelData.reward.amount} {nextLevelData.reward.type.toUpperCase()})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-green-400">
                            Reward: {reward.amount} {reward.type.toUpperCase()}
                          </span>
                          <Button
                            size="sm"
                            disabled={!isReadyToClaim || claimingRewards.has(achievement.id)}
                            onClick={() => claimReward(achievement.id, 'achievement')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1 disabled:opacity-50"
                          >
                            {claimingRewards.has(achievement.id) ? 'Claiming...' : 
                             isCompleted ? 'Completed' :
                             isReadyToClaim ? 'Claim' : 
                             'In Progress'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
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
              character={selectedCharacter} // Use selected character from game state
              user={{
                ...playerData,
                id: playerData?.id || userId || '',
                username: playerData?.username || playerData?.name || 'Player',
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
                createdAt: new Date(),
                ...(user || {}) // Override with user data if available
              } as any}
              onTap={handleTap}
              onAvatarClick={() => {
                console.log('Avatar clicked, opening gallery');
                updateGUIState({ showCharacterGallery: true });
              }}
              isTapping={actuallyTapping}
              lpPerTap={playerData?.lpPerTap || 1}
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
        const tasksProgress = calculateTasksProgress();
        const achievementsProgress = calculateAchievementsProgress();
        
        return (
          <div className="w-full h-full flex gap-6 p-4">
            {/* Main Content */}
            <div className="flex-1 h-full flex flex-col max-w-2xl">
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
                                disabled={task.status !== 'completed' || claimingRewards.has(task.id)}
                                onClick={() => claimReward(task.id, 'task')}
                                className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1"
                              >
                                {claimingRewards.has(task.id) ? 'Claiming...' : task.status === 'completed' ? 'Claim' : 'In Progress'}
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
                                disabled={achievement.status !== 'completed' || claimingRewards.has(achievement.id)}
                                onClick={() => claimReward(achievement.id, 'achievement')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
                              >
                                {claimingRewards.has(achievement.id) ? 'Claiming...' : achievement.status === 'completed' ? 'Claim' : achievement.status === 'in_progress' ? 'In Progress' : 'Locked'}
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

            {/* Progress Panel */}
            <ProgressPanel 
              type={taskFilter as 'tasks' | 'achievements'} 
              progress={taskFilter === 'tasks' ? tasksProgress : achievementsProgress}
            />
          </div>
        );

      case "chat":
        return (
          <div className="w-full max-w-2xl h-full">
            {isAuthenticated ? (
              <AIChat userId={userId || playerData?.id} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Please log in to use chat</p>
              </div>
            )}
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

  // Handle offline income claim
  const handleClaimOfflineIncome = () => {
    claimOfflineIncome();
    setShowOfflineDialog(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white overflow-hidden">
      
      {/* Offline Income Dialog */}
      <OfflineIncomeDialog
        isOpen={showOfflineDialog}
        onClaim={handleClaimOfflineIncome}
        onClose={() => setShowOfflineDialog(false)}
        offlineLP={gamePlayerData?.pendingOfflineLP || 0}
        offlineDuration={gamePlayerData?.offlineDuration || 0}
      />

      {/* Status Bar */}
      <div className="flex justify-between items-center p-4 pr-6 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30 flex-shrink-0">
        
        {/* Left Section: Avatar + Username + Level */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <p className="font-medium text-sm text-center">{playerData?.username?.replace('Player', '') || playerData?.name || "ShadyLTDx"}</p>
            <div 
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => {
                console.log('Status bar avatar clicked, opening gallery');
                updateGUIState({ showCharacterGallery: true });
              }}
              title="Click to open Character Gallery"
            >
              <img
                src={selectedCharacter?.avatarUrl || selectedCharacter?.imageUrl || selectedCharacter?.avatarPath || "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤"}
                alt="Character Avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤") {
                    target.src = "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤";
                  }
                }}
                className="w-[74px] h-[74px] object-cover rounded-xl shadow-lg border-2 border-purple-500/50 cursor-pointer hover:border-purple-400/70 transition-colors"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-white text-lg font-bold text-center drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">Level: {playerData?.level || 1}</span>
              <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-2 w-20" />
            </div>
          </div>

          {/* Left Column: LustPoints and Lust Gems Stacked (More compact) */}
          <div className="flex flex-col gap-1 ml-3">
            {/* LustPoints Frame */}
            <div className="relative px-2 py-1 bg-gradient-to-r from-pink-600/20 to-pink-500/20 border border-pink-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-pink-500/20 hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent rounded-lg blur-sm"></div>
              <div className="relative flex items-center gap-1">
                <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
                <span className="text-pink-200 text-xs font-bold">LustPoints:</span>
                <span className="text-pink-100 font-bold text-xs">{user?.lp || playerData?.lp || 5026}</span>
              </div>
            </div>

            {/* Lust Gems Frame */}
            <div className="relative px-2 py-1 bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-purple-500/20 hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg blur-sm"></div>
              <div className="relative flex items-center gap-1">
                <img src="/media/lustgems.png" alt="Gems" className="w-4 h-4" />
                <span className="text-purple-200 text-xs font-bold whitespace-nowrap">Lust Gems:</span>
                <span className="text-purple-100 font-bold text-xs">{playerData?.lustGems || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: LP per Hour (Vertical layout) */}
        <div className="relative px-4 py-3 mx-6 bg-gradient-to-r from-yellow-600/20 to-orange-500/20 border border-yellow-400/30 rounded-xl shadow-xl backdrop-blur-sm hover:shadow-yellow-500/30 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/15 to-orange-500/10 rounded-xl blur-sm"></div>
          <div className="relative flex flex-col items-center gap-1 text-center">
            <span className="text-yellow-200 text-sm font-bold">LP per Hour</span>
            <div className="flex items-center gap-2">
              <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
              <span className="text-lg font-bold text-transparent bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text">∞</span>
              <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
            </div>
            <span className="text-yellow-100 font-bold text-sm">{user?.lpPerHour || playerData?.lpPerHour || 250}</span>
          </div>
        </div>

        {/* Right Section: Energy and Boosters Stacked (More spaced out) */}
        <div className="flex flex-col gap-1">
          {/* Energy Frame */}
          <div className="relative px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-blue-500/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative flex items-center gap-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200 text-xs font-bold">Energy:</span>
              <span className="text-blue-100 font-bold text-xs">
                {user?.energy || playerData?.energy || 987}/{user?.maxEnergy || playerData?.maxEnergy || 1000}
              </span>
            </div>
          </div>

          {/* Boosters Frame (Taller) */}
          <div className="relative px-2 py-2 bg-gradient-to-r from-green-600/20 to-emerald-500/20 border border-green-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-green-500/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative text-center">
              <div className="flex items-center justify-center mb-1">
                <span className="text-green-200 text-xs font-bold">Boosters</span>
              </div>
              <div className="text-green-100 text-xs">
                +20% LP [2:30]
              </div>
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
      {/* Admin Button */}
      <Button
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-600/50"
        onClick={() => updateGUIState({ showAdminMenu: true })}
        data-testid="button-admin-menu"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Wheel Game Button - Right Middle */}
      <Button
        className="fixed top-1/2 right-4 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transform -translate-y-1/2 shadow-lg border-2 border-yellow-400/50 hover:border-yellow-400 mb-20"
        onClick={() => updateGUIState({ showWheelGame: true })}
        data-testid="button-wheel-game"
      >
        <RotateCcw className="w-8 h-8 text-yellow-400" />
      </Button>

      {/* VIP Button - Right Middle Below Wheel */}
      <Button
        className="fixed top-1/2 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transform translate-y-20 shadow-lg border-2 border-yellow-300/50 hover:border-yellow-300"
        onClick={() => updateGUIState({ showVIP: true })}
        data-testid="button-vip"
      >
        <Crown className="w-6 h-6 text-yellow-100" />
      </Button>

      {/* Admin Menu Modal */}
      {guiState.showAdminMenu && (
        <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
      )}

      {/* Wheel Game Modal */}
      {guiState.showWheelGame && userId && (
        <WheelGame 
          isOpen={guiState.showWheelGame}
          onClose={() => updateGUIState({ showWheelGame: false })}
          userId={userId}
        />
      )}

      {/* VIP Modal */}
      {guiState.showVIP && userId && (
        <VIP 
          isOpen={guiState.showVIP}
          onClose={() => updateGUIState({ showVIP: false })}
          userId={userId}
        />
      )}

      {/* Character Gallery Modal */}
      {guiState.showCharacterGallery && (
        <CharacterGallery 
          isOpen={guiState.showCharacterGallery}
          onClose={() => updateGUIState({ showCharacterGallery: false })}
          userId={userId || playerData?.id || ''}
          onCharacterSelected={(characterId) => {
            console.log('Character selected:', characterId, 'for user:', userId);
            // Invalidate all related queries to refresh character data
            queryClient.invalidateQueries({ queryKey: ['/api/character/selected'] });
            queryClient.invalidateQueries({ queryKey: ['/api/player'] });
            queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
            updateGUIState({ showCharacterGallery: false });
          }}
        />
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