import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  RotateCcw,
  Heart,
  Star,
  Crown,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Character, MediaFile } from "@shared/schema";

interface CharacterGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCharacterSelected?: (characterId: string) => void;
}

export default function CharacterGallery({ isOpen, onClose, userId, onCharacterSelected }: CharacterGalleryProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'vip' | 'event'>('all');
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch characters - using correct endpoint
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['/api/characters', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters');
      return await response.json();
    },
    enabled: isOpen
  });

  // Fetch character images - using correct endpoint and field names
  const { data: characterImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/media/character', selectedCharacter?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/media/character/${selectedCharacter?.id}`);
      return await response.json();
    },
    enabled: isOpen && !!selectedCharacter
  });

  // Character selection mutation
  const selectCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const response = await apiRequest("POST", `/api/player/${userId}/select-character`, {
        characterId
      });
      if (!response.ok) {
        throw new Error("Failed to select character");
      }
      return response.json();
    },
    onSuccess: (data, characterId) => {
      const character = characters.find((c: Character) => c.id === characterId);
      toast({
        title: "Character Selected!",
        description: `You've chosen ${character?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/character/selected", userId] });
      if (onCharacterSelected) {
        onCharacterSelected(characterId);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to select character. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter characters based on current filter
  const filteredCharacters = characters.filter((char: Character) => {
    switch (filter) {
      case 'unlocked': return char.isEnabled; // Use isEnabled instead of isUnlocked
      case 'locked': return !char.isEnabled;
      case 'vip': return char.isVip;
      case 'event': return false; // No event field exists, return false
      default: return true;
    }
  });

  const handleSelectCharacter = (characterId: string) => {
    if (!userId || userId === 'undefined') {
      toast({
        title: "Authentication Required",
        description: "Please log in to select a character.",
        variant: "destructive",
      });
      return;
    }
    
    const character = characters.find((c: Character) => c.id === characterId);
    if (!character?.isEnabled) {
      toast({
        title: "Character Locked",
        description: "This character is not yet unlocked.",
        variant: "destructive",
      });
      return;
    }
    selectCharacterMutation.mutate(characterId);
  };

  // Slideshow functionality
  useEffect(() => {
    if (isSlideshow && characterImages.length > 1) {
      slideshowRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % characterImages.length);
      }, slideshowSpeed);
    } else {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
    }

    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [isSlideshow, characterImages.length, slideshowSpeed]);

  // Reset image index when character changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsSlideshow(false);
  }, [selectedCharacter]);

  const nextImage = () => {
    if (characterImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % characterImages.length);
    }
  };

  const prevImage = () => {
    if (characterImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + characterImages.length) % characterImages.length);
    }
  };

  const getCharacterIcon = (char: Character) => {
    if (char.isVip) return <Crown className="w-3 h-3 text-yellow-400" />;
    if (char.levelRequirement && char.levelRequirement > 5) return <Star className="w-3 h-3 text-blue-400" />;
    return <Heart className="w-3 h-3 text-pink-400" />;
  };

  // Fixed image URL handling using correct MediaFile schema fields
  const getImageUrl = (media: MediaFile) => {
    if (media.filePath) return media.filePath.startsWith('/') ? media.filePath : `/uploads/${media.filePath}`;
    return media.fileName ? `/uploads/${media.fileName}` : '/uploads/placeholder-character.jpg';
  };

  const getCurrentImage = () => {
    if (characterImages.length === 0) return null;
    return characterImages[currentImageIndex];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] bg-black/95 backdrop-blur-lg text-white border-pink-500/50 overflow-hidden shadow-2xl shadow-pink-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Character Gallery
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-center">
            Select a character to interact with. Browse through available characters and choose your companion.
          </DialogDescription>
        </DialogHeader>

        {charactersLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading characters...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-[70vh]">
            {/* Character List */}
            <div className="w-64 space-y-4">
              <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
                <TabsList className="grid grid-cols-3 w-full bg-black/80 border border-pink-500/30">
                  <TabsTrigger value="all" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">All</TabsTrigger>
                  <TabsTrigger value="unlocked" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">Unlocked</TabsTrigger>
                  <TabsTrigger value="locked" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">Locked</TabsTrigger>
                </TabsList>
                <div className="flex gap-1 mt-2">
                  <Button 
                    size="sm" 
                    variant={filter === 'vip' ? 'default' : 'outline'}
                    onClick={() => setFilter('vip')}
                    className="flex-1"
                  >
                    <Crown className="w-3 h-3 mr-1" /> VIP
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filter === 'event' ? 'default' : 'outline'}
                    onClick={() => setFilter('event')}
                    className="flex-1"
                  >
                    <Sparkles className="w-3 h-3 mr-1" /> Event
                  </Button>
                </div>
              </Tabs>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCharacters.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No characters found</p>
                  </div>
                ) : (
                  filteredCharacters.map((char: Character) => (
                    <Card 
                      key={char.id}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedCharacter?.id === char.id 
                          ? 'ring-2 ring-pink-400 bg-pink-900/50 border-pink-400/50' 
                          : 'bg-black/60 hover:bg-black/80 border-gray-600/30'
                      }`}
                      onClick={() => setSelectedCharacter(char)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={char.avatarUrl?.startsWith('/') ? char.avatarUrl : `/uploads/${char.avatarUrl}` || char.imageUrl || '/uploads/placeholder-avatar.jpg'}
                            alt={char.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/uploads/placeholder-avatar.jpg';
                            }}
                          />
                          {!char.isEnabled && (
                            <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                              <Lock className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{char.name}</h3>
                            {getCharacterIcon(char)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <span>Req Level {char.levelRequirement || 1}</span>
                            {char.isEnabled ? (
                              <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                                <Unlock className="w-2 h-2 mr-1" /> Unlocked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                                <Lock className="w-2 h-2 mr-1" /> Locked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Image Showcase */}
            <div className="flex-1 space-y-4">
              {selectedCharacter ? (
                <>
                  {/* Character Info */}
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-pink-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {selectedCharacter.name}
                        {getCharacterIcon(selectedCharacter)}
                      </h2>
                      <div className="flex gap-2">
                        {selectedCharacter.isEnabled && onCharacterSelected && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectCharacter(selectedCharacter.id)}
                            disabled={selectCharacterMutation.isPending}
                            data-testid="button-select-character"
                          >
                            {selectCharacterMutation.isPending ? "Selecting..." : "Select Character"}
                          </Button>
                        )}
                        {characterImages.length > 1 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsSlideshow(!isSlideshow)}
                            >
                              {isSlideshow ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentImageIndex(0);
                                setIsSlideshow(false);
                              }}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm capitalize">
                      {selectedCharacter.personality} personality • 
                      {characterImages.length} image{characterImages.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Image Display */}
                  <div className="relative bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden border border-pink-500/30" style={{ height: '400px' }}>
                    {imagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                      </div>
                    ) : characterImages.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(getCurrentImage())}
                          alt={`${selectedCharacter.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/placeholder-character.jpg';
                          }}
                        />

                        {characterImages.length > 1 && (
                          <>
                            <Button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90"
                              size="sm"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90"
                              size="sm"
                              onClick={nextImage}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} / {characterImages.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                            <img
                              src={selectedCharacter.imageUrl?.startsWith('/') ? selectedCharacter.imageUrl : `/uploads/${selectedCharacter.imageUrl}` || '/uploads/placeholder-character.jpg'}
                              alt={selectedCharacter.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/uploads/placeholder-character.jpg';
                              }}
                            />
                          </div>
                          <p>No additional images available</p>
                          <p className="text-sm">Using default character image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {characterImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {characterImages.map((img: MediaFile, index: number) => (
                        <button
                          key={`thumbnail-${img.id}-${index}`}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-purple-400 ring-1 ring-purple-400' 
                              : 'border-transparent hover:border-white/30'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/uploads/placeholder-avatar.jpg';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">Select a character to view their gallery</p>
                    <p className="text-sm">Unlock more characters by leveling up!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

