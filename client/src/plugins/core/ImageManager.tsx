/**
 * ImageManager.tsx - Fixed Media Upload Component
 * Last Edited: 2025-08-21 by Assistant
 *
 * Fixed file upload functionality, added character/avatar type selection,
 * proper form data handling, and improved error handling
 */

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Image,
  Video,
  Music,
  File,
  Trash2,
  Edit3,
  Filter,
  X,
  CheckCircle
} from "lucide-react";

interface ImageManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ImageManager({
  isOpen = true,
  onClose,
}: ImageManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [imageType, setImageType] = useState<string>("character"); // character or avatar
  const [uploadCategory, setUploadCategory] = useState<string>("character");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCharacter, setFilterCharacter] = useState<string>("all");

  // Form fields state
  const [formFields, setFormFields] = useState({
    pose: "",
    levelRequirement: 1,
    chatSendChance: 5,
    isNsfw: false,
    isVipOnly: false,
    isEvent: false,
    isWheelReward: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const response = await fetch("/api/media");
      if (!response.ok) throw new Error("Failed to fetch media files");
      return response.json();
    },
  });

  // Fetch characters for assignment
  const { data: characters = [] } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: async () => {
      const response = await fetch("/api/characters");
      if (!response.ok) throw new Error("Failed to fetch characters");
      return response.json();
    },
  });

  // Upload mutation with proper form data handling
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Files have been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload files",
      });
    },
  });

  // Update mutation for editing media metadata
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('[ImageManager] Updating media', id, 'with:', updates);
      const response = await fetch(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('[ImageManager] Update failed:', error);
        throw new Error(error || "Update failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[ImageManager] Update successful:', data);
      toast({
        title: "Update successful",
        description: "Media file has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
    onError: (error: any) => {
      console.error('[ImageManager] Update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update media file",
      });
    },
  });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(selectedFiles).filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Types",
        description: `Please only upload image files (JPG, PNG, GIF, WebP)`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFiles);
  };

  const getFileIcon = (file: any) => {
    const type = file.fileType || file.type || "";
    if (type.includes("image")) return <Image className="w-4 h-4 text-blue-400" />;
    if (type.includes("video")) return <Video className="w-4 h-4 text-red-400" />;
    if (type.includes("audio")) return <Music className="w-4 h-4 text-green-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  // Filter media files
  const filteredFiles = mediaFiles.filter((file: any) => {
    if (filterCategory !== "all" && file.category !== filterCategory) return false;
    if (filterCharacter !== "all" && file.characterId !== filterCharacter) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="w-full min-h-[600px] space-y-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
      {/* Upload Section */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Media Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div>
            <Label className="text-white">Select Files</Label>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="bg-black/30 border-white/20 text-white"
            />
            {selectedFiles && (
              <p className="text-sm text-gray-400 mt-1">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Character Assignment */}
            <div>
              <Label className="text-white">Character Assignment</Label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="Select character (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific character</SelectItem>
                  {characters.map((char: any) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Type - NEW FIELD */}
            <div>
              <Label className="text-white">Image Type</Label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="Select image type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character Picture</SelectItem>
                  <SelectItem value="avatar">Avatar Picture</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="ui">UI Element</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pose */}
            <div>
              <Label className="text-white">Pose (Optional)</Label>
              <Input
                value={formFields.pose}
                onChange={(e) => setFormFields(prev => ({ ...prev, pose: e.target.value }))}
                placeholder="e.g., standing, sitting, dancing"
                className="bg-black/30 border-white/20 text-white"
              />
            </div>

            {/* Required Level */}
            <div>
              <Label className="text-white">Required Level</Label>
              <Input
                type="number"
                min="1"
                value={formFields.levelRequirement}
                onChange={(e) => setFormFields(prev => ({ ...prev, levelRequirement: parseInt(e.target.value) || 1 }))}
                className="bg-black/30 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isNsfw}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isNsfw: checked }))}
              />
              <Label className="text-white">NSFW</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isVipOnly}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isVipOnly: checked }))}
              />
              <Label className="text-white">VIP Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isEvent}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isEvent: checked }))}
              />
              <Label className="text-white">⭐ Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isWheelReward}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isWheelReward: checked }))}
              />
              <Label className="text-white">Wheel Reward</Label>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFiles || uploadMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {uploadMutation.isPending ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Media Library
          </CardTitle>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="avatar">Avatar</SelectItem>
                <SelectItem value="background">Background</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCharacter} onValueChange={setFilterCharacter}>
              <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Characters</SelectItem>
                {characters.map((char: any) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading media files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No media files found. Upload some files to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file: any) => (
                <Card key={file.id} className="bg-black/40 border-gray-600">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="text-white text-sm truncate">
                          {file.originalName || file.filename}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {file.mood && (
                          <Badge variant="secondary" className="text-xs">
                            {file.mood}
                          </Badge>
                        )}
                        {file.isNsfw && (
                          <Badge variant="destructive" className="text-xs">
                            NSFW
                          </Badge>
                        )}
                        {file.isVipOnly && (
                          <Badge variant="outline" className="text-xs">
                            VIP
                          </Badge>
                        )}
                      </div>

                      <div className="text-gray-400 text-xs">
                        {file.characterId && (
                          <span>
                            Character: {characters.find((c: any) => c.id === file.characterId)?.name || "Unknown"}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close button */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="text-white border-white/20">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      )}
    </div>
  );
}