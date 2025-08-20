
/**
 * AdminMenu.tsx
 * Last Edited: 2025-08-19 by Le Chat
 *
 * Complete admin menu with character management, game controls, and system settings.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  PowerOff,
  Crown,
  Heart,
  Settings,
  Users,
  Database,
  Activity,
  Star,
  Zap,
  Trophy
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

export default function AdminMenu({ onClose }: AdminMenuProps) {
  const [activeTab, setActiveTab] = useState("characters");
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Game management state
  const [playerModifiers, setPlayerModifiers] = useState({
    lp: 0,
    energy: 0,
    lustGems: 0,
    level: 1
  });

  const queryClient = useQueryClient();

  // Fetch characters
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ["/api/admin/characters"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/characters");
      return await response.json();
    },
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/characters/${characterId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Character deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: () => {
      toast.error("Failed to delete character");
    },
  });

  // Toggle character status mutation
  const toggleCharacterMutation = useMutation({
    mutationFn: async ({ characterId, field, value }: { characterId: string; field: string; value: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/characters/${characterId}`, {
        [field]: value
      });
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Character updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: () => {
      toast.error("Failed to update character");
    },
  });

  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShowEditCharacter(true);
  };

  const handleDeleteCharacter = (characterId: string, characterName: string) => {
    if (confirm(`Are you sure you want to delete "${characterName}"? This action cannot be undone.`)) {
      deleteCharacterMutation.mutate(characterId);
    }
  };

  const handleToggleCharacterStatus = (characterId: string, field: string, currentValue: boolean) => {
    toggleCharacterMutation.mutate({
      characterId,
      field,
      value: !currentValue
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-red-900/95 w-full max-w-6xl max-h-[90vh] rounded-xl border border-purple-500/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Admin Menu</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-8 mx-6 mt-4 bg-black/30">
                <TabsTrigger value="characters" className="text-white data-[state=active]:bg-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="media" className="text-white data-[state=active]:bg-purple-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="upgrades" className="text-white data-[state=active]:bg-purple-600">
                  <Star className="w-4 h-4 mr-2" />
                  Upgrades
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-purple-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-purple-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="game" className="text-white data-[state=active]:bg-purple-600">
                  <Activity className="w-4 h-4 mr-2" />
                  Game
                </TabsTrigger>
                <TabsTrigger value="database" className="text-white data-[state=active]:bg-purple-600">
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </TabsTrigger>
                <TabsTrigger value="system" className="text-white data-[state=active]:bg-purple-600">
                  <Settings className="w-4 h-4 mr-2" />
                  System
                </TabsTrigger>
              </TabsList>

              {/* Character Management Tab */}
              <TabsContent value="characters" className="flex-1 overflow-hidden mx-6">
                <div className="h-full flex flex-col space-y-4">
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCreateCharacter(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Character
                    </Button>
                  </div>

                  {/* Character List */}
                  <Card className="flex-1 bg-black/20 border-purple-500/30 min-h-0">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="text-white">Character Management</CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage all characters in the game. Edit properties, toggle status, or delete characters.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-4">
                      {charactersLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                        </div>
                      ) : characters.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No characters found</p>
                          <p className="text-sm">Create your first character to get started</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2 pr-4">
                            {characters.map((character: Character) => (
                              <div
                                key={character.id}
                                className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                              >
                                {/* Character Avatar */}
                                <div className="relative">
                                  <img
                                    src={character.avatarUrl || character.imageUrl || '/api/placeholder-image'}
                                    alt={character.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/api/placeholder-image';
                                    }}
                                  />
                                  {character.isVip && (
                                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                                  )}
                                </div>

                                {/* Character Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-white font-semibold">{character.name}</h3>
                                    <div className="flex gap-1">
                                      {character.isVip && (
                                        <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                                          VIP
                                        </Badge>
                                      )}
                                      {character.isNsfw && (
                                        <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                                          NSFW
                                        </Badge>
                                      )}
                                      {character.isEvent && (
                                        <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                                          Event
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {character.personality} • Level {character.requiredLevel}+ required
                                  </p>
                                  <p className="text-gray-500 text-xs line-clamp-1">
                                    {character.bio || character.description || "No description"}
                                  </p>
                                </div>

                                {/* Quick Toggle Controls */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleCharacterStatus(character.id, 'isVip', character.isVip)}
                                    className={`p-2 ${character.isVip ? 'text-yellow-400 hover:bg-yellow-400/20' : 'text-gray-400 hover:text-yellow-400'}`}
                                    title="Toggle VIP Status"
                                  >
                                    <Crown className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleCharacterStatus(character.id, 'isNsfw', character.isNsfw)}
                                    className={`p-2 ${character.isNsfw ? 'text-red-400 hover:bg-red-400/20' : 'text-gray-400 hover:text-red-400'}`}
                                    title="Toggle NSFW Status"
                                  >
                                    <Heart className="w-4 h-4" />
                                  </Button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCharacter(character)}
                                    className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteCharacter(character.id, character.name)}
                                    className="text-red-400 border-red-400 hover:bg-red-400/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Media Management Tab */}
              <TabsContent value="media" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-white">Media Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload, organize, and manage character images and videos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-full overflow-auto">
                    <FileManagerCore />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upgrades Management Tab */}
              <TabsContent value="upgrades" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-white">Upgrade Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create, edit, and manage game upgrades.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Upgrade
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">Increase Intellect</h3>
                          <p className="text-sm text-gray-400">LP per Hour: 150 | Base Cost: 1500</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">Energy Boost</h3>
                          <p className="text-sm text-gray-400">Max Energy: +100 | Base Cost: 2000</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Management Tab */}
              <TabsContent value="tasks" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-white">Task Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create, edit, and manage game tasks and objectives.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Task
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">Daily Login</h3>
                          <p className="text-sm text-gray-400">Reward: 50 LP | Difficulty: Easy</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">Tap Master</h3>
                          <p className="text-sm text-gray-400">Reward: 200 LP | Difficulty: Medium</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Management Tab */}
              <TabsContent value="achievements" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-white">Achievement Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create, edit, and manage game achievements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Achievement
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">First Steps</h3>
                          <p className="text-sm text-gray-400">Category: Beginner | Reward: 100 LP</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">Tap Master</h3>
                          <p className="text-sm text-gray-400">Category: Interaction | Reward: 500 LP</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Game Management Tab */}
              <TabsContent value="game" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white">Game Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control game settings and player modifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Add LP</Label>
                        <Input
                          type="number"
                          value={playerModifiers.lp}
                          onChange={(e) => setPlayerModifiers(prev => ({ ...prev, lp: parseInt(e.target.value) || 0 }))}
                          placeholder="Amount to add"
                          className="bg-black/30 border-purple-500/30 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Add Energy</Label>
                        <Input
                          type="number"
                          value={playerModifiers.energy}
                          onChange={(e) => setPlayerModifiers(prev => ({ ...prev, energy: parseInt(e.target.value) || 0 }))}
                          placeholder="Amount to add"
                          className="bg-black/30 border-purple-500/30 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Add Lust Gems</Label>
                        <Input
                          type="number"
                          value={playerModifiers.lustGems}
                          onChange={(e) => setPlayerModifiers(prev => ({ ...prev, lustGems: parseInt(e.target.value) || 0 }))}
                          placeholder="Amount to add"
                          className="bg-black/30 border-purple-500/30 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Set Level</Label>
                        <Input
                          type="number"
                          value={playerModifiers.level}
                          onChange={(e) => setPlayerModifiers(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                          placeholder="Player level"
                          className="bg-black/30 border-purple-500/30 text-white"
                        />
                      </div>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Apply Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Database Tab */}
              <TabsContent value="database" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white">Database Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Database operations and maintenance tools.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                        Backup Database
                      </Button>
                      <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                        Export Characters
                      </Button>
                      <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                        Import Characters
                      </Button>
                      <Button variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white">
                        Reset Game Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Tab */}
              <TabsContent value="system" className="flex-1 overflow-hidden mx-6">
                <Card className="bg-black/20 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white">System Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      System configuration and server management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <Label className="text-white">Maintenance Mode</Label>
                        <p className="text-sm text-gray-400">Disable game for maintenance</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <Label className="text-white">Debug Mode</Label>
                        <p className="text-sm text-gray-400">Enable detailed logging</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <Label className="text-white">AI Chat Enabled</Label>
                        <p className="text-sm text-gray-400">Allow AI character interactions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Character Creation Modal */}
      {showCreateCharacter && (
        <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
          <DialogContent className="max-w-5xl max-h-[95vh] bg-gray-900 text-white border-purple-500/50 overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-1 px-6 pb-6">
              <CharacterCreation
                onSuccess={() => {
                  setShowCreateCharacter(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
                }}
                onCancel={() => setShowCreateCharacter(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Character Edit Modal */}
      {showEditCharacter && selectedCharacter && (
        <Dialog open={showEditCharacter} onOpenChange={setShowEditCharacter}>
          <DialogContent className="max-w-5xl max-h-[95vh] bg-gray-900 text-white border-purple-500/50 overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Edit Character: {selectedCharacter.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-1 px-6 pb-6">
              <CharacterEditor
                character={selectedCharacter}
                isEditing={true}
                onSuccess={() => {
                  setShowEditCharacter(false);
                  setSelectedCharacter(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
                }}
                onCancel={() => {
                  setShowEditCharacter(false);
                  setSelectedCharacter(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
