console.log("AdminMenu instance rendering:", Math.random());
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
import type { Character } from "@shared/schema";

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
            src={character.imageUrl || '/api/placeholder/64/64'} 
            alt={character.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/api/placeholder/64/64';
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

  // Filter characters based on search and filters
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-gradient-to-br from-gray-950 via-blue-950/50 to-black w-full max-w-7xl h-[95vh] rounded-2xl border border-blue-500/20 flex flex-col shadow-2xl shadow-blue-500/10">

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
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">

            {/* Tab Navigation */}
            <div className="px-6 py-3 border-b border-gray-800/50">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 bg-black/40 p-1 rounded-lg">
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
            <TabsContent value="characters" className="flex-1 flex flex-col min-h-0 px-6 py-4">
              {/* Character Submenu */}
              <div className="flex items-center gap-2 mb-4">
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
                  <div className="flex gap-4 mb-4 p-4 bg-black/20 rounded-lg border border-gray-800/50">
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
                  <div className="grid grid-cols-3 gap-4 mb-4">
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
                  <div className="flex-1 bg-black/20 border border-gray-800/50 rounded-lg flex flex-col overflow-hidden">
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
            <TabsContent value="media" className="flex-1 flex flex-col min-h-0 px-6 py-4">
              <div className="flex-1 bg-black/20 border border-gray-800/50 rounded-lg overflow-hidden">
                <FileManagerCore />
              </div>
            </TabsContent>

            {/* OTHER TABS */}
            {["upgrades", "tasks", "achievements", "game", "database", "system"].map((tabName) => (
              <TabsContent key={tabName} value={tabName} className="flex-1 overflow-hidden px-6 py-4">
                <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg flex items-center justify-center">
                  <EmptyState
                    title={`${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Management`}
                    description={`Configure and manage ${tabName} settings, rules, and data`}
                    icon={tabName === "upgrades" ? Star : 
                          tabName === "tasks" ? Zap :
                          tabName === "achievements" ? Trophy :
                          tabName === "game" ? Activity :
                          tabName === "database" ? Database : Settings}
                    action={
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                        size="sm"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    }
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* EDIT CHARACTER DIALOG */}
        {showEditCharacter && selectedCharacter && (
          <Dialog open={showEditCharacter} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-3xl max-h-[95vh] bg-gradient-to-br from-gray-950 to-blue-950/30 text-white border-blue-500/30 overflow-hidden p-0">
              <DialogHeader className="p-6 pb-3 border-b border-blue-500/20">
                <DialogTitle className="text-xl flex items-center gap-3">
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