import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Send, Image, Gift, Sparkles, MessageCircle, Bot, User as UserIcon } from "lucide-react";
import type { User, Character } from "@shared/schema";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
  type: 'text' | 'image' | 'gift';
  mood?: string;
  reactionScore?: number;
}

interface EnhancedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  user: User;
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

// Define MOCK_USER_ID as it's used in the original code context for game components, though not directly in this chat modal.
// Assuming it's a placeholder that would be replaced by the actual user ID in a real game scenario.
const MOCK_USER_ID = "mock-user-123"; 

export default function EnhancedChatModal({ isOpen, onClose, characterId, characterName, user }: EnhancedChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState('normal');
  const [characterMood, setCharacterMood] = useState('normal');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch character data
  const { data: character } = useQuery<Character>({
    queryKey: ["/api/character", characterId],
    enabled: isOpen && !!characterId,
  });

  // Fetch chat history
  const { data: chatHistory } = useQuery({
    queryKey: ["/api/chat/history", characterId, user.id],
    enabled: isOpen,
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const formattedMessages = chatHistory.map((msg: any) => ({
        id: msg.id,
        content: msg.message || msg.content,  // Try both message and content fieldsandomM   sender: msg.isFromUser ? 'user' : 'character',  // Use isFromUser field
        timestamp: new Date(msg.createdAt),
        type: msg.type || 'text',
        mood: msg.mood,
        reactionScore: msg.reactionScore,
      }));
      setMessages(formattedMessages);
    } else {
      // Send initial greeting
      const greeting = getCharacterGreeting();
      setMessages([{
        id: 'initial',
        content: greeting,
        sender: 'character',
        timestamp: new Date(),
        type: 'text',
        mood: 'happy',
      }]);
    }
  }, [chatHistory, user.id]);

  const getCharacterGreeting = () => {
    const greetings = [
      `Hi ${user.username}! I'm ${characterName}, it's so nice to meet you! 💕`,
      `Hello there! ${characterName} here. How has your day been? ✨`,
      `*waves excitedly* ${user.username}! I've been waiting to chat with you! 😊`,
      `Hey ${user.username}! Ready for some fun conversation? I'm ${characterName}! 🌟`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        characterId,
        userId: user.id,
        message: message,  // Changed from 'content' to 'message'
        mood: selectedMood,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Clear the input immediately
      setCurrentMessage("");

      // Add user message from API response
      if (data.userMessage) {
        const userMessage: ChatMessage = {
          id: data.userMessage.id,
          content: data.userMessage.message,
          sender: 'user',
          timestamp: new Date(data.userMessage.createdAt),
          type: 'text',
          mood: selectedMood,
        };
        setMessages(prev => [...prev, userMessage]);
      }

      // Add AI response from API
      if (data.aiResponse) {
        const characterMessage: ChatMessage = {
          id: data.aiResponse.id,
          content: data.aiResponse.message,
          sender: 'character',
          timestamp: new Date(data.aiResponse.createdAt),
          type: 'text',
          mood: getRandomMood(),
          reactionScore: Math.floor(Math.random() * 10) + 1,
        };
        setMessages(prev => [...prev, characterMessage]);
        setCharacterMood(characterMessage.mood || 'normal');

        // Update relationship points (removed popup notification)
      }

      // Invalidate chat history to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history", characterId, user.id] });
    },
    onError: () => {
      // Fallback to local response generation
      handleLocalMessage();
    },
  });

  const handleLocalMessage = () => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(), 
      content: customMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      mood: selectedMood,
    };

    setIsTyping(true);
    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const response = generateSmartResponse(currentMessage);
      const characterMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'character',
        timestamp: new Date(),
        type: 'text',
        mood: getandomMMood(),
        reactionScore: Math.floor(Math.random() * 10) + 1,
      };

      setMessages(prev => [...prev, characterMessage]);
      setCharacterMood(characterMessage.mood || 'normal');
      setIsTyping(false);
    }, Math.random() * 2000 + 1000);

    setCurrentMessage("");
  };

  const generateSmartResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Greeting responses
    if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
      return `Hey ${user.username}! *smiles warmly* I'm so happy to see you! How's your day going? ✨`;
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
      return `Oh, I love so many things! I enjoy cozy conversations like this, stargazing, and discovering new things about people I care about... like you! What about you? What makes you happy? 🌟`;
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

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    sendMessageMutation.mutate(currentMessage);
  };

  const handleQuickResponse = (response: string) => {
    setCurrentMessage(response);
  };

  const getMoodInfo = (mood: string) => {
    return MOODS.find(m => m.name === mood) || MOODS[0];
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white border-purple-500/30 p-0">
        <DialogTitle className="sr-only">Chat with Character</DialogTitle>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-400">
              <img 
                src={character?.imageUrl || '/api/placeholder-image'} 
                alt={characterName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {characterName}
                <Badge className={`${getMoodInfo(characterMood).color} text-white`}>
                  {getMoodInfo(characterMood).emoji} {characterMood}
                </Badge>
              </div>
              <div className="text-sm text-gray-300 font-normal">
                Online • 
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-white/70">
              Chat now to start personalizing your relationship with {characterName}</DialogDescription>
      </DialogHeader>
        <div className="flex-1 p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
              <TabsTrigger value="chat" className="text-white data-[state=active]:bg-purple-600">
                💬 Chat
              </TabsTrigger>
              <TabsTrigger value="moods" className="text-white data-[state=active]:bg-purple-600">
                😊 Moods
              </TabsTrigger>
              <TabsTrigger value="gifts" className="text-white data-[state=active]:bg-purple-600">
                🎁 Gifts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              {/* Messages Area */}
              <ScrollArea className="h-96 w-full bg-black/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.sender === 'user' 
                          ? 'bg-purple-600 text-white rounded-l-lg rounded-tr-lg' 
                          : 'bg-gray-700 text-white rounded-r-lg rounded-tl-lg'
                      } p-3 shadow-lg`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === 'character' ? (
                            <Bot className="w-4 h-4 text-pink-400" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-blue-400" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.sender === 'character' ? characterName : user.username}
                          </span>
                          {message.mood && message.sender === 'character' && (
                            <span className="text-xs">
                              {getMoodInfo(message.mood).emoji}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.reactionScore && message.sender === 'character' && (
                          <div className="flex items-center gap-1 mt-2">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-red-400">+{message.reactionScore}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-white rounded-r-lg rounded-tl-lg p-3 shadow-lg max-w-xs">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-pink-400" />
                          <span className="text-xs opacity-70">{characterName}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-400 ml-2">{characterName} is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Responses */}
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Quick responses:</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_RESPONSES.map((response, index) => (
                    <Button
                      key={index}
                      onClick={() => handleQuickResponse(response)}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                    >
                      {response}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Message ${characterName}...`}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-12"
                    disabled={sendMessageMutation.isPending}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className={`w-3 h-3 rounded-full ${getMoodInfo(selectedMood).color}`} />
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="moods" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {MOODS.map((mood) => (
                  <Button
                    key={mood.name}
                    onClick={() => setSelectedMood(mood.name)}
                    variant={selectedMood === mood.name ? "default" : "outline"}
                    className={`h-20 flex flex-col items-center justify-center ${
                      selectedMood === mood.name 
                        ? `${mood.color} text-white` 
                        : 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-xs capitalize">{mood.name}</span>
                  </Button>
                ))}
              </div>
              <div className="text-center text-sm text-gray-300">
                Your selected mood affects how {characterName} perceives your messages
              </div>
            </TabsContent>

            <TabsContent value="gifts" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <Gift className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Virtual Flowers</div>
                    <div className="text-gray-400 text-sm">5 LP</div>
                    <Button size="sm" className="mt-2 bg-pink-600 hover:bg-pink-700">
                      Send Gift
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Premium Photo</div>
                    <div className="text-gray-400 text-sm">25 LP</div>
                    <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                      Send Gift
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}