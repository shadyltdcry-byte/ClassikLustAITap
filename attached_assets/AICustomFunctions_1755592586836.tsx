import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Save, Plus, Trash2, Brain, Bot, Settings2, Zap, MessageCircle } from "lucide-react";

interface AISettings {
  characterId: string;
  personalityTraits: string[];
  moodDistribution: {
    normal: number;
    happy: number;
    flirty: number;
    playful: number;
    mysterious: number;
    shy: number;
    confident: number;
    romantic: number;
  };
  responseSettings: {
    minResponseTime: number;
    maxResponseTime: number;
    responseDelay: number;
    contextMemory: number;
    creativity: number;
    consistency: number;
  };
  triggerWords: string[];
  customGreetings: string[];
  customResponses: string[];
  pictureSendChance: number;
  randomPictureSending: boolean;
  adaptiveResponses: boolean;
  learningMode: boolean;
  emotionalIntelligence: number;
  conversationStyle: string;
  preferredTopics: string[];
  avoidedTopics: string[];
}

interface AICustomFunctionsProps {
  isOpen: boolean;
  onClose: () => void;
  characterId?: string;
}

const defaultAISettings: AISettings = {
  characterId: "",
  personalityTraits: [],
  moodDistribution: {
    normal: 70,
    happy: 15,
    flirty: 10,
    playful: 5,
    mysterious: 0,
    shy: 0,
    confident: 0,
    romantic: 0,
  },
  responseSettings: {
    minResponseTime: 1,
    maxResponseTime: 3,
    responseDelay: 2000,
    contextMemory: 10,
    creativity: 70,
    consistency: 80,
  },
  triggerWords: [],
  customGreetings: [],
  customResponses: [],
  pictureSendChance: 5,
  randomPictureSending: false,
  adaptiveResponses: true,
  learningMode: false,
  emotionalIntelligence: 75,
  conversationStyle: "casual",
  preferredTopics: [],
  avoidedTopics: [],
};

export default function AICustomFunctions({ isOpen, onClose, characterId = "" }: AICustomFunctionsProps) {
  const [aiSettings, setAiSettings] = useState<AISettings>(defaultAISettings);
  const [activeTab, setActiveTab] = useState("personality");
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [newGreeting, setNewGreeting] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newTrait, setNewTrait] = useState("");
  const [newPreferredTopic, setNewPreferredTopic] = useState("");
  const [newAvoidedTopic, setNewAvoidedTopic] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (characterId) {
      setAiSettings(prev => ({ ...prev, characterId }));
    }
  }, [characterId]);

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: AISettings) => 
      apiRequest(`/api/characters/${characterId}/ai-settings`, "POST", settings),
    onSuccess: () => {
      toast.success("AI settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to save AI settings");
      console.error("Save error:", error);
    },
  });

  const updateSetting = (key: keyof AISettings, value: any) => {
    setAiSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateMoodDistribution = (mood: string, value: number) => {
    setAiSettings(prev => ({
      ...prev,
      moodDistribution: {
        ...prev.moodDistribution,
        [mood]: value,
      },
    }));
  };

  const updateResponseSettings = (key: string, value: number) => {
    setAiSettings(prev => ({
      ...prev,
      responseSettings: {
        ...prev.responseSettings,
        [key]: value,
      },
    }));
  };

  const addItem = (arrayKey: keyof AISettings, value: string, setValue: (value: string) => void) => {
    if (value.trim()) {
      const currentArray = aiSettings[arrayKey] as string[];
      updateSetting(arrayKey, [...currentArray, value.trim()]);
      setValue("");
    }
  };

  const removeItem = (arrayKey: keyof AISettings, index: number) => {
    const currentArray = aiSettings[arrayKey] as string[];
    updateSetting(arrayKey, currentArray.filter((_, i) => i !== index));
  };

  const normalizeMoodDistribution = () => {
    const total = Object.values(aiSettings.moodDistribution).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const factor = 100 / total;
      const normalized = Object.entries(aiSettings.moodDistribution).reduce((acc, [key, val]) => {
        acc[key] = Math.round(val * factor);
        return acc;
      }, {} as any);
      setAiSettings(prev => ({ ...prev, moodDistribution: normalized }));
    }
  };

  // Ensure personalityTraits is always an array
  const personalityTraits = aiSettings.personalityTraits || defaultAISettings.personalityTraits;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-purple-900 text-white border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Custom Functions
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure advanced AI personality, responses, and behavior patterns for enhanced character interactions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-purple-500/30">
            <TabsTrigger value="personality" className="data-[state=active]:bg-purple-600" data-testid="tab-personality">
              <Bot className="w-4 h-4 mr-2" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="responses" className="data-[state=active]:bg-purple-600" data-testid="tab-responses">
              <MessageCircle className="w-4 h-4 mr-2" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-purple-600" data-testid="tab-behavior">
              <Settings2 className="w-4 h-4 mr-2" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-600" data-testid="tab-advanced">
              <Zap className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Personality Tab */}
          <TabsContent value="personality" className="space-y-4">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    placeholder="Add personality trait"
                    className="bg-black/30 border-purple-500/30 text-white"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("personalityTraits", newTrait, setNewTrait))}
                    data-testid="input-personality-trait"
                  />
                  <Button 
                    onClick={() => addItem("personalityTraits", newTrait, setNewTrait)}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-add-trait"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait: any, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                      {trait}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("personalityTraits", index)}
                        className="ml-2 h-auto p-0 text-purple-300 hover:text-red-400"
                        data-testid={`button-remove-trait-${index}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Mood Distribution</CardTitle>
                <p className="text-sm text-gray-400">Adjust the percentage of each mood (should total 100%)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(aiSettings.moodDistribution).map(([mood, value]) => (
                  <div key={mood} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize text-white">{mood}</Label>
                      <span className="text-sm text-purple-300">{value}%</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={(values) => updateMoodDistribution(mood, values[0])}
                      max={100}
                      min={0}
                      step={1}
                      className="[&_[role=slider]]:bg-purple-600"
                      data-testid={`slider-mood-${mood}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={normalizeMoodDistribution}
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                  data-testid="button-normalize-moods"
                >
                  Normalize to 100%
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Conversation Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Conversation Style</Label>
                  <Select value={aiSettings.conversationStyle} onValueChange={(value) => updateSetting("conversationStyle", value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white" data-testid="select-conversation-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="flirty">Flirty</SelectItem>
                      <SelectItem value="mysterious">Mysterious</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Preferred Topics</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newPreferredTopic}
                      onChange={(e) => setNewPreferredTopic(e.target.value)}
                      placeholder="Add preferred topic"
                      className="bg-black/30 border-purple-500/30 text-white"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("preferredTopics", newPreferredTopic, setNewPreferredTopic))}
                      data-testid="input-preferred-topic"
                    />
                    <Button 
                      onClick={() => addItem("preferredTopics", newPreferredTopic, setNewPreferredTopic)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-add-preferred-topic"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {aiSettings.preferredTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                        {topic}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem("preferredTopics", index)}
                          className="ml-2 h-auto p-0 text-green-300 hover:text-red-400"
                          data-testid={`button-remove-preferred-topic-${index}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Avoided Topics</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newAvoidedTopic}
                      onChange={(e) => setNewAvoidedTopic(e.target.value)}
                      placeholder="Add topic to avoid"
                      className="bg-black/30 border-purple-500/30 text-white"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("avoidedTopics", newAvoidedTopic, setNewAvoidedTopic))}
                      data-testid="input-avoided-topic"
                    />
                    <Button 
                      onClick={() => addItem("avoidedTopics", newAvoidedTopic, setNewAvoidedTopic)}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-add-avoided-topic"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {aiSettings.avoidedTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="bg-red-600/20 text-red-300 border-red-500/30">
                        {topic}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem("avoidedTopics", index)}
                          className="ml-2 h-auto p-0 text-red-300 hover:text-red-400"
                          data-testid={`button-remove-avoided-topic-${index}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Custom Greetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGreeting}
                    onChange={(e) => setNewGreeting(e.target.value)}
                    placeholder="Add custom greeting"
                    className="bg-black/30 border-purple-500/30 text-white"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("customGreetings", newGreeting, setNewGreeting))}
                    data-testid="input-custom-greeting"
                  />
                  <Button 
                    onClick={() => addItem("customGreetings", newGreeting, setNewGreeting)}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-add-greeting"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {aiSettings.customGreetings.map((greeting, index) => (
                    <div key={index} className="flex items-center justify-between bg-purple-600/10 p-3 rounded border border-purple-500/20">
                      <span className="text-white">{greeting}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("customGreetings", index)}
                        className="text-red-400 hover:text-red-500"
                        data-testid={`button-remove-greeting-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Custom Responses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Add custom response"
                    className="bg-black/30 border-purple-500/30 text-white"
                    data-testid="textarea-custom-response"
                  />
                  <Button 
                    onClick={() => addItem("customResponses", newResponse, setNewResponse)}
                    className="bg-purple-600 hover:bg-purple-700 self-start"
                    data-testid="button-add-response"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {aiSettings.customResponses.map((response, index) => (
                    <div key={index} className="flex items-start justify-between bg-purple-600/10 p-3 rounded border border-purple-500/20">
                      <span className="text-white flex-1">{response}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("customResponses", index)}
                        className="text-red-400 hover:text-red-500 ml-2"
                        data-testid={`button-remove-response-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Trigger Words</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTriggerWord}
                    onChange={(e) => setNewTriggerWord(e.target.value)}
                    placeholder="Add trigger word"
                    className="bg-black/30 border-purple-500/30 text-white"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("triggerWords", newTriggerWord, setNewTriggerWord))}
                    data-testid="input-trigger-word"
                  />
                  <Button 
                    onClick={() => addItem("triggerWords", newTriggerWord, setNewTriggerWord)}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-add-trigger"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSettings.triggerWords.map((word, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-600/20 text-orange-300 border-orange-500/30">
                      {word}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("triggerWords", index)}
                        className="ml-2 h-auto p-0 text-orange-300 hover:text-red-400"
                        data-testid={`button-remove-trigger-${index}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Response Timing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Min Response Time (seconds): {aiSettings.responseSettings.minResponseTime}</Label>
                  <Slider
                    value={[aiSettings.responseSettings.minResponseTime]}
                    onValueChange={(values) => updateResponseSettings("minResponseTime", values[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-min-response-time"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Max Response Time (seconds): {aiSettings.responseSettings.maxResponseTime}</Label>
                  <Slider
                    value={[aiSettings.responseSettings.maxResponseTime]}
                    onValueChange={(values) => updateResponseSettings("maxResponseTime", values[0])}
                    max={30}
                    min={1}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-max-response-time"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Response Delay (ms): {aiSettings.responseSettings.responseDelay}</Label>
                  <Slider
                    value={[aiSettings.responseSettings.responseDelay]}
                    onValueChange={(values) => updateResponseSettings("responseDelay", values[0])}
                    max={5000}
                    min={500}
                    step={100}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-response-delay"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">AI Intelligence Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Creativity Level: {aiSettings.responseSettings.creativity}%</Label>
                  <Slider
                    value={[aiSettings.responseSettings.creativity]}
                    onValueChange={(values) => updateResponseSettings("creativity", values[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-creativity"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Consistency Level: {aiSettings.responseSettings.consistency}%</Label>
                  <Slider
                    value={[aiSettings.responseSettings.consistency]}
                    onValueChange={(values) => updateResponseSettings("consistency", values[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-consistency"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Emotional Intelligence: {aiSettings.emotionalIntelligence}%</Label>
                  <Slider
                    value={[aiSettings.emotionalIntelligence]}
                    onValueChange={(values) => updateSetting("emotionalIntelligence", values[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-emotional-intelligence"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Context Memory (messages): {aiSettings.responseSettings.contextMemory}</Label>
                  <Slider
                    value={[aiSettings.responseSettings.contextMemory]}
                    onValueChange={(values) => updateResponseSettings("contextMemory", values[0])}
                    max={50}
                    min={5}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-context-memory"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Picture Sending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Random Picture Sending</Label>
                    <p className="text-sm text-gray-400">AI randomly sends pictures during conversation</p>
                  </div>
                  <Switch
                    checked={aiSettings.randomPictureSending}
                    onCheckedChange={(checked) => updateSetting("randomPictureSending", checked)}
                    data-testid="switch-random-pictures"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Picture Send Chance: {aiSettings.pictureSendChance}%</Label>
                  <Slider
                    value={[aiSettings.pictureSendChance]}
                    onValueChange={(values) => updateSetting("pictureSendChance", values[0])}
                    max={100}
                    min={0}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-600"
                    data-testid="slider-picture-chance"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Advanced AI Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Adaptive Responses</Label>
                    <p className="text-sm text-gray-400">AI learns from conversation patterns</p>
                  </div>
                  <Switch
                    checked={aiSettings.adaptiveResponses}
                    onCheckedChange={(checked) => updateSetting("adaptiveResponses", checked)}
                    data-testid="switch-adaptive-responses"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Learning Mode</Label>
                    <p className="text-sm text-gray-400">AI continuously improves responses</p>
                  </div>
                  <Switch
                    checked={aiSettings.learningMode}
                    onCheckedChange={(checked) => updateSetting("learningMode", checked)}
                    data-testid="switch-learning-mode"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/20">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => saveSettingsMutation.mutate(aiSettings)}
            disabled={saveSettingsMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-save-ai-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? "Saving..." : "Save AI Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}