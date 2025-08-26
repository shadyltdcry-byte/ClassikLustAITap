/**
 * FileManagerCore.tsx - Media management UI
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * Verify CRUD for media, character assignments,
 * NSFW/VIP tags
 *
 * ⚠️ DO Not ADD LOGIC TO GAME.TSX
 */

/**
 * FileManagerCore.tsx - Media management UI
 * Last Edited: 2025-08-18 by Assistant
 *
 * Fixed schema imports, added proper error handling,
 * improved UI components, and added character assignment functionality
 *
 * ⚠️ DO Not ADD LOGIC TO GAME.TSX
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaFile, Character } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

interface FileManagerCoreProps {
  onClose?: () => void;
}

const FileManagerCore: React.FC<FileManagerCoreProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [folderStructure, setFolderStructure] = useState<Record<string, MediaFile[]>>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Upload configuration state
  const [uploadConfig, setUploadConfig] = useState({
    characterId: '',
    mood: '',
    requiredLevel: 1,
    isVip: false,
    isNsfw: false,
    isEvent: false,
    randomSendChance: 5,
    category: 'Character' // New category field
  });

  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles = [], isLoading: filesLoading, refetch } = useQuery<MediaFile[]>({
    queryKey: ['/api/media'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/media');
      return await response.json();
    },
  });

  // Fetch characters for assignment
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters');
      return await response.json();
    },
  });

  // Upload mutation
    const uploadMutation = useMutation({
      mutationFn: async (formData: FormData) => {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        return await response.json();
      },
    onSuccess: (uploadedFiles) => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast.success(`Successfully uploaded ${Array.isArray(uploadedFiles) ? uploadedFiles.length : 1} file(s)`);
      setUploadProgress(0);
      setSelectedFiles([]);
      refetch(); // Ensure the list is refreshed
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
      setUploadProgress(0);
    },
  });

  // Update file metadata mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaFile> }) => {
      const response = await apiRequest('PUT', `/api/media/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast.success('File updated successfully');
      setEditingFile(null);
    },
    onError: (error) => {
      console.error('Update failed:', error);
      toast.error('Failed to update file');
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/media/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast.success('File deleted successfully');
      setSelectedFile(null);
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    },
  });

  // Organize files by category whenever mediaFiles changes
  useEffect(() => {
    if (mediaFiles.length > 0) {
      organizeFilesByCategory(mediaFiles);
    }
  }, [mediaFiles]);

  /**
   * Organizes media files into folders based on their properties
   * Creates a hierarchical structure for better file management
   */
  const organizeFilesByCategory = (files: MediaFile[]) => {
    const folders: Record<string, MediaFile[]> = {};
    files.forEach((file) => {
      const folderName = getFolderName(file);
      if (!folders[folderName]) folders[folderName] = [];
      folders[folderName].push(file);
    });
    setFolderStructure(folders);
  };

  /**
   * Generates folder name based on file properties
   * Creates a consistent naming convention for organization
   */
  const getFolderName = (file: MediaFile): string => {
    const parts = [];
    if (file.characterId) {
      const character = characters.find((c: Character) => c.id === file.characterId);
      parts.push(`Character_${character?.name || file.characterId}`);
    }
    if (file.mood) parts.push(`Mood_${file.mood}`);
    if (file.isVip) parts.push('VIP');
    if (file.isNsfw) parts.push('NSFW');
    return parts.join('/') || 'Uncategorized';
  };

  /**
   * Handles file upload with progress tracking
   * Supports multiple file selection and validation
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
    }
  };

  const handleSubmitUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    // Validate file types - support all common image and video formats
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/avi'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Some files were skipped due to invalid format');
    }

    if (validFiles.length === 0) {
      toast.error('No valid files selected');
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append('files', file);
    });

    // Add upload configuration
    formData.append('config', JSON.stringify(uploadConfig));

    setUploadProgress(10); // Set initial progress to give feedback
    // Simulate upload progress for demonstration if needed, otherwise rely on backend for actual progress
    // For actual progress, you'd need to use a library that supports upload progress events with fetch or Axios
    // For now, we'll just call the mutation
    uploadMutation.mutate(formData);
  };


  /**
   * Renders appropriate preview based on file type
   * Handles images, videos, and GIFs with proper styling
   */
  const renderMediaPreview = (file: MediaFile, size: 'thumbnail' | 'full' = 'thumbnail') => {
    const maxWidth = size === 'thumbnail' ? '150px' : '100%';
    const maxHeight = size === 'thumbnail' ? '150px' : '400px';

    const commonStyles = {
      maxWidth,
      maxHeight,
      objectFit: 'cover' as const,
      borderRadius: '8px',
    };

    // Handle both old and new file data formats
    const fileName = file.fileName || (file as any).filename || '';
    
    // Handle both old and new file path formats
    const filePath = file.filePath || (file as any).filepath || (file as any).url;
    const fileUrl = filePath?.startsWith('/') 
      ? filePath 
      : filePath 
        ? `/uploads/${filePath}` 
        : fileName 
          ? `/uploads/${fileName}` 
          : '/uploads/placeholder-character.jpg';
    const fileExt = fileName.toLowerCase().split('.').pop() || '';
    
    // Better file type detection - check fileType field and filename extension
    const isImage = file.fileType === 'image' || 
                   file.fileType === 'gif' || 
                   ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt);
    const isVideo = file.fileType === 'video' || 
                   ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(fileExt);

    if (isImage) {
      return (
        <img
          src={fileUrl}
          alt="Media preview"
          style={commonStyles}
          onError={(e) => {
            console.log('Image failed to load:', fileUrl);
            (e.target as HTMLImageElement).src = '/uploads/placeholder-character.jpg';
          }}
        />
      );
    } else if (isVideo) {
      return (
        <video controls style={commonStyles}>
          <source src={fileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <div style={{ ...commonStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#374151' }}>
        <span className="text-white text-xs">Type: {file.fileType || fileExt || 'unknown'}</span>
      </div>
    );
  };

  /**
   * Updates file metadata including character assignment and tags
   */
  const handleFileUpdate = (updates: Partial<MediaFile>) => {
    if (editingFile) {
      updateFileMutation.mutate({
        id: editingFile.id,
        updates,
      });
    }
  };

  if (filesLoading) {
    return <div className="flex justify-center p-8">Loading media files...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {onClose && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Media Manager</h1>
          <Button onClick={onClose} variant="outline" className="text-white border-white">
            Close
          </Button>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Media Manager</h1>
        <p className="text-gray-400">Upload, organize, and manage your character media files</p>
      </div>

      {/* Upload Section */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Upload Media Files</CardTitle>
          <CardDescription className="text-gray-400">
            Supported formats: JPEG, PNG, GIF, MP4, WebM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <Label className="text-white mb-2 block">Select Files</Label>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept="image/*,video/*,image/gif"
                className="bg-gray-700 border-gray-600 text-white file:bg-purple-600 file:text-white file:border-none file:rounded"
                disabled={uploadMutation.isPending}
              />
            </div>

            {/* Upload Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Assign to Character</Label>
                <Select
                  value={uploadConfig.characterId}
                  onValueChange={(value) => setUploadConfig(prev => ({ ...prev, characterId: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select character (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">Unassigned</SelectItem>
                    {characters.map((character: Character) => (
                      <SelectItem key={character.id} value={character.id} className="text-white">
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Dropdown */}
              <div>
                <Label className="text-white">Content Category</Label>
                <Select
                  value={uploadConfig.category}
                  onValueChange={(value) => setUploadConfig(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Character" className="text-white">Character</SelectItem>
                    <SelectItem value="Avatar" className="text-white">Avatar</SelectItem>
                    <SelectItem value="Misc" className="text-white">Misc</SelectItem>
                    <SelectItem value="Event" className="text-white">Event</SelectItem>
                    <SelectItem value="Other" className="text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Mood</Label>
                <Select
                  value={uploadConfig.mood}
                  onValueChange={(value) => setUploadConfig(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select mood (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">No mood</SelectItem>
                    <SelectItem value="normal" className="text-white">Normal</SelectItem>
                    <SelectItem value="happy" className="text-white">Happy</SelectItem>
                    <SelectItem value="flirty" className="text-white">Flirty</SelectItem>
                    <SelectItem value="playful" className="text-white">Playful</SelectItem>
                    <SelectItem value="mysterious" className="text-white">Mysterious</SelectItem>
                    <SelectItem value="shy" className="text-white">Shy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Required Level</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={uploadConfig.requiredLevel}
                  onChange={(e) => setUploadConfig(prev => ({ ...prev, requiredLevel: parseInt(e.target.value) || 1 }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Random Send Chance (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={uploadConfig.randomSendChance}
                  onChange={(e) => setUploadConfig(prev => ({ ...prev, randomSendChance: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white">VIP Content</Label>
                  <p className="text-xs text-gray-400">Requires premium access</p>
                </div>
                <Switch
                  checked={uploadConfig.isVip}
                  onCheckedChange={(checked) => setUploadConfig(prev => ({ ...prev, isVip: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white">NSFW Content</Label>
                  <p className="text-xs text-gray-400">18+ content</p>
                </div>
                <Switch
                  checked={uploadConfig.isNsfw}
                  onCheckedChange={(checked) => setUploadConfig(prev => ({ ...prev, isNsfw: checked }))}
                />
              </div>

              {/* Removed Event Content Switch - replaced with dropdown below */}
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="text-sm text-gray-300 p-3 bg-gray-700/50 rounded-lg">
                <p className="font-medium mb-2">Selected Files ({selectedFiles.length}):</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleSubmitUpload}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
            >
              {uploadMutation.isPending ? 'Uploading...' : selectedFiles.length > 0 ? `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}` : 'Choose Files First'}
            </Button>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Browser */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="folders">Folder View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.isArray(mediaFiles) && mediaFiles.length > 0 ? (
              mediaFiles.map((file: MediaFile) => (
                <Card
                  key={file.id}
                  className="bg-gray-800/50 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent className="p-2">
                    {renderMediaPreview(file)}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white truncate" title={`ID: ${file.id}, Type: ${file.fileType || 'missing'}, Path: ${file.filePath || (file as any).filepath || (file as any).url || 'missing'}`}>
                        {file.fileName || (file as any).filename || `File ${file.id.slice(0, 8)}`}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {file.isVip && (
                          <span className="text-xs bg-yellow-600 text-white px-1 rounded">VIP</span>
                        )}
                        {file.isNsfw && (
                          <span className="text-xs bg-red-600 text-white px-1 rounded">NSFW</span>
                        )}
                        {file.mood && (
                          <span className="text-xs bg-blue-600 text-white px-1 rounded">{file.mood}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No media files found. Upload some files to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          {Object.entries(folderStructure).length > 0 ? (
            Object.entries(folderStructure).map(([folderName, files]) => (
              <Card key={folderName} className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{folderName}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {files.length} file(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedFile(file)}
                      >
                        {renderMediaPreview(file)}
                        <p className="text-xs text-white mt-1 truncate">
                          {file.fileName || `File ${file.id.slice(0, 8)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No files organized into folders yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-600 max-w-4xl w-full h-[90vh] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">
                  {selectedFile.fileName || 'Media File'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingFile(selectedFile)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate(selectedFile.id)}
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="outline"
                    className="border-gray-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex justify-center">
                {renderMediaPreview(selectedFile, 'full')}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>Type: {selectedFile.fileType || 'N/A'}</div>
                <div>Character: {
                  selectedFile.characterId
                    ? characters.find((c: Character) => c.id === selectedFile.characterId)?.name || 'Unknown'
                    : 'Unassigned'
                }</div>
                <div>Mood: {selectedFile.mood || 'None'}</div>
                <div>VIP: {selectedFile.isVip ? 'Yes' : 'No'}</div>
                <div>NSFW: {selectedFile.isNsfw ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit File Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-600 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle className="text-white">Edit File Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto p-6">
              <div>
                <Label className="text-white">Assign to Character</Label>
                <Select
                  value={editingFile.characterId || ''}
                  onValueChange={(value) => setEditingFile({...editingFile, characterId: value || null})} // Ensure it's null if empty for backend
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">Unassigned</SelectItem>
                    {characters.map((character: Character) => (
                      <SelectItem key={character.id} value={character.id} className="text-white">
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Mood</Label>
                <Select
                  value={editingFile.mood || ''}
                  onValueChange={(value) => setEditingFile({...editingFile, mood: value || null})} // Ensure it's null if empty for backend
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">No mood</SelectItem>
                    <SelectItem value="normal" className="text-white">Normal</SelectItem>
                    <SelectItem value="happy" className="text-white">Happy</SelectItem>
                    <SelectItem value="flirty" className="text-white">Flirty</SelectItem>
                    <SelectItem value="playful" className="text-white">Playful</SelectItem>
                    <SelectItem value="mysterious" className="text-white">Mysterious</SelectItem>
                    <SelectItem value="shy" className="text-white">Shy</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingFile.isVip || false}
                    onCheckedChange={(checked) => setEditingFile({...editingFile, isVip: checked})}
                  />
                  <Label className="text-white">VIP Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingFile.isNsfw || false}
                    onCheckedChange={(checked) => setEditingFile({...editingFile, isNsfw: checked})}
                  />
                  <Label className="text-white">NSFW Content</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setEditingFile(null)}
                  variant="outline"
                  className="border-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFileUpdate(editingFile)}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={updateFileMutation.isPending}
                >
                  {updateFileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FileManagerCore;