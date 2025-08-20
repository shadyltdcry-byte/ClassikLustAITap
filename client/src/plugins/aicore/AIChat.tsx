/**
 * AIChat.tsx - Enhanced AI Chat Interface
 * Last Edited: 2025-08-19 by Assistant
 * 
 * Integrated enhanced chat functionality with AI custom functions and enhanced chat modal features
 */

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Heart, Settings, Sparkles, MessageCircle, Bot, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
  type: 'text' | 'image' | 'gift';
  mood?: string;
  reactionScore?: number;
}

interface Character {
  id: string;
  name: string;
  personality: string;
  backstory?: string;
  mood: string;
  level: number;
  isNsfw: boolean;
  isVip: boolean;
  levelRequirement: number;
  customTriggers: unknown;
  createdAt: Date;
}

interface AIChatProps {
  userId?: string;
  selectedCharacterId?: string;
}

const MOODS = [
  { name: 'normal', emoji: '😊', color: 'bg-blue-500' },
  { name: 'happy', emoji: '😄', color: 'bg-yellow-500' },
  { name: 'flirty', emoji: '😘', color: 'bg-pink-500' },
  { name: 'playful', emoji: '😜', color: 'bg-green-500' },
  { name: 'mysterious', emoji: '😏', color: 'bg-purple-500' },
  { name: 'shy', emoji: '😳', color: 'bg-red-500' },
];

const QUICK_RESPONSES = [
  "Hi there! 👋",
  "How are you feeling today?",
  "Tell me about yourself",
  "What do you like to do?",
  "You look amazing! ✨",
  "Want to play a game?",
];

export default function AIChat({ userId = 'default-player', selectedCharacterId }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentMood, setCurrentMood] = useState("normal");
  const [characterMood, setCharacterMood] = useState("normal");
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch selected character
  const { data: selectedCharacter } = useQuery({
    queryKey: ["/api/character/selected", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/character/selected/${userId}`);
      return response.json();
    },
    enabled: !selectedCharacterId,
  });

  // Fetch specific character if provided
  const { data: specificCharacter } = useQuery({
    queryKey: ["/api/character", selectedCharacterId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/character/${selectedCharacterId}`);
      return response.json();
    },
    enabled: !!selectedCharacterId,
  });

  const character = specificCharacter || selectedCharacter;

  // Fetch chat messages
  const { data: chatHistory = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat", userId, character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const response = await apiRequest("GET", `/api/chat/${userId}/${character.id}`);
      const data = await response.json();
      return data;
    },
    enabled: !!character?.id,
    refetchOnWindowFocus: false,
  });

  // Load chat history on character change - prevent infinite loops
  useEffect(() => {
    if (!character?.id) {
      setMessages([]);
      return;
    }

    if (chatHistory && chatHistory.length > 0) {
      const formattedMessages = chatHistory.map((msg: any) => ({
        id: msg.id,
        content: msg.message || msg.content,
        sender: msg.isFromUser ? 'user' : 'character',
        timestamp: new Date(msg.createdAt),
        type: msg.type || 'text',
        mood: msg.mood,
        reactionScore: msg.reactionScore,
      }));
      setMessages(formattedMessages);
    } else if (chatHistory !== undefined && chatHistory.length === 0) {
      // Send initial greeting only when we have confirmed empty chat history
      const greeting = getCharacterGreeting();
      setMessages([{
        id: 'initial-greeting',
        content: greeting,
        sender: 'character',
        timestamp: new Date(),
        type: 'text',
        mood: 'happy',
      }]);
    }
  }, [chatHistory, character?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getCharacterGreeting = () => {
    if (!character) return "Hello! Nice to meet you!";
    
    const greetings = [
      `Hi there! I'm ${character.name}, it's so nice to meet you! 💕`,
      `Hello! ${character.name} here. How has your day been? ✨`,
      `*waves excitedly* I've been waiting to chat with you! 😊`,
      `Hey! Ready for some fun conversation? I'm ${character.name}! 🌟`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const generateSmartResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Greeting responses
    if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
      return `Hey! *smiles warmly* I'm so happy to see you! How's your day going? ✨`;
    }

    // Compliment responses
    if (input.includes('beautiful') || input.includes('pretty') || input.includes('cute')) {
      return "*blushes* Aww, thank you so much! You're so sweet! That really made my day! 😊💕";
    }

    // How are you responses
    if (input.includes('how are you') || input.includes('how do you feel')) {
      return `I'm doing amazing now that I'm talking to you! *giggles* You always know how to brighten my mood! 😄`;
    }

    // Question about character
    if (input.includes('tell me about') || input.includes('what do you like')) {
      return `Oh, I love so many things! I enjoy cozy conversations like this, and discovering new things about people I care about... like you! What about you? What makes you happy? 🌟`;
    }

    // Flirty responses
    if (input.includes('love') || input.includes('like you') || input.includes('special')) {
      return "*heart flutters* You're making me feel all warm and fuzzy inside! I really enjoy our time together too... you're quite special yourself! 💖";
    }

    // Default responses based on mood
    const responses = {
      normal: [
        "That's really interesting! Tell me more about that! 😊",
        "I love hearing your thoughts! You always have such unique perspectives! ✨",
        "Hmm, that's fascinating! I never thought about it that way before! 🤔",
      ],
      happy: [
        "That sounds absolutely wonderful! *bounces excitedly* I'm so happy for you! 😄✨",
        "Yay! That's amazing! Your enthusiasm is totally contagious! 🌟",
        "Oh my gosh, that's so cool! I love how excited you get about things! 😊💕",
      ],
      flirty: [
        "*gives you a playful wink* You're quite the charmer, aren't you? 😘",
        "Mmm, I like the way you think... *leans closer* tell me more! 💋",
        "You're being so sweet today... it's making my heart race! 💕😏",
      ],
      playful: [
        "Hehe, you're so silly! *playfully nudges you* I love that about you! 😜",
        "Ooh, are we being mischievous today? *grins* I like where this is going! 😈",
        "You crack me up! *giggles* Want to play a game or something fun? 🎮",
      ],
      mysterious: [
        "*smirks mysteriously* There's more to that story than meets the eye... 😏",
        "Interesting... *studies you intently* I sense there's something deeper here... 🔮",
        "Hmm... *tilts head thoughtfully* you're full of surprises, aren't you? ✨",
      ],
      shy: [
        "*looks down bashfully* That's... that's really sweet of you to say... 😳",
        "Um... *fidgets nervously* I'm not sure what to say to that... you're so kind! 🥺",
        "*hides face behind hands* You're making me all flustered! 😊💕",
      ],
    };

    const moodResponses = responses[characterMood as keyof typeof responses] || responses.normal;
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const getRandomMood = (): string => {
    const moods = ['normal', 'happy', 'flirty', 'playful', 'mysterious', 'shy'];
    return moods[Math.floor(Math.random() * moods.length)];
  };

  // Send message with Mistral AI
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Generate AI response using Mistral
      const response = await apiRequest("POST", "/api/mistral/chat", {
        message,
        characterName: character?.name || "Seraphina",
        characterPersonality: character?.personality || "playful",
        currentMood: characterMood,
        conversationHistory: messages.slice(-5).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      });
      
      const result = await response.json();
      return { result, originalMessage: message };
    },
    onSuccess: (data) => {
      const { result, originalMessage } = data;
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: originalMessage,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
        mood: currentMood,
      };

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: result.response || "I'm sorry, I didn't understand that.",
        sender: 'character',
        timestamp: new Date(),
        type: 'text',
        mood: result.mood || getRandomMood(),
        reactionScore: Math.floor(Math.random() * 10) + 1,
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setCharacterMood(aiMessage.mood || 'normal');
      setNewMessage("");
      
      toast({
        title: "Message sent!",
        description: `${character?.name} responded!`,
      });

      // Delay the query invalidation to prevent immediate overwrite
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat", userId, character?.id] });
      }, 1000);
    },
    onError: (error: any) => {
      console.error("AI Chat error:", error);
      // Fallback to local response generation
      handleLocalMessage();
    },
  });

  const handleLocalMessage = () => {
    const originalMessage = newMessage;
    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      content: originalMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      mood: currentMood,
    };

    setTypingIndicator(true);
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");

    setTimeout(() => {
      const response = generateSmartResponse(originalMessage);
      const characterMessage: ChatMessage = {
        id: `local-ai-${Date.now()}`,
        content: response,
        sender: 'character',
        timestamp: new Date(),
        type: 'text',
        mood: getRandomMood(),
        reactionScore: Math.floor(Math.random() * 10) + 1,
      };

      setMessages(prev => [...prev, characterMessage]);
      setCharacterMood(characterMessage.mood || 'normal');
      setTypingIndicator(false);
    }, Math.random() * 2000 + 1000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (character?.id) {
      sendMessageMutation.mutate(newMessage.trim());
    } else {
      handleLocalMessage();
    }
  };

  const handleQuickResponse = (response: string) => {
    setNewMessage(response);
  };

  const getMoodInfo = (mood: string) => {
    return MOODS.find(m => m.name === mood) || MOODS[0];
  };

  const formatTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!character) {
    return (
      <Card className="bg-black/20 border-purple-500/30">
        <CardContent className="py-12 text-center">
          <div className="space-y-4">
            <div className="text-white">
              <Heart className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-lg font-semibold">No Character Selected</h3>
              <p className="text-gray-400">Select a character to start chatting!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 bg-black/30 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-purple-600 text-white">
              {character.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{character.name}</h3>
              <Badge variant="secondary" className={`capitalize ${getMoodInfo(characterMood).color} text-white`}>
                {getMoodInfo(characterMood).emoji}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">Online • Loves to chat</p>
            <p className="text-xs text-purple-300">Have conversations with your favorite character.</p>
          </div>
        </div>
      </div>

      {/* Chat Tabs */}
      <div className="flex gap-2 p-4 bg-black/20">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full">
          💬 Chat
        </Button>
        <Button variant="outline" className="border-yellow-500 text-yellow-400 px-6 py-2 rounded-full">
          😊 Moods
        </Button>
        <Button variant="outline" className="border-red-500 text-red-400 px-6 py-2 rounded-full">
          🎁 Gifts
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.mood && (
                          <Badge className={`text-xs ${getMoodInfo(message.mood).color} text-white`}>
                            {getMoodInfo(message.mood).emoji}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Avatar className={`w-8 h-8 ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                    <AvatarFallback className={message.sender === 'user' ? 'bg-purple-600' : 'bg-gray-600'}>
                      {message.sender === 'user' ? 'U' : character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ))}
              {typingIndicator && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-600">{character.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-700 text-white rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          <div className="p-4 bg-black/20 border-t border-purple-500/30">
            <p className="text-sm text-gray-400 mb-2">Quick responses:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_RESPONSES.map((response, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickResponse(response)}
                  className="text-xs border-gray-600 text-gray-300 hover:bg-purple-600/20 rounded-full"
                >
                  {response}
                </Button>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${character.name}...`}
                className="bg-black/50 border-gray-600 text-white rounded-full"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}