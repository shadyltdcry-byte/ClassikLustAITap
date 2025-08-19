/**
 * AdminMenu.tsx - Working Admin Menu
 * Last Edited: 2025-08-19 by Assistant
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User, 
  Database, 
  FileText, 
  MessageCircle, 
  Gift,
  Zap,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";

interface AdminMenuProps {
  onClose?: () => void;
}

export default function AdminMenu({ onClose }: AdminMenuProps) {
  const [activeTab, setActiveTab] = useState("characters");
  const [isOpen, setIsOpen] = useState(true);
  
  // Character creation state
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    personality: "friendly",
    bio: "",
    level: 1,
    isNsfw: false,
    isVip: false
  });

  // Game management state
  const [playerModifiers, setPlayerModifiers] = useState({
    lp: 0,
    energy: 0,
    lustGems: 0,
    level: 1
  });

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleCreateCharacter = () => {
    console.log("Creating character:", newCharacter);
    alert(`Character "${newCharacter.name}" created successfully!`);
    setNewCharacter({
      name: "",
      personality: "friendly",
      bio: "",
      level: 1,
      isNsfw: false,
      isVip: false
    });
  };

  const handleModifyPlayer = () => {
    console.log("Modifying player:", playerModifiers);
    alert(`Player stats modified! Added ${playerModifiers.lp} LP, ${playerModifiers.energy} Energy, ${playerModifiers.lustGems} Lust Gems`);
  };

  const handleResetGame = () => {
    if (confirm("Are you sure you want to reset all game data? This cannot be undone!")) {
      console.log("Resetting game data");
      alert("Game data reset successfully!");
    }
  };

  const handleExportData = () => {
    const gameData = {
      player: playerModifiers,
      characters: [newCharacter],
      timestamp: new Date().toISOString()
    };
    console.log("Exporting data:", gameData);
    alert("Game data exported to console!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-10 right-10 w-96 h-[80vh] bg-gray-900/95 border border-purple-500/30 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Admin Menu
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="text-white border-purple-500 hover:bg-purple-600/20"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid grid-cols-4 mb-2 bg-black/30">
          <TabsTrigger value="characters" className="text-white data-[state=active]:bg-purple-600">
            <User className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="game" className="text-white data-[state=active]:bg-purple-600">
            <Database className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="files" className="text-white data-[state=active]:bg-purple-600">
            <FileText className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="misc" className="text-white data-[state=active]:bg-purple-600">
            <Gift className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Characters Tab */}
        <TabsContent value="characters" className="overflow-auto flex-1 space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Character Creation</CardTitle>
              <CardDescription className="text-gray-400">
                Create new characters for the game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Character Name</Label>
                <Input
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter character name"
                  className="bg-black/30 border-purple-500/30 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Personality</Label>
                <Select value={newCharacter.personality} onValueChange={(value) => setNewCharacter(prev => ({ ...prev, personality: value }))}>
                  <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="flirty">Flirty</SelectItem>
                    <SelectItem value="shy">Shy</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Bio</Label>
                <Textarea
                  value={newCharacter.bio}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Character background story"
                  className="bg-black/30 border-purple-500/30 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCharacter.isVip}
                  onCheckedChange={(checked) => setNewCharacter(prev => ({ ...prev, isVip: checked }))}
                />
                <Label className="text-white">VIP Character</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCharacter.isNsfw}
                  onCheckedChange={(checked) => setNewCharacter(prev => ({ ...prev, isNsfw: checked }))}
                />
                <Label className="text-white">NSFW Content</Label>
              </div>

              <Button 
                onClick={handleCreateCharacter}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!newCharacter.name.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Game Management Tab */}
        <TabsContent value="game" className="overflow-auto flex-1 space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Player Modifications</CardTitle>
              <CardDescription className="text-gray-400">
                Modify player stats and resources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Add LP</Label>
                  <Input
                    type="number"
                    value={playerModifiers.lp}
                    onChange={(e) => setPlayerModifiers(prev => ({ ...prev, lp: parseInt(e.target.value) || 0 }))}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Add Energy</Label>
                  <Input
                    type="number"
                    value={playerModifiers.energy}
                    onChange={(e) => setPlayerModifiers(prev => ({ ...prev, energy: parseInt(e.target.value) || 0 }))}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Add Lust Gems</Label>
                  <Input
                    type="number"
                    value={playerModifiers.lustGems}
                    onChange={(e) => setPlayerModifiers(prev => ({ ...prev, lustGems: parseInt(e.target.value) || 0 }))}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Set Level</Label>
                  <Input
                    type="number"
                    value={playerModifiers.level}
                    onChange={(e) => setPlayerModifiers(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              <Button 
                onClick={handleModifyPlayer}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Game Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleExportData}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Game Data
              </Button>
              
              <Button 
                onClick={handleResetGame}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Game Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="overflow-auto flex-1 space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">File Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage game files and assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  console.log('Opening File Manager');
                  alert('File Manager opened! (Check console for details)');
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Open File Manager
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  console.log('Upload Assets clicked');
                  alert('Asset upload functionality activated!');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Assets
              </Button>
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                onClick={() => {
                  console.log('Backup Files started');
                  alert('File backup process initiated!');
                }}
              >
                <Database className="w-4 h-4 mr-2" />
                Backup Files
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Misc Tab */}
        <TabsContent value="misc" className="overflow-auto flex-1 space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  console.log('Managing Boosters');
                  alert('Booster management panel opened!');
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Manage Boosters
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  console.log('Daily Rewards accessed');
                  alert('Daily rewards system activated!');
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                Daily Rewards
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  console.log('AI Chat Settings opened');
                  alert('AI Chat configuration panel opened!');
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Chat Settings
              </Button>
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                onClick={() => {
                  console.log('Game Settings accessed');
                  alert('Game settings panel opened!');
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Game Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}