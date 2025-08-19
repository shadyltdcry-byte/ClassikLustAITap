/**
 * * AIChat.tsx *
 * * Last Edited: 2025-08-17 by Steven 
 *
 *
 * Verify chat interface, basic message sending,
 * mood awareness.
 * 
 * Please leave a detailed description      
 * of each function you add
 */

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Send,
  Image,
  Heart,
  Settings,
  Trash2,
  RefreshCw,
  Camera,
  Smile,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { saveConversation as saveToDB, fetchConversations as fetchFromDB } from '@/plugins/manager/GameManagerDB.tsx';

interface ChatMessage {
  id: string;
  userId: string;
  characterId: string;
  message: string;
  isFromUser: boolean;
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  avatarUrl: string;
  personality: string;
  chatStyle: string;
  personalityStyle: string;
  moodDistribution: {
    normal: number;
    happy: number;
    flirty: number;
    playful: number;
    mysterious: number;
    shy: number;
  };
  responseTimeMin: number;
  responseTimeMax: number;
  randomPictureSending: boolean;
  pictureSendChance: number;
  customGreetings: string[];
  customResponses: string[];
  customTriggerWords: any[];
  likes: string;
  dislikes: string;
  isNsfw: boolean;
}

interface AIChatProps {
  userId: string;
  selectedCharacterId?: string;
}

export function AIChat({ userId, selectedCharacterId }: AIChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [chatSettings, setChatSettings] = useState({
    autoRespond: true,
    responseDelay: true,
    pictureSending: true,
    moodAdaptation: true,
  });
  const [currentMood, setCurrentMood] = useState("normal");
  const [typingIndicator, setTypingIndicator] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch selected character
  const { data: selectedCharacter } = useQuery({
    queryKey: ["/api/character/selected", userId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/character/selected/${userId}`,
      );
      return response.json();
    },
    enabled: !selectedCharacterId,
  });

  // Fetch specific character if provided
  const { data: specificCharacter } = useQuery({
    queryKey: ["/api/character", selectedCharacterId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/character/${selectedCharacterId}`,
      );
      return response.json();
    },
    enabled: !!selectedCharacterId,
  });

  const character = specificCharacter || selectedCharacter;

  const [conversations, setConversations] = useState<any[]>([]); // Add proper typing if available
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);

  const playerId = userId || 'defaultPlayerId'; // Replace with actual player ID logic if necessary

  // Function to load conversations from the database
  const loadConversations = async () => {
    try {
      const conversations = await fetchFromDB(playerId);
      setConversations(conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Function to save the current conversation to the database
  const saveCurrentConversation = async (conversation: any) => {
    try {
      await saveToDB(playerId, conversation);
      await loadConversations(); // Refresh conversations after saving
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  // Fetch chat messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["/api/chat", userId, character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const response = await apiRequest(
        "GET",
        `/api/chat/${userId}/${character.id}`,
      );
      const data = await response.json();
      console.log("Chat messages loaded:", data);
      return data;
    },
    enabled: !!character?.id,
    refetchInterval: 3000, // Poll more frequently
    staleTime: 500, // Consider data fresh for shorter time
    gcTime: 1000 * 60 * 2, // Shorter cache time
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!character?.id) throw new Error("No character selected");
      const response = await apiRequest("POST", "/api/chat/send", {
        userId,
        characterId: character.id,
        message,
        isFromUser: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setNewMessage("");
      queryClient.invalidateQueries({
        queryKey: ["/api/chat", userId, character?.id],
      });
      // Multiple refresh attempts to ensure we get the latest data
      setTimeout(() => {
        refetchMessages();
      }, 100);
      setTimeout(() => {
        refetchMessages();
      }, 1000);
      toast({
        title: "Message sent!",
        description: data.aiResponse?.message
          ? `${character?.name} responded!`
          : "Message delivered",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/chat/${userId}/${character?.id}`,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat", userId, character?.id],
      });
      toast({ title: "Success", description: "Chat history cleared!" });
    },
  });

  // Existing utility functions and handlers
  const generateAIResponse = (userMessage: string): string => {
    if (!character) return "I'm not sure how to respond right now.";
    // Check for trigger words
    const lowerMessage = userMessage.toLowerCase();
    for (const trigger of character.customTriggerWords || []) {
      if (lowerMessage.includes(trigger.word?.toLowerCase())) {
        return trigger.response;
      }
    }
    // Generate response based on mood and personality
    const currentMoodKey = getMoodBasedOnDistribution();
    const responses = getResponsesForMood(currentMoodKey);
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getMoodBasedOnDistribution = (): string => {
    if (!character?.moodDistribution) return "normal";
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [mood, percentage] of Object.entries(character.moodDistribution)) {
      cumulative += percentage;
      if (rand <= cumulative) {
        return mood;
      }
    }
    return "normal";
  };

  const getResponsesForMood = (mood: string): string[] => {
    if (!character) return ["I understand!"];
    const moodResponses: Record<string, string[]> = {
      normal: character.customResponses?.length
        ? character.customResponses
        : [
            "I understand what you mean.",
            "That's interesting to hear.",
            "I appreciate you sharing that with me.",
          ],
      happy: [
        "That makes me so happy! 😊",
        "Yay! I love hearing good news! ✨",
        "You always know how to brighten my day! 💕",
      ],
      flirty: [
        "You're so sweet... 😘",
        "I love talking with someone as charming as you 💖",
        "You always make my heart flutter~ 💕",
      ],
      playful: [
        "Hehe, you're so silly! 😄",
        "Let's have some fun together! 🎉",
        "I love your playful side! 😋",
      ],
      mysterious: [
        "There's more to this than meets the eye...",
        "Interesting... very interesting indeed.",
        "Some things are better left unsaid... for now.",
      ],
      shy: [
        "Um... th-thank you for saying that...",
        "I'm not sure what to say... *blushes*",
        "You're really kind... 😊",
      ],
    };
    return moodResponses[mood] || moodResponses.normal;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !character) return;
    const newConversation = {
      id: Date.now().toString(),
      messages: [{ sender: 'user', text: newMessage.trim(), timestamp: new Date().toISOString() }],
    };
    saveCurrentConversation(newConversation);
    sendMessageMutation.mutate(newMessage.trim()); // Keep existing API-driven logic
    setNewMessage("");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    loadConversations(); // Load conversations when component mounts
  }, []);

  // Auto-scroll and other existing effects

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!character?.moodDistribution) return;
    const interval = setInterval(() => {
      if (chatSettings.moodAdaptation) {
        setCurrentMood(getMoodBasedOnDistribution());
      }
    }, 30000); // Update mood every 30 seconds
    return () => clearInterval(interval);
  }, [character, chatSettings.moodAdaptation]);

  // Existing JSX
  if (!character) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Character Selected</h3>
              <p>Select a character to start chatting!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Character Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={character.avatarUrl || character.imageUrl} alt={character.name} />
              <AvatarFallback>{character.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{character.name}</h3>
                <Badge variant="secondary" className="capitalize">
                  {currentMood}
                </Badge>
                {character.isNsfw && <Badge variant="destructive">NSFW</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{character.bio}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{character.personalityStyle}</Badge>
                <Badge variant="outline">{character.chatStyle}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chat Settings</DialogTitle>
                    <DialogDescription>
                      Customize your chat experience with {character.name}
                    </DialogDescription>
                  </DialogHeader>
                  <ChatSettingsDialog
                    settings={chatSettings}
                    onSettingsChange={setChatSettings}
                    character={character}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearChatMutation.mutate()}
                disabled={clearChatMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Chat Area and other existing JSX */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat with {character.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {character.responseTimeMin === character.responseTimeMax ? (
                <span>{character.responseTimeMin}s response time</span>
              ) : (
                <span>
                  {character.responseTimeMin}-{character.responseTimeMax}s response time
                </span>
              )}
              {character.randomPictureSending && (
                <Badge variant="outline">
                  <Camera className="h-3 w-3 mr-1" />
                  {character.pictureSendChance}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="space-y-2">
                    <Smile className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h4 className="font-semibold">Start a conversation</h4>
                    <p className="text-sm text-muted-foreground">
                      Send a message to {character.name} to get started!
                    </p>
                    {character.customGreetings?.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-xs text-muted-foreground">Quick starters:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {character.customGreetings.slice(0, 3).map((greeting, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setNewMessage(greeting)}
                            >
                              {greeting}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((message: ChatMessage) => (
                  <div key={message.id} className={`flex gap-3 ${message.isFromUser ? "justify-end" : ""}`}>
                    {!message.isFromUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={character.avatarUrl || character.imageUrl} alt={character.name} />
                        <AvatarFallback>{character.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${message.isFromUser ? "order-first" : ""}`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        message.isFromUser
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                    {message.isFromUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              {typingIndicator && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={character.avatarUrl || character.imageUrl} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder={`Message ${character.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatSettingsDialog({
  settings,
  onSettingsChange,
  character,
}: {
  settings: any;
  onSettingsChange: (settings: any) => void;
  character: Character;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-respond">Auto AI Responses</Label>
            <p className="text-sm text-muted-foreground">Automatically generate AI responses</p>
          </div>
          <Switch
            id="auto-respond"
            checked={settings.autoRespond}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, autoRespond: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="response-delay">Response Delay</Label>
            <p className="text-sm text-muted-foreground">
              Realistic typing delays ({character.responseTimeMin}-{character.responseTimeMax}s)
            </p>
          </div>
          <Switch
            id="response-delay"
            checked={settings.responseDelay}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, responseDelay: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="picture-sending">Picture Sending</Label>
            <p className="text-sm text-muted-foreground">
              Allow random picture sending ({character.pictureSendChance}% chance)
            </p>
          </div>
          <Switch
            id="picture-sending"
            checked={settings.pictureSending}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, pictureSending: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="mood-adaptation">Mood Adaptation</Label>
            <p className="text-sm text-muted-foreground">
              Dynamic mood changes during conversation
            </p>
          </div>
          <Switch
            id="mood-adaptation"
            checked={settings.moodAdaptation}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, moodAdaptation: checked })}
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-base font-semibold">Character Personality</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(character.moodDistribution || {}).map(([mood, percentage]) => (
            <div key={mood} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm capitalize">{mood}</span>
              <Badge variant="outline">{percentage}%</Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-base font-semibold">Character Preferences</Label>
        <div className="space-y-2">
          <div>
            <Label className="text-sm text-green-600">Likes:</Label>
            <p className="text-sm">{character.likes || "Nothing specified"}</p>
          </div>
          <div>
            <Label className="text-sm text-red-600">Dislikes:</Label>
            <p className="text-sm">{character.dislikes || "Nothing specified"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
