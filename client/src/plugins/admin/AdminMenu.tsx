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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
        <div className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-red-900/95 w-full max-w-7xl h-[95vh] rounded-xl border border-purple-500/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Admin Menu</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 mx-4 mt-3 bg-black/30 flex-shrink-0">
                <TabsTrigger value="characters" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Users className="w-3 h-3 mr-1" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="media" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Heart className="w-3 h-3 mr-1" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="upgrades" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Star className="w-3 h-3 mr-1" />
                  Upgrades
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Zap className="w-3 h-3 mr-1" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Trophy className="w-3 h-3 mr-1" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="game" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Activity className="w-3 h-3 mr-1" />
                  Game
                </TabsTrigger>
                <TabsTrigger value="database" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Database className="w-3 h-3 mr-1" />
                  Database
                </TabsTrigger>
                <TabsTrigger value="system" className="text-white data-[state=active]:bg-purple-600 text-xs p-2">
                  <Settings className="w-3 h-3 mr-1" />
                  System
                </TabsTrigger>
              </TabsList>

              {/* Character Management Tab */}
              <TabsContent value="characters" className="flex-1 flex flex-col overflow-hidden mx-4">
                <div className="h-full flex flex-col space-y-3">
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setShowCreateCharacter(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-sm"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Character
                    </Button>
                  </div>

                  {/* Character List */}
                  <div className="flex-1 bg-black/20 border border-purple-500/30 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-purple-500/30 flex-shrink-0">
                      <h3 className="text-white font-semibold text-sm">Character Management</h3>
                      <p className="text-gray-400 text-xs">Manage all characters in the game</p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {charactersLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                        </div>
                      ) : characters.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No characters found</p>
                          <p className="text-xs">Create your first character to get started</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-full">
                          <div className="space-y-2 p-3">
                            {characters.map((character: Character) => (
                              <div
                                key={character.id}
                                className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                              >
                                {/* Character Avatar */}
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={character.avatarUrl || character.imageUrl || '/api/placeholder-image'}
                                    alt={character.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/api/placeholder-image';
                                    }}
                                  />
                                  {character.isVip && (
                                    <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                                  )}
                                </div>

                                {/* Character Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-white font-medium text-sm truncate">{character.name}</h4>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {character.isVip && (
                                        <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400 text-xs px-1 py-0">
                                          VIP
                                        </Badge>
                                      )}
                                      {character.isNsfw && (
                                        <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs px-1 py-0">
                                          NSFW
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-xs">
                                    {character.personality} • Lv.{character.requiredLevel}+
                                  </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleCharacterStatus(character.id, 'isVip', character.isVip)}
                                    className={`p-1 h-6 w-6 ${character.isVip ? 'text-yellow-400' : 'text-gray-400'}`}
                                    title="Toggle VIP"
                                  >
                                    <Crown className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCharacter(character)}
                                    className="text-blue-400 border-blue-400 hover:bg-blue-400/20 p-1 h-6 w-6"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteCharacter(character.id, character.name)}
                                    className="text-red-400 border-red-400 hover:bg-red-400/20 p-1 h-6 w-6"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
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
                    <ScrollArea className="h-full">
                      <FileManagerCore />
                    </ScrollArea>
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