import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Plus, 
  Users, 
  Heart, 
  Star, 
  Zap, 
  Trophy, 
  Activity, 
  Database, 
  Settings, 
  Crown, 
  Edit3, 
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  UserPlus,
  Palette
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import FileManagerCore from "@/plugins/manager/FileManagerCore";
import type { Character, Upgrade, InsertUpgrade } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminMenuProps {
  onClose?: () => void;
}

// Character submenu options
type CharacterSubmenu = 'overview' | 'create' | 'import';

// Error Boundary Component
const ErrorDisplay = ({ error, retry }: { error: Error; retry?: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="bg-red-500/10 p-4 rounded-full mb-4">
      <AlertTriangle className="w-12 h-12 text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">System Error</h3>
    <p className="text-gray-400 mb-4 max-w-md">{error.message}</p>
    {retry && (
      <Button 
        onClick={retry} 
        variant="outline" 
        className="border-red-400/50 text-red-400 hover:bg-red-500/10"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry Operation
      </Button>
    )}
  </div>
);

// Loading Component
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="relative">
      <div className="w-12 h-12 border-2 border-blue-500/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-gray-400 text-sm mt-4">{message}</p>
  </div>
);

// Empty State Component
const EmptyState = ({ 
  title, 
  description, 
  icon: Icon, 
  action 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-16">
    <div className="bg-blue-500/10 p-4 rounded-full w-fit mx-auto mb-4">
      <Icon className="w-12 h-12 text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);

// Character Card Component
const CharacterCard = ({ 
  character, 
  onEdit, 
  onDelete, 
  onToggleVip,
  onToggleNsfw,
  isUpdating
}: {
  character: Character;
  onEdit: (char: Character) => void;
  onDelete: (id: string, name: string) => void;
  onToggleVip: (id: string, current: boolean) => void;
  onToggleNsfw: (id: string, current: boolean) => void;
  isUpdating: boolean;
}) => (
  <div className="group bg-gradient-to-r from-gray-900/50 to-gray-800/50 p-4 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
    <div className="flex items-start gap-4">
      {/* Character Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-600/50 group-hover:border-blue-500/50 transition-colors">
          <img 
            src={'/default-avatar.jpg'} 
            alt={character.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.jpg';
            }}
          />
        </div>
        {character.isVip && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 p-1 rounded-full">
            <Crown className="w-3 h-3 text-black" />
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-white font-semibold text-lg truncate">{character.name}</h4>
          <div className="flex gap-1">
            {character.isVip && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                VIP
              </Badge>
            )}
            {character.isNsfw && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                NSFW
              </Badge>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-1 line-clamp-2">
          {character.personality || "No personality set"}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Level {character.levelRequirement}+</span>
          <span>ID: {character.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="ghost"
          disabled={isUpdating}
          onClick={() => onToggleVip(character.id, character.isVip)}
          className={`h-8 w-8 p-0 ${
            character.isVip 
              ? "text-yellow-400 hover:text-yellow-300" 
              : "text-gray-500 hover:text-yellow-400"
          }`}
          title={character.isVip ? "Remove VIP" : "Make VIP"}
        >
          <Crown className="w-4 h-4" />
        </Button>

        <Button 
          size="sm" 
          variant="ghost"
          disabled={isUpdating}
          onClick={() => onToggleNsfw(character.id, character.isNsfw)}
          className={`h-8 w-8 p-0 ${
            character.isNsfw 
              ? "text-red-400 hover:text-red-300" 
              : "text-gray-500 hover:text-red-400"
          }`}
          title={character.isNsfw ? "Remove NSFW" : "Mark NSFW"}
        >
          {character.isNsfw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>

        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => onEdit(character)}
          className="text-blue-400 hover:text-blue-300 h-8 w-8 p-0"
          title="Edit character"
        >
          <Edit3 className="w-4 h-4" />
        </Button>

        <Button 
          size="sm" 
          variant="ghost"
          disabled={isUpdating}
          onClick={() => onDelete(character.id, character.name)}
          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
          title="Delete character"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

export default function AdminMenu({ onClose }: AdminMenuProps) {
  const [activeTab, setActiveTab] = useState("characters");
  const [characterSubmenu, setCharacterSubmenu] = useState<CharacterSubmenu>("overview");
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNsfw, setFilterNsfw] = useState(false);
  const [filterVip, setFilterVip] = useState(false);
  const [upgradeFormData, setUpgradeFormData] = useState({
    name: '',
    description: '',
    category: 'lp_per_hour',
    baseCost: 100,
    baseEffect: 1.0,
    costMultiplier: 1.3,
    effectMultiplier: 1.15,
    maxLevel: null as number | null,
    levelRequirement: 1
  });
  const [editingUpgrade, setEditingUpgrade] = useState<any>(null);
  const [taskFormData, setTaskFormData] = useState({
    name: '',
    description: '',
    reward: 100,
    type: 'daily',
    requirement: ''
  });
  const [achievementFormData, setAchievementFormData] = useState({
    name: '',
    description: '',
    reward: 500,
    condition: '',
    icon: ''
  });
  const [aiDebugMessage, setAiDebugMessage] = useState('');
  const [aiDebugResponse, setAiDebugResponse] = useState('');

  const queryClient = useQueryClient();

  // Fetch characters with better error handling
  const { 
    data: characters = [], 
    isLoading: charactersLoading, 
    error: charactersError,
    refetch: refetchCharacters 
  } = useQuery({
    queryKey: ["/api/admin/characters"],
    queryFn: async (): Promise<Character[]> => {
      try {
        const response = await apiRequest("GET", "/api/admin/characters");
        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching characters:", error);
        throw new Error("Unable to load characters. Please check your connection and try again.");
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch upgrades
  const { data: upgrades = [], isLoading: upgradesLoading, refetch: refetchUpgrades } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/upgrades");
      return await response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Original characters query
  const originalCharactersQuery = useQuery({
    queryKey: ["/api/admin/characters"],
    queryFn: async (): Promise<Character[]> => {
      try {
        const response = await apiRequest("GET", "/api/admin/characters");
        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching characters:", error);
        throw new Error("Unable to load characters. Please check your connection and try again.");
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Create upgrade mutation\n  const createUpgradeMutation = useMutation({\n    mutationFn: async (upgradeData: InsertUpgrade) => {\n      const response = await apiRequest(\"POST\", \"/api/admin/upgrades\", upgradeData);\n      if (!response.ok) throw new Error(\"Failed to create upgrade\");\n      return response.json();\n    },\n    onSuccess: () => {\n      toast.success(\"Upgrade created successfully!\");\n      refetchUpgrades();\n      setUpgradeFormData({ name: '', description: '', category: 'lp_per_hour', baseCost: 100, baseEffect: 1.0, costMultiplier: 1.3, effectMultiplier: 1.15, maxLevel: null, levelRequirement: 1 });\n    },\n    onError: (error: Error) => {\n      toast.error(error.message || \"Failed to create upgrade\");\n    }\n  });\n\n  // AI Debug mutation\n  const aiDebugMutation = useMutation({\n    mutationFn: async (message: string) => {\n      const response = await apiRequest(\"POST\", \"/api/mistral/chat\", {\n        message,\n        characterName: \"Assistant\",\n        characterPersonality: \"helpful\",\n        currentMood: \"normal\",\n        conversationHistory: []\n      });\n      if (!response.ok) throw new Error(\"Failed to get AI response\");\n      return response.json();\n    },\n    onSuccess: (data) => {\n      setAiDebugResponse(data.response || data.message || \"No response received\");\n    },\n    onError: (error: Error) => {\n      toast.error(error.message || \"AI request failed\");\n    }\n  });\n\n  // Filter characters based on search and filters
  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.personality?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNsfw = !filterNsfw || char.isNsfw;
    const matchesVip = !filterVip || char.isVip;
    return matchesSearch && matchesNsfw && matchesVip;
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (charId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/characters/${charId}`);
      if (!response.ok) {
        throw new Error(`Failed to delete character: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: (error: Error) => {
      console.error("Delete character error:", error);
      toast.error(error.message || "Failed to delete character");
    },
  });

  // Toggle character properties mutation
  const toggleCharacterMutation = useMutation({
    mutationFn: async ({ 
      characterId, 
      field, 
      value 
    }: { 
      characterId: string; 
      field: string; 
      value: boolean 
    }) => {
      const response = await apiRequest("PUT", `/api/admin/characters/${characterId}`, { 
        [field]: value 
      });
      if (!response.ok) {
        throw new Error(`Failed to update character: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: (error: Error) => {
      console.error("Toggle character error:", error);
      toast.error(error.message || "Failed to update character");
    },
  });

  // Event handlers
  const handleEdit = useCallback((char: Character) => {
    setSelectedCharacter(char);
    setShowEditCharacter(true);
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    const confirmMessage = `⚠️ DELETE CHARACTER\n\n"${name}" will be permanently removed.\n\nThis action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      deleteCharacterMutation.mutate(id);
    }
  }, [deleteCharacterMutation]);

  const handleToggleVip = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ 
      characterId: id, 
      field: "isVip", 
      value: !current 
    });
  }, [toggleCharacterMutation]);

  const handleToggleNsfw = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ 
      characterId: id, 
      field: "isNsfw", 
      value: !current 
    });
  }, [toggleCharacterMutation]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateCharacter(false);
    setCharacterSubmenu("overview");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character created successfully!");
  }, [queryClient]);

  const handleEditSuccess = useCallback(() => {
    setShowEditCharacter(false);
    setSelectedCharacter(null);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character updated successfully!");
  }, [queryClient]);

  const handleDialogClose = useCallback(() => {
    setShowEditCharacter(false);
    setSelectedCharacter(null);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-start justify-center z-50 p-2 pt-4">
      <div className="bg-gradient-to-br from-gray-950 via-blue-950/50 to-black w-full max-w-7xl h-[90vh] rounded-2xl border border-blue-500/20 flex flex-col overflow-hidden shadow-2xl shadow-blue-500/10">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Control Panel</h2>
              <p className="text-gray-400 text-sm">System management & configuration</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0">

            {/* Tab Navigation */}
            <div className="px-6 py-2 border-b border-gray-800/50">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 bg-black/40 p-1 rounded-lg w-full h-10">
                <TabsTrigger value="characters" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Users className="w-3 h-3 mr-1" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="media" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Heart className="w-3 h-3 mr-1" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="upgrades" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Upgrades
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="achievements" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="game" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Activity className="w-3 h-3 mr-1" />
                  Game
                </TabsTrigger>
                <TabsTrigger value="database" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Database className="w-3 h-3 mr-1" />
                  Database
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Settings className="w-3 h-3 mr-1" />
                  System
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CHARACTERS TAB */}
            <TabsContent value="characters" className="flex-1 flex flex-col overflow-hidden px-6 py-2 min-h-0 mt-0" data-state={activeTab === "characters" ? "active" : "inactive"}>
              {/* Character Submenu */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex bg-black/40 p-1 rounded-lg">
                  <Button
                    size="sm"
                    variant={characterSubmenu === "overview" ? "default" : "ghost"}
                    onClick={() => setCharacterSubmenu("overview")}
                    className={characterSubmenu === "overview" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Overview
                  </Button>
                  <Button
                    size="sm"
                    variant={characterSubmenu === "create" ? "default" : "ghost"}
                    onClick={() => setCharacterSubmenu("create")}
                    className={characterSubmenu === "create" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant={characterSubmenu === "import" ? "default" : "ghost"}
                    onClick={() => setCharacterSubmenu("import")}
                    className={characterSubmenu === "import" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}
                  >
                    <Database className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>

              {/* Character Overview Submenu */}
              {characterSubmenu === "overview" && (
                <>
                  {/* Search and Filters */}
                  <div className="flex gap-4 mb-3 p-3 bg-black/20 rounded-lg border border-gray-800/50">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search characters..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-black/40 border-gray-700/50 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={filterVip}
                          onCheckedChange={setFilterVip}
                          className="data-[state=checked]:bg-yellow-600"
                        />
                        <Label className="text-sm text-gray-300">VIP Only</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={filterNsfw}
                          onCheckedChange={setFilterNsfw}
                          className="data-[state=checked]:bg-red-600"
                        />
                        <Label className="text-sm text-gray-300">NSFW Only</Label>
                      </div>
                    </div>
                  </div>

                  {/* Character Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Card className="bg-black/20 border-gray-800/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{characters.length}</div>
                          <div className="text-sm text-gray-400">Total Characters</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-800/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{characters.filter(c => c.isVip).length}</div>
                          <div className="text-sm text-gray-400">VIP Characters</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-800/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{characters.filter(c => c.isNsfw).length}</div>
                          <div className="text-sm text-gray-400">NSFW Characters</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Character List */}
                  <div className="flex-1 bg-black/20 border border-gray-800/50 rounded-lg flex flex-col overflow-hidden min-h-0">
                    {charactersError ? (
                      <ErrorDisplay 
                        error={charactersError as Error} 
                        retry={() => refetchCharacters()}
                      />
                    ) : charactersLoading ? (
                      <LoadingSpinner message="Loading characters..." />
                    ) : filteredCharacters.length === 0 ? (
                      <EmptyState
                        title={searchQuery || filterVip || filterNsfw ? "No matches found" : "No characters found"}
                        description={searchQuery || filterVip || filterNsfw ? "Try adjusting your search or filters" : "Create your first character to get started"}
                        icon={Users}
                        action={
                          <Button 
                            onClick={() => setCharacterSubmenu("create")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Character
                          </Button>
                        }
                      />
                    ) : (
                      <ScrollArea className="h-full">
                        <div className="space-y-3 p-4">
                          {filteredCharacters.map((char) => (
                            <CharacterCard
                              key={char.id}
                              character={char}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggleVip={handleToggleVip}
                              onToggleNsfw={handleToggleNsfw}
                              isUpdating={toggleCharacterMutation.isPending}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </>
              )}

              {/* Character Create Submenu */}
              {characterSubmenu === "create" && (
                <div className="flex-1 bg-black/20 border border-gray-800/50 rounded-lg p-6">
                  <CharacterCreation
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setCharacterSubmenu("overview")}
                  />
                </div>
              )}

              {/* Character Import Submenu */}
              {characterSubmenu === "import" && (
                <div className="flex-1 bg-black/20 border border-gray-800/50 rounded-lg">
                  <EmptyState
                    title="Character Import"
                    description="Import characters from JSON, CSV, or other character databases"
                    icon={Database}
                    action={
                      <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Select Import File
                      </Button>
                    }
                  />
                </div>
              )}
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "media" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg overflow-auto">
                <FileManagerCore />
              </div>
            </TabsContent>

            {/* UPGRADES TAB */}
            <TabsContent value="upgrades" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "upgrades" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg flex flex-col overflow-hidden p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Upgrades Management</h3>
                  <Button 
                    onClick={() => setEditingUpgrade({ isNew: true })} 
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Upgrade
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {upgradesLoading ? (
                    <LoadingSpinner message="Loading upgrades..." />
                  ) : upgrades.length === 0 ? (
                    <EmptyState
                      title="No Upgrades Found"
                      description="Create your first upgrade to get started"
                      icon={Star}
                    />
                  ) : (
                    <div className="space-y-3">
                      {upgrades.map((upgrade) => (
                        <Card key={upgrade.id} className="bg-gray-800/50 border-gray-600">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold">{upgrade.name}</h4>
                                <p className="text-gray-400 text-sm mb-2">{upgrade.description}</p>
                                <div className="flex gap-4 text-xs text-gray-500">
                                  <span>Category: {upgrade.category}</span>
                                  <span>Base Cost: {upgrade.baseCost} LP</span>
                                  <span>Effect: +{upgrade.baseEffect}</span>
                                  <span>Level Req: {upgrade.levelRequirement}</span>
                                  {upgrade.maxLevel && <span>Max Level: {upgrade.maxLevel}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setEditingUpgrade({ ...upgrade, isNew: false })}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm(`Delete upgrade "${upgrade.name}"? This cannot be undone.`)) {
                                      // Add delete mutation here
                                      toast.success('Upgrade deleted!');
                                      refetchUpgrades();
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create/Edit Upgrade Modal */}
                {editingUpgrade && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="bg-gray-800 border-gray-600 max-w-md w-full">
                      <CardHeader>
                        <CardTitle className="text-white">
                          {editingUpgrade.isNew ? 'Create New Upgrade' : 'Edit Upgrade'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-white">Name</Label>
                          <Input
                            value={upgradeFormData.name}
                            onChange={(e) => setUpgradeFormData({...upgradeFormData, name: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Upgrade name"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Description</Label>
                          <Textarea
                            value={upgradeFormData.description}
                            onChange={(e) => setUpgradeFormData({...upgradeFormData, description: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Upgrade description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Category</Label>
                            <Select
                              value={upgradeFormData.category}
                              onValueChange={(value) => setUpgradeFormData({...upgradeFormData, category: value})}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="lp_per_hour" className="text-white">LP per Hour</SelectItem>
                                <SelectItem value="energy" className="text-white">Energy</SelectItem>
                                <SelectItem value="lp_per_tap" className="text-white">LP per Tap</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-white">Base Cost</Label>
                            <Input
                              type="number"
                              value={upgradeFormData.baseCost}
                              onChange={(e) => setUpgradeFormData({...upgradeFormData, baseCost: parseInt(e.target.value) || 0})}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Base Effect</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={upgradeFormData.baseEffect}
                              onChange={(e) => setUpgradeFormData({...upgradeFormData, baseEffect: parseFloat(e.target.value) || 0})}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Level Requirement</Label>
                            <Input
                              type="number"
                              value={upgradeFormData.levelRequirement}
                              onChange={(e) => setUpgradeFormData({...upgradeFormData, levelRequirement: parseInt(e.target.value) || 1})}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingUpgrade(null)}
                            className="border-gray-600 text-white"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              createUpgradeMutation.mutate(upgradeFormData);
                              setEditingUpgrade(null);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={createUpgradeMutation.isPending}
                          >
                            {editingUpgrade.isNew ? 'Create' : 'Update'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TASKS TAB */}
            <TabsContent value="tasks" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "tasks" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg flex flex-col overflow-hidden p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Tasks & Challenges</h3>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </div>

                <Tabs defaultValue="daily" className="flex-1">
                  <TabsList className="grid grid-cols-3 bg-black/40">
                    <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Tasks</TabsTrigger>
                    <TabsTrigger value="special">Special Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="daily" className="flex-1 mt-4">
                    <div className="space-y-3">
                      {/* Sample daily tasks */}
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                Tap 100 times
                              </h4>
                              <p className="text-gray-400 text-sm">Tap characters 100 times to earn LP</p>
                              <div className="flex gap-2 mt-2">
                                <Badge className="bg-green-600/20 text-green-400">Reward: 500 LP</Badge>
                                <Badge className="bg-blue-600/20 text-blue-400">Daily</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold flex items-center gap-2">
                                <Heart className="w-4 h-4 text-pink-400" />
                                Chat with character
                              </h4>
                              <p className="text-gray-400 text-sm">Send 5 messages to any character</p>
                              <div className="flex gap-2 mt-2">
                                <Badge className="bg-green-600/20 text-green-400">Reward: 300 LP</Badge>
                                <Badge className="bg-blue-600/20 text-blue-400">Daily</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="weekly" className="flex-1 mt-4">
                    <EmptyState
                      title="No Weekly Tasks"
                      description="Create weekly challenges for your players"
                      icon={Zap}
                      action={
                        <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Weekly Task
                        </Button>
                      }
                    />
                  </TabsContent>

                  <TabsContent value="special" className="flex-1 mt-4">
                    <EmptyState
                      title="No Special Events"
                      description="Create special event tasks and challenges"
                      icon={Star}
                      action={
                        <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event Task
                        </Button>
                      }
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* ACHIEVEMENTS TAB */}
            <TabsContent value="achievements" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "achievements" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg flex flex-col overflow-hidden p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Achievements & Milestones</h3>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Achievement
                  </Button>
                </div>

                <div className="flex-1 overflow-auto space-y-4">
                  {/* Sample achievements */}
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-yellow-600/20 rounded-lg">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">First Steps</h4>
                            <p className="text-gray-400 text-sm mb-2">Complete your first character interaction</p>
                            <div className="flex gap-2">
                              <Badge className="bg-green-600/20 text-green-400">Reward: 1000 LP</Badge>
                              <Badge className="bg-yellow-600/20 text-yellow-400">Starter</Badge>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Progress: 0 / 1</div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-600/20 rounded-lg">
                            <Zap className="w-6 h-6 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">Tap Master</h4>
                            <p className="text-gray-400 text-sm mb-2">Tap 1000 times total</p>
                            <div className="flex gap-2">
                              <Badge className="bg-green-600/20 text-green-400">Reward: 2500 LP</Badge>
                              <Badge className="bg-purple-600/20 text-purple-400">Milestone</Badge>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Progress: 342 / 1000</div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '34.2%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-600/20 rounded-lg">
                            <Crown className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">VIP Experience</h4>
                            <p className="text-gray-400 text-sm mb-2">Unlock VIP content and reach level 10</p>
                            <div className="flex gap-2">
                              <Badge className="bg-green-600/20 text-green-400">Reward: 5000 LP + VIP Badge</Badge>
                              <Badge className="bg-red-600/20 text-red-400">Premium</Badge>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Progress: Locked</div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className="bg-gray-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* GAME TAB */}
            <TabsContent value="game" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "game" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg p-4 space-y-6">
                <h3 className="text-xl font-bold text-white">Game Configuration & Level Editor</h3>
                
                {/* Level Up Section */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      Player Level Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Player ID</Label>
                        <Input
                          placeholder="Enter player ID or select from list"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Levels to Add</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          defaultValue="1"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Level Up Player
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                        Get All Players
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Balance Settings */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-400" />
                      Balance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-white">Energy Recovery Rate</Label>
                        <Input
                          type="number"
                          defaultValue="5"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Base LP per Tap</Label>
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue="1.5"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Base LP per Hour</Label>
                        <Input
                          type="number"
                          defaultValue="250"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Save Balance Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset All Player Energy
                      </Button>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Database className="w-4 h-4 mr-2" />
                        Refresh Game Stats
                      </Button>
                      <Button className="bg-yellow-600 hover:bg-yellow-700">
                        <Star className="w-4 h-4 mr-2" />
                        Grant Bonus LP (All Players)
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Emergency Maintenance Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* DATABASE TAB */}
            <TabsContent value="database" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "database" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg flex items-center justify-center">
                <EmptyState
                  title="Database Management"
                  description="Monitor database health and run administrative queries"
                  icon={Database}
                  action={
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" disabled>
                      Coming Soon
                    </Button>
                  }
                />
              </div>
            </TabsContent>

            {/* SYSTEM TAB */}
            <TabsContent value="system" className="flex-1 overflow-hidden px-6 py-2 mt-0" data-state={activeTab === "system" ? "active" : "inactive"}>
              <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg p-4 space-y-6">
                <h3 className="text-xl font-bold text-white">System Settings & AI Debugger</h3>
                
                {/* AI Chat Debugger */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      MistralAI Chat Debugger
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Test AI responses and debug character interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Test Message</Label>
                      <Textarea
                        value={aiDebugMessage}
                        onChange={(e) => setAiDebugMessage(e.target.value)}
                        placeholder="Enter a message to test AI response..."
                        className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => aiDebugMutation.mutate(aiDebugMessage)}
                        disabled={aiDebugMutation.isPending || !aiDebugMessage.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {aiDebugMutation.isPending ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                        ) : (
                          <>Send Test Message</>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setAiDebugMessage('');
                          setAiDebugResponse('');
                        }}
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        Clear
                      </Button>
                    </div>
                    {aiDebugResponse && (
                      <div>
                        <Label className="text-white">AI Response</Label>
                        <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mt-2">
                          <p className="text-white whitespace-pre-wrap">{aiDebugResponse}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Info */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-400" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Server Status:</span>
                          <span className="text-green-400">Online</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Database:</span>
                          <span className="text-green-400">Connected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Characters:</span>
                          <span className="text-white">{characters.length}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Service:</span>
                          <span className="text-green-400">MistralAI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Upgrades:</span>
                          <span className="text-white">{upgrades.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Uptime:</span>
                          <span className="text-white">Running</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Server Actions */}
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-yellow-400" />
                      Server Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                        <Database className="w-4 h-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                        <Activity className="w-4 h-4 mr-2" />
                        View Logs
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                        <Settings className="w-4 h-4 mr-2" />
                        Export Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* EDIT CHARACTER DIALOG */}
        {showEditCharacter && selectedCharacter && (
          <Dialog open={showEditCharacter} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] bg-gradient-to-br from-gray-950 to-blue-950/30 text-white border-blue-500/30 overflow-hidden p-0">
              <DialogHeader className="p-6 pb-3 border-b border-blue-500/20">
                <DialogTitle className="text-x2 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  Edit Character: {selectedCharacter.name}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-auto flex-1 px-6 pb-6">
                <CharacterEditor
                  character={selectedCharacter}
                  isEditing={true}
                  onSuccess={handleEditSuccess}
                  onCancel={handleDialogClose}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}