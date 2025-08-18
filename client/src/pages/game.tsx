import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Settings, 
  Save, 
  Heart, 
  Zap, 
  Crown, 
  Trophy, 
  Users, 
  Star,
  ArrowUp,
  Coins,
  Gamepad2,
  MessageCircle,
  Palette,
  Volume2,
  Bell,
  Shield,
  Smartphone,
  Monitor,
  RotateCcw,
  Target,
  ListChecks,
  ShoppingBag,
  Brain,
  Gem,
  Eye,
  Moon,
  Sun,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
//import FloatingHearts from "@/components/FloatingHearts";
//import WheelModal from "@/components/WheelModal";
//import VIPModal from "@/components/VIPModal";
//import AchievementsModal from "@/components/AchievementsModal";
//import BoostersModal from "@/components/BoostersModal";
//import UpgradeModal from "@/components/UpgradeModal";
import CharacterDisplay from "@/components/CharacterDisplay";
//import EnhancedChatModal from "@/components/EnhancedChatModal";
import LoadingScreen from "@/components/LoadingScreen";
//import TelegramAuth from "@/components/TelegramAuth";
//import AdminPanelFull from "@/components/AdminPanelFull";
//import MistralDebugger from "@/components/MistralDebugger";
//import InGameAIControls from "@/components/InGameAIControls";
import type { User, Character, Upgrade, GameStats } from "@shared/schema";
import CharacterGallery from "./CharacterGallery";

// Mock user ID for testing
const MOCK_USER_ID = "default-player";

// Check if user is admin (you can modify this logic based on your needs)
const isCurrentUserAdmin = (user: User | undefined) => {
  return user?.isAdmin || user?.username === "ShadowGoddess";
};

export default function Game() {
  // All state hooks first - ALWAYS maintain the same order
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true by default
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showAIControls, setShowAIControls] = useState(false);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [heartTriggers, setHeartTriggers] = useState<Array<{ amount: number; x: number; y: number }>>([]);

  // Local settings state
  const [localSettings, setLocalSettings] = useState({
    darkMode: true,
    fontSize: 16,
    soundEnabled: true,
    musicEnabled: false,
    autoSave: true,
    nsfwEnabled: false
  });

  // Hooks - ALWAYS call these in the exact same order every render
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ALL queries - called unconditionally to maintain hook order
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user/init"],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/user/init');
      return await response.json();
    },
    refetchInterval: 30000,
    enabled: true, // Always enabled
  });

  const { data: character, isLoading: characterLoading } = useQuery<Character>({
    queryKey: ["/api/character/selected", MOCK_USER_ID],
    enabled: true, // Always enabled
  });

  const { data: upgrades } = useQuery<Upgrade[]>({
    queryKey: ["/api/upgrades", MOCK_USER_ID],
    enabled: true, // Always enabled
  });

  const { data: stats } = useQuery<GameStats>({
    queryKey: ["/api/stats", MOCK_USER_ID],
    enabled: true, // Always enabled
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings', MOCK_USER_ID],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return await response.json();
    },
    enabled: true // Always enabled
  });

  const [showGallery, setShowGallery] = useState(false);

  // ALL useEffect hooks - keep same order
  // Simulate loading progress
  useEffect(() => {
    if (isAuthenticated && loadingProgress < 100) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadingProgress]);

  // Update local settings when user data changes
  useEffect(() => {
    if (user) {
      setLocalSettings(prev => ({
        ...prev,
        nsfwEnabled: user.nsfwEnabled || false
      }));
    }
  }, [user]);

  // Energy regeneration effect
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
    }, 60000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Save settings mutation - MUST be called before any conditional returns
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof localSettings) => {
      // Update user NSFW setting
      if (newSettings.nsfwEnabled !== localSettings.nsfwEnabled) {
        const response = await apiRequest('POST', `/api/settings/toggle-nsfw/${MOCK_USER_ID}`);
        return await response.json();
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  // Tap mutation - MUST be called before any conditional returns
  const tapMutation = useMutation({
    mutationFn: async (coords?: { x: number; y: number }) => {
      const response = await apiRequest("POST", "/api/tap", { userId: user?.id || MOCK_USER_ID });
      const data = await response.json();

      // Trigger floating heart animation if coordinates provided
      if (coords) {
        setHeartTriggers(prev => [...prev, { 
          amount: data.pointsEarned || 1, 
          x: coords.x, 
          y: coords.y 
        }]);

        // Clear triggers after animation
        setTimeout(() => {
          setHeartTriggers([]);
        }, 100);
      }

      return data;
    },
    onSuccess: (data) => {
      // Force refresh user data to get updated points
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", MOCK_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", MOCK_USER_ID] });

      // Removed toast notification as requested - using floating hearts instead
    },
    onError: (error: any) => {
      toast({
        title: "Tap Failed",
        description: error.message || "Not enough energy!",
        variant: "destructive",
      });
    },
  });

  // Handle authentication success
  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Helper functions
  const handleTap = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    tapMutation.mutate({ x, y });
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  // Early returns after all hooks are defined
  if (loadingProgress < 100) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (userLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading ClassikLust...</div>
      </div>
    );
  }

  if (!user || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Game data not available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ff69b4%27 fill-opacity=%270.05%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      {/* Main Game Interface */}
      <div className="relative z-10 min-h-screen">
        {/* Top Status Bar */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl m-4 p-4">
          <div className="flex justify-between items-start">

            {/* Top-Left Block */}
            <div className="flex flex-col items-start w-25">
              {/* Name */}
              <span className="text-white font-bold mb-2 text-center truncate max-w-[10rem]">
                {user.username || "Guest"}
              </span>

              <div className="flex items-center">
                {/* Avatar - Clickable to open gallery */}
                <div 
                  className="relative w-[80px] h-[80px] rounded-xl overflow-hidden border-2 border-red-500 bg-red-500/20 cursor-pointer hover:border-red-400 hover:shadow-lg transition-all duration-200 group"
                  onClick={() => {
                    console.log('Avatar clicked!');
                    console.log('showGallery state:', showGallery);
                    setShowGallery(true);
                    console.log('showGallery after setState:', true);
                  }}
                  title="Click to open character gallery"
                >
                  {/* User Avatar - Priority: user avatar > character avatar > initials */}
                  {(user?.avatarUrl || character?.avatarUrl) ? (
                    <img 
                      src={
                        user?.avatarUrl 
                          ? (user.avatarUrl.startsWith('/') ? user.avatarUrl : `/uploads/${user.avatarUrl}`)
                          : (character?.avatarUrl?.startsWith('/') ? character.avatarUrl : `/uploads/${character.avatarUrl}`)
                      }
                      alt="User Avatar"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Fallback to initials if avatar fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback to user initials */}
                  <div 
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500 text-white font-bold text-2xl transition-transform group-hover:scale-105"
                    style={{ display: (user?.avatarUrl || character?.avatarUrl) ? 'none' : 'flex' }}
                  >
                    {(user.username || "Guest").charAt(0).toUpperCase()}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-bold bg-black/70 px-2 py-1 rounded">
                      Gallery
                    </div>
                  </div>

                  {/* Settings button - moved to bottom right */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent gallery from opening
                      setShowSettingsModal(true);
                    }}
                    className="absolute -bottom-0 -right-0 w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 p-0 z-10"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>

                {/* Level & LP */}
                <div className="flex flex-col justify-center ml-4">
                  <div className="text-sm font-bold">
                    <span className="text-gray-300">Level: </span>
                    <span className="ml-1 font-bold text-green-400 text-sm">{user.level}</span>
                  </div>
                  <div className="mt-1 text-sm rounded-lg overflow-hidden border-2 border-red-500 bg-red-600/20 to-red-700/30 px-3 py-1">
                    <span className="text-gray-250 font-bold">❤️Lust Points: </span>
                    <span className="ml-2 font-bold text-pink-200">{stats?.totalPoints?.toLocaleString() || "100"}</span>
                  </div>
                </div>
              </div>
            </div>
        

            {/* Center Block (LP/Hr with heart) */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-r from-green-700/40 to-green-500/40 border border-green-400/30 rounded-lg px-4 py-2 text-center}">
                <span className="text-gray-300 font-bold">❤️ LP per Hour</span>
                <div className="font-bold text-pink-400 text-LG">
                  +{user?.hourlyRate?.toLocaleString() || "100"}
                </div>
              </div>
            </div>

            {/* Right Block (Stats + Icons) */}
            <div className="flex flex-col items-end">
              {/* Lust Gems */}
              <div className="flex items-center space-x-1">
                <Gem className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">{user?.lustGems || "50"}</span>
              </div>

              {/* Energy */}
              <div className="flex items-center space-x-1 mt-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-sm">{stats?.currentEnergy || "1000"}/{stats?.maxEnergy || "4500"}</span>
              </div>

              {/* Admin + Debugger Icons */}
              {isCurrentUserAdmin(user) && (
                <div className="flex gap-1 mt-2">
                  <Button
                    onClick={() => setShowAdminPanel(true)}
                    className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center p-0"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setShowDebugger(true)}
                    className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center p-0"
                    title="AI Debugger"
                  >
                    <Brain className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Block */}
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl text-center">
            <span className="font-bold text-lg">EVENT NEWS</span>
          </div>
        </div>

        {/* Main Character Display */}
        <div className="flex-1 relative flex items-center justify-center px-4">
          <div className="relative w-full max-w-lg h-[60vh] md:h-[70vh] lg:h-[80vh]">
            <CharacterDisplay 
              character={character}
              user={user}
              stats={stats}
              onTap={handleTap}
              isTapping={tapMutation.isPending}
            />
          </div>
        </div>

        {/* Right-Side Action Buttons */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-3 z-20">
          <Button
            onClick={() => setShowWheelModal(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg flex flex-col items-center justify-center"
          >
            <Target className="w-6 h-6" />
            <span className="text-xs mt-1">Wheel</span>
          </Button>

          <Button
            onClick={() => setShowBoosterModal(true)}
            className="w-16 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg flex flex-col items-center justify-center"
          >
            <Zap className="w-6 h-6" />
            <span className="text-xs mt-1">Booster</span>
          </Button>

          {/* AI Control Panel Button */}
          <Button
            onClick={() => setShowAIControls(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg flex flex-col items-center justify-center"
            title="AI Controls"
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs mt-1">AI</span>
          </Button>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 p-4 pb-6">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="flex flex-col items-center space-y-1 relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-500 bg-gray-500/20 hover:bg-white/10 text-white p-3 rounded-lg"
            >
              <ArrowUp className="w-6 h-6 text-gray-400" />
              <span className="text-xs">Upgrade</span>
            </Button>

            <Button
              onClick={() => setShowAchievementsModal(true)}
              className="flex flex-col items-center space-y-1 relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 bg-blue-500/20 hover:bg-white/10 text-white p-3 rounded-lg"
            >
              <ListChecks className="w-6 h-6 text-blue-400" />
              <span className="text-xs">Task</span>
            </Button>

            <Button
              onClick={() => toast({ title: "Shop", description: "Coming soon!" })}
              className="flex flex-col items-center space-y-1 relative w-16 h-16 rounded-xl overflow-hidden border-2 border-green-500 bg-green-500/20 hover:bg-white/10 text-white p-3 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-400" />
              <span className="text-xs">Shop</span>
            </Button>

            <Button
              onClick={() => setShowChatModal(true)}
              className="flex flex-col items-center space-y-1 relative w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500 bg-purple-500/20 hover:bg-white/10 text-white p-3 rounded-lg">
              <MessageCircle className="w-6 h-6 text-purple-400" />
              <span className="text-xs">Chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold gradient-text">Settings</DialogTitle>
            <DialogDescription className="text-white/70">Adjust your game preferences and appearance.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md bg-dark-800/50">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center">
                        {localSettings.darkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                        Dark Mode
                      </Label>
                      <p className="text-sm text-gray-400">Use dark theme for better night gaming</p>
                    </div>
                    <Switch
                      checked={localSettings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Font Size</Label>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">Small</span>
                      <Slider
                        value={[localSettings.fontSize]}
                        onValueChange={([value]) => handleSettingChange('fontSize', value)}
                        min={12}
                        max={24}
                        step={2}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-400">Large</span>
                    </div>
                    <p className="text-sm text-gray-400">Current size: {localSettings.fontSize}px</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-Save Progress</Label>
                      <p className="text-sm text-gray-400">Automatically save your progress</p>
                    </div>
                    <Switch
                      checked={localSettings.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center text-red-400">
                          <Eye className="w-4 h-4 mr-2" />
                          Enable NSFW Content
                        </Label>
                        <p className="text-sm text-gray-400">
                          Show adult-oriented content including characters, images, and interactions
                        </p>
                        <p className="text-xs text-red-400">
                          ⚠️ You must be 18+ to enable this setting
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.nsfwEnabled}
                        onCheckedChange={(checked) => handleSettingChange('nsfwEnabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center">
                        {localSettings.soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                        Sound Effects
                      </Label>
                      <p className="text-sm text-gray-400">Play tap sounds, notifications, and UI sounds</p>
                    </div>
                    <Switch
                      checked={localSettings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Background Music</Label>
                      <p className="text-sm text-gray-400">Play ambient background music</p>
                    </div>
                    <Switch
                      checked={localSettings.musicEnabled}
                      onCheckedChange={(checked) => handleSettingChange('musicEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Debug Information</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Game Version: v1.0.0</div>
                      <div>Player ID: {MOCK_USER_ID}</div>
                      <div>Session: Active</div>
                      <div>Server Status: Connected</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-gray-600"
                    onClick={() => {
                      toast({
                        title: "Cache Cleared",
                        description: "Game cache has been cleared successfully.",
                      });
                    }}
                  >
                    Clear Cache
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
            <Button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="bg-gradient-to-r from-secondary-500 to-accent-500 hover:from-secondary-600 hover:to-accent-600"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        upgrades={upgrades || []}
        user={user}
      />

      <EnhancedChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        characterId={character?.id || ""}
        characterName={character?.name || "Character"}
        user={user}
      />

      <BoostersModal 
        isOpen={showBoosterModal}
        onClose={() => setShowBoosterModal(false)}
        user={user}
      />


      <AdminPanelFull
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      <MistralDebugger 
        isOpen={showDebugger} 
        onClose={() => setShowDebugger(false)} 
      />

      <WheelModal
        isOpen={showWheelModal}
        onClose={() => setShowWheelModal(false)}
        userId={MOCK_USER_ID}
      />

      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        userId={MOCK_USER_ID}
      />

      <VIPModal
        isOpen={showVIPModal}
        onClose={() => setShowVIPModal(false)}
        userId={MOCK_USER_ID}
      />

      <InGameAIControls
        isOpen={showAIControls}
        onClose={() => setShowAIControls(false)}
      />

      {/* Floating Hearts Animation */}
      <FloatingHearts triggers={heartTriggers} />
    </div>
  );
}
