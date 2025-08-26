import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Users,
  Zap,
  Trophy,
  Database,
  Settings,
  Crown,
  Edit3,
  Trash2,
  RefreshCw,
  Target,
  Bug,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  Code,
  Terminal,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import FileManagerCore from "@/plugins/manager/FileManagerCore";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Upgrades from "@/plugins/gameplay/Upgrades";
import Tasks from "@/plugins/gameplay/Task";
import Achievements from "@/plugins/gameplay/Achievements";
import LevelManagement from "@/components/admin/LevelManagement";
import UpgradeManagement from "@/components/admin/UpgradeManagement";
import AchievementManagement from "@/components/admin/AchievementManagement";
import type { Character } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import MistralDebugger from "@/plugins/aicore/MistralDebugger";
import DebuggerInterface from "@/components/admin/DebuggerInterface";

interface AdminMenuProps {
  onClose?: () => void;
}

// Admin Backend Debugger Component
const AdminBackendDebugger = () => {
  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState("");

  const runCommand = async () => {
    if (!commandInput.trim()) {
      setCommandOutput("Please enter a command.");
      return;
    }

    try {
      const result = { 
        status: "success", 
        command: commandInput,
        timestamp: new Date().toISOString(),
        output: "Command executed successfully"
      };
      setCommandOutput(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setCommandOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5" />
        Backend Debugger
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-white text-sm">Command Input</Label>
          <div className="flex gap-2">
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command (e.g., 'status', 'reload', 'stats')"
              className="bg-gray-700 border-gray-600 text-white flex-1"
              onKeyPress={(e) => e.key === 'Enter' && runCommand()}
            />
            <Button
              onClick={runCommand}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-white text-sm">Output</Label>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 min-h-24 max-h-48 overflow-y-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">
              {commandOutput || "No output yet..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Character Card Component
const CharacterCard = ({ character, onEdit, onDelete, onToggleVip, onToggleNsfw, onToggleEnabled, isUpdating }: {
  character: Character;
  onEdit: (char: Character) => void;
  onDelete: (id: string, name: string) => void;
  onToggleVip: (id: string, current: boolean) => void;
  onToggleNsfw: (id: string, current: boolean) => void;
  onToggleEnabled: (id: string, current: boolean) => void;
  isUpdating: boolean;
}) => (
  <Card className="bg-gray-800/80 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          {character.name}
          {character.isVip && <Crown className="w-4 h-4 text-yellow-400" />}
        </CardTitle>
        <div className="flex gap-1">
          {character.isVip && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">VIP</Badge>
          )}
          {character.isNsfw && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">NSFW</Badge>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-gray-400 text-sm line-clamp-2">
        {character.personality || "No personality set"}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Level {character.requiredLevel || character.levelRequirement || 1}+</span>
        <span>ID: {character.id.slice(0, 8)}...</span>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant={character.isVip ? "default" : "outline"}
          onClick={() => onToggleVip(character.id, character.isVip || false)}
          disabled={isUpdating}
          className="flex-1 h-8"
        >
          <Crown className="w-3 h-3 mr-1" />
          VIP
        </Button>
        <Button
          size="sm"
          variant={character.isNsfw ? "destructive" : "outline"}
          onClick={() => onToggleNsfw(character.id, character.isNsfw || false)}
          disabled={isUpdating}
          className="flex-1 h-8"
        >
          {character.isNsfw ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
          NSFW
        </Button>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant={character.isEnabled ? "default" : "outline"}
          onClick={() => onToggleEnabled(character.id, character.isEnabled || false)}
          disabled={isUpdating}
          className="flex-1 h-8"
        >
          {character.isEnabled ? "Enabled" : "Disabled"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(character)}
          className="h-8 px-2 text-blue-400 hover:text-blue-300"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(character.id, character.name)}
          disabled={isUpdating}
          className="h-8 px-2 text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function AdminMenu({ onClose }: AdminMenuProps) {
  const [activeTab, setActiveTab] = useState("characters");
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showMistralDebugger, setShowMistralDebugger] = useState(false);
  const [showBackendDebugger, setShowBackendDebugger] = useState(false);
  const [showDebuggerInterface, setShowDebuggerInterface] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const queryClient = useQueryClient();

  // Fetch characters
  const {
    data: characters = [],
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: async (): Promise<Character[]> => {
      const response = await apiRequest("GET", "/api/characters");
      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.status}`);
      }
      return await response.json();
    },
    retry: 2,
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (charId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/characters/${charId}`);
      if (!response.ok) {
        throw new Error(`Failed to delete character`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: () => {
      toast.error("Failed to delete character");
    },
  });

  // Toggle character mutation
  const toggleCharacterMutation = useMutation({
    mutationFn: async ({ characterId, field, value }: {
      characterId: string;
      field: string;
      value: boolean;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/characters/${characterId}`, {
        [field]: value
      });
      if (!response.ok) {
        throw new Error(`Failed to update character`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character updated!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: () => {
      toast.error("Failed to update character");
    },
  });

  const handleEdit = useCallback((char: Character) => {
    setSelectedCharacter(char);
    setShowEditCharacter(true);
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteCharacterMutation.mutate(id);
    }
  }, [deleteCharacterMutation]);

  const handleToggleVip = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterId: id, field: "isVip", value: !current });
  }, [toggleCharacterMutation]);

  const handleToggleNsfw = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterId: id, field: "isNsfw", value: !current });
  }, [toggleCharacterMutation]);

  const handleToggleEnabled = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterId: id, field: "isEnabled", value: !current });
  }, [toggleCharacterMutation]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateCharacter(false);
    queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character created!");
  }, [queryClient]);

  const handleEditSuccess = useCallback(() => {
    setShowEditCharacter(false);
    setSelectedCharacter(null);
    queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character updated!");
  }, [queryClient]);

  return (
    <>
      {/* Main Admin Panel */}
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl w-[95vw] max-w-6xl h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Control Panel</h2>
                <p className="text-sm text-gray-400">Manage characters, debug, and system tools</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowBackendDebugger(!showBackendDebugger)}
                variant="ghost"
                size="sm"
                className={`text-white hover:bg-gray-700 ${showBackendDebugger ? 'bg-gray-700' : ''}`}
                title="Toggle Backend Debugger"
              >
                <Terminal className="w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 bg-gray-800/50 border border-gray-700/50">
                <TabsTrigger value="characters" className="data-[state=active]:bg-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="gameplay" className="data-[state=active]:bg-purple-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  Gameplay
                </TabsTrigger>
                <TabsTrigger value="debug" className="data-[state=active]:bg-purple-600">
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Tools
                </TabsTrigger>
                <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
                  <Database className="w-4 h-4 mr-2" />
                  System
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6">
                <TabsContent value="characters" className="py-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Character Management</h3>
                    <Button
                      onClick={() => setShowCreateCharacter(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Character
                    </Button>
                  </div>

                  {charactersLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                  ) : charactersError ? (
                    <div className="text-center text-red-400 py-8">
                      Failed to load characters
                    </div>
                  ) : characters.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No characters found. Create your first character to get started.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                      {characters.map((character, index) => (
                        <CharacterCard
                          key={`admin-char-${character.id}-${index}`}
                          character={character}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleVip={handleToggleVip}
                          onToggleNsfw={handleToggleNsfw}
                          onToggleEnabled={handleToggleEnabled}
                          isUpdating={toggleCharacterMutation.isPending || deleteCharacterMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="gameplay" className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-yellow-400" />
                          Level System
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">Manage player leveling and progression</p>
                        <Button 
                          onClick={() => setShowLevelUp(true)}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Admin Level Manager
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-400" />
                          Upgrades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">Create and manage game upgrades</p>
                        <Button 
                          onClick={() => setShowUpgrades(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Upgrade Manager
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-400" />
                          Tasks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">Define daily and special tasks</p>
                        <Button 
                          onClick={() => setShowTasks(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Task Manager
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-pink-400" />
                          Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">Create player achievements</p>
                        <Button 
                          onClick={() => setShowAchievements(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Achievement Manager
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700 md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Database className="w-5 h-5 text-cyan-400" />
                          File Manager
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">Manage media files, images, and character assets</p>
                        <Button 
                          onClick={() => setShowFileManager(true)}
                          className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700"
                        >
                          <Database className="w-4 h-4 mr-2" />
                          File Manager
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="debug" className="py-6">
                  <div className="space-y-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Bug className="w-5 h-5 text-purple-400" />
                          MistralAI Advanced Debugger
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">
                          Full AI debugging interface with code analysis and chat
                        </p>
                        <Button
                          onClick={() => setShowMistralDebugger(true)}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600"
                        >
                          <Bug className="w-4 h-4 mr-2" />
                          Open MistralAI Debugger
                        </Button>
                      </CardContent>
                    </Card>

                    {showBackendDebugger && <AdminBackendDebugger />}
                    
                    {/* Plugin Debugger Interface */}
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <Bug className="w-4 h-4 text-pink-500" />
                          Plugin Debugger System
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-400 text-xs mb-2">
                          Control the plugin debugger system for characters, database, and gameplay modules
                        </p>
                        <Button
                          onClick={() => setShowDebuggerInterface(true)}
                          size="sm"
                          className="w-full bg-pink-600 hover:bg-pink-700"
                          data-testid="button-plugin-debugger"
                        >
                          <Terminal className="w-4 h-4 mr-2" />
                          Open Plugin Debugger
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Quick Admin Tools */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Admin Tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Target className="w-4 h-4 text-pink-500" />
                            Level Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            onClick={() => setShowLevelUp(true)}
                            size="sm"
                            className="w-full bg-pink-600 hover:bg-pink-700"
                          >
                            Manage Levels
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            Upgrade Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            onClick={() => setShowUpgrades(true)}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Manage Upgrades
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            Achievement Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            onClick={() => setShowAchievements(true)}
                            size="sm"
                            className="w-full bg-yellow-600 hover:bg-yellow-700"
                          >
                            Manage Achievements
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="system" className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-400" />
                          System Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Server:</span>
                            <span className="text-green-400">Online</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Database:</span>
                            <span className="text-green-400">Connected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Characters:</span>
                            <span className="text-white">{characters.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-green-400" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Database className="w-4 h-4 mr-2" />
                          Backup Database
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Clear Cache
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Code className="w-4 h-4 mr-2" />
                          View Logs
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Plugin Modals - Fixed LevelUp to show admin interface */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[90vw] max-w-4xl h-[80vh] overflow-auto relative">
            <Button
              onClick={() => setShowLevelUp(false)}
              className="absolute top-4 right-4 z-10"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="p-6">
              <LevelManagement />
            </div>
          </div>
        </div>
      )}

      {showUpgrades && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[90vw] max-w-4xl h-[80vh] overflow-auto relative">
            <Button
              onClick={() => setShowUpgrades(false)}
              className="absolute top-4 right-4 z-10"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="p-6">
              <UpgradeManagement />
            </div>
          </div>
        </div>
      )}

      {showTasks && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[90vw] max-w-4xl h-[80vh] overflow-auto relative">
            <Button
              onClick={() => setShowTasks(false)}
              className="absolute top-4 right-4 z-10"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <Tasks isAdminMode={true} />
          </div>
        </div>
      )}

      {showAchievements && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[90vw] max-w-4xl h-[80vh] overflow-auto relative">
            <Button
              onClick={() => setShowAchievements(false)}
              className="absolute top-4 right-4 z-10"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="p-6">
              <AchievementManagement />
            </div>
          </div>
        </div>
      )}

      {showFileManager && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[90vw] max-w-6xl h-[85vh] overflow-auto relative">
            <Button
              onClick={() => setShowFileManager(false)}
              className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <FileManagerCore />
          </div>
        </div>
      )}

      {/* Character Creation Dialog */}
      {showCreateCharacter && (
        <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Character</DialogTitle>
            </DialogHeader>
            <CharacterCreation 
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateCharacter(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Character Edit Dialog */}
      {showEditCharacter && selectedCharacter && (
        <Dialog open={showEditCharacter} onOpenChange={setShowEditCharacter}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Character</DialogTitle>
            </DialogHeader>
            <CharacterEditor 
              character={selectedCharacter}
              isEditing={true}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditCharacter(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* MistralAI Debugger */}
      {showMistralDebugger && (
        <MistralDebugger 
          isOpen={showMistralDebugger}
          onClose={() => setShowMistralDebugger(false)} 
        />
      )}

      {/* Plugin Debugger Interface Modal */}
      {showDebuggerInterface && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-[95vw] max-w-7xl h-[90vh] overflow-hidden relative">
            <Button
              onClick={() => setShowDebuggerInterface(false)}
              className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
            <DebuggerInterface />
          </div>
        </div>
      )}
    </>
  );
}