import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Trash2,
  Edit,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";

const MOCK_USER_ID = "mock-user-id";

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
  const [uploadCategory, setUploadCategory] = useState<string>("character");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCharacter, setFilterCharacter] = useState<string>("all");

  // FIXED: Use React state for form fields instead of DOM access
  const [formFields, setFormFields] = useState({
    requiredLevel: 1,  // Fixed typo
    chatSendChance: 5,
    isNsfw: false,
    isVipOnly: false,
    isEventOnly: false,
    isWheelReward: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch media files - always enabled
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => fetch("/api/media").then((res) => res.json()),
  });

  // Fetch characters for assignment - always enabled
  const { data: characters = [] } = useQuery({
    queryKey: ["/api/admin/characters"],
    queryFn: () => fetch("/api/admin/characters").then((res) => res.json()),
  });

  // Upload mutation with better error handling
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: "Success",
        description: "Files uploaded successfully!",
        style: {
          backgroundColor: "#374151",
          color: "white",
          border: "1px solid #6b7280",
        },
      });
      setSelectedFiles(null);
      // Reset form fields
      setFormFields({
        requiredLevel: 1,
        chatSendChance: 5,
        isNsfw: false,
        isVipOnly: false,
        isEventOnly: false,
        isWheelReward: false,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        style: {
          backgroundColor: "#dc2626",
          color: "white",
          border: "1px solid #ef4444",
        },
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/media/${fileId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: "Success",
        description: "File deleted successfully!",
        style: {
          backgroundColor: "#374151",
          color: "white",
          border: "1px solid #6b7280",
        },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        style: {
          backgroundColor: "#dc2626",
          color: "white",
          border: "1px solid #ef4444",
        },
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
        style: {
          backgroundColor: "#dc2626",
          color: "white",
          border: "1px solid #ef4444",
        },
      });
      return;
    }

    const formData = new FormData();

    // Add files
    Array.from(selectedFiles).forEach((file) => {
      formData.append("images", file);
    });

    // Add metadata
    if (selectedCharacter && selectedCharacter !== "unassigned") {
      formData.append("characterId", selectedCharacter);
    }
    formData.append("userId", MOCK_USER_ID);
    formData.append("category", uploadCategory);
    formData.append("fileType", uploadCategory);

    // FIXED: Use state values instead of DOM access
    formData.append("requiredLevel", formFields.requiredLevel.toString());
    formData.append("chatSendChance", formFields.chatSendChance.toString());
    formData.append("isNsfw", formFields.isNsfw.toString());
    formData.append("isVipOnly", formFields.isVipOnly.toString());
    formData.append("isEventOnly", formFields.isEventOnly.toString());
    formData.append("isWheelReward", formFields.isWheelReward.toString());

    console.log("Upload form data:", {
      requiredLevel: formFields.requiredLevel,
      chatSendChance: formFields.chatSendChance,
      isNsfw: formFields.isNsfw,
      isVipOnly: formFields.isVipOnly,
      isEventOnly: formFields.isEventOnly,
      isWheelReward: formFields.isWheelReward,
    });

    uploadMutation.mutate(formData);
  };

  const handleDelete = (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(fileId);
    }
  };

  // Helper function to get file type icon
  const getFileIcon = (file: any) => {
    const mimeType = file.mimeType || "";
    if (mimeType.startsWith("video/")) {
      return <Video className="w-4 h-4" />;
    } else if (mimeType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  // Helper function to render media preview
  const renderMediaPreview = (file: any) => {
    const mimeType = file.mimeType || "";
    const src = file.url || file.path || `/uploads/${file.filename}`;

    if (mimeType.startsWith("video/")) {
      return (
        <video
          className="w-full h-full object-cover"
          muted
          loop
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
        >
          <source src={src} type={mimeType} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (mimeType.startsWith("image/") || mimeType.includes("gif")) {
      return (
        <img
          src={src}
          alt={file.originalName || file.filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn("Media failed to load:", src);
            const img = e.target as HTMLImageElement;
            if (!img.src.includes("default-character")) {
              img.src = "/public/default-character.jpg";
            }
          }}
        />
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <File className="w-8 h-8 text-gray-400" />
          <span className="text-xs text-gray-400 ml-2">Unknown File</span>
        </div>
      );
    }
  };

  // Custom checkbox component to avoid styling issues
  const CustomCheckbox = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center space-x-2">
      <div
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center ${
          checked
            ? "bg-purple-600 border-purple-600"
            : "bg-transparent border-white/20"
        }`}
        style={{
          backgroundColor: checked ? "#9333ea" : "transparent",
          borderColor: checked ? "#9333ea" : "rgba(255, 255, 255, 0.2)",
        }}
      >
        {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
      </div>
      <label
        onClick={() => onChange(!checked)}
        className="text-white text-sm cursor-pointer"
      >
        {label}
      </label>
    </div>
  );

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Character Assignment
              </label>
              <Select
                value={selectedCharacter}
                onValueChange={setSelectedCharacter}
              >
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="Select character (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    No specific character
                  </SelectItem>
                  {characters.map((char: any) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character Media</SelectItem>
                  <SelectItem value="avatar">Avatar</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="event">Event Media</SelectItem>
                  <SelectItem value="ui">UI Element</SelectItem>
                  <SelectItem value="video">Video Content</SelectItem>
                  <SelectItem value="misc">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>
          </div>

          {/* FIXED: Support for images, videos, and GIFs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.gif,.webm,.mp4,.mov,.avi,.mkv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="border border-white/20 rounded-lg p-4 space-y-4">
              <div className="text-white mb-2">
                Selected Files ({selectedFiles.length}):
              </div>
              <div className="space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <div
                    key={index}
                    className="text-gray-300 text-sm flex items-center gap-2"
                  >
                    {file.type.startsWith("video/") ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    <span className="text-xs text-purple-400">
                      {file.type.startsWith("video/")
                        ? "Video"
                        : file.type.startsWith("image/")
                          ? "Image"
                          : "Unknown"}
                    </span>
                  </div>
                ))}
              </div>

              {/* FIXED: Advanced Properties with React State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Required Level to Unlock
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formFields.requiredLevel}
                    onChange={(e) =>
                      setFormFields((prev) => ({
                        ...prev,
                        requiredLevel: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-black/30 border-white/20 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Random Chat Send Chance (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formFields.chatSendChance}
                    onChange={(e) =>
                      setFormFields((prev) => ({
                        ...prev,
                        chatSendChance: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="bg-black/30 border-white/20 text-white"
                  />
                </div>

                <CustomCheckbox
                  checked={formFields.isNsfw}
                  onChange={(checked) =>
                    setFormFields((prev) => ({ ...prev, isNsfw: checked }))
                  }
                  label="NSFW Content"
                />

                <CustomCheckbox
                  checked={formFields.isVipOnly}
                  onChange={(checked) =>
                    setFormFields((prev) => ({ ...prev, isVipOnly: checked }))
                  }
                  label="VIP Only"
                />

                <CustomCheckbox
                  checked={formFields.isEventOnly}
                  onChange={(checked) =>
                    setFormFields((prev) => ({ ...prev, isEventOnly: checked }))
                  }
                  label="Event Only"
                />

                <CustomCheckbox
                  checked={formFields.isWheelReward}
                  onChange={(checked) =>
                    setFormFields((prev) => ({
                      ...prev,
                      isWheelReward: checked,
                    }))
                  }
                  label="Wheel Reward"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="mt-4 bg-green-600 hover:bg-green-700 w-full"
              >
                {uploadMutation.isPending
                  ? "Uploading..."
                  : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Gallery */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Media Gallery</span>
            <div className="flex items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="character">Character Media</SelectItem>
                  <SelectItem value="avatar">Avatars</SelectItem>
                  <SelectItem value="background">Backgrounds</SelectItem>
                  <SelectItem value="event">Event Media</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="ui">UI Elements</SelectItem>
                  <SelectItem value="misc">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterCharacter}
                onValueChange={setFilterCharacter}
              >
                <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Filter by character" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Characters</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {characters.map((char: any) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-white text-center py-8">Loading media...</div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400">No media files found</div>
              <div className="text-gray-500 text-sm">
                Upload some images or videos to get started
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaFiles
                .filter(
                  (file: any) =>
                    (filterCategory === "all" ||
                      file.fileType === filterCategory) &&
                    (filterCharacter === "all" ||
                      (filterCharacter === "unassigned" && !file.characterId) ||
                      file.characterId === filterCharacter),
                )
                .map((file: any) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      {renderMediaPreview(file)}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white/50"
                          onClick={() =>
                            window.open(file.url || file.path, "_blank")
                          }
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-white mt-1 space-y-1">
                      <div className="truncate flex items-center gap-1">
                        {getFileIcon(file)}
                        {file.originalName || file.filename}
                      </div>
                      <div className="text-gray-400 flex justify-between">
                        <span className="capitalize">
                          {file.fileType || "media"}
                        </span>
                        {file.characterId && (
                          <span className="text-purple-400">
                            {characters.find(
                              (c: any) => c.id === file.characterId,
                            )?.name || "Unknown"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
