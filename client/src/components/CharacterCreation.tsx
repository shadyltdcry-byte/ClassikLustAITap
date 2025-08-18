/**
 * CharacterCreation.tsx
 * Last Edited: 2025-08-18 by Assistant
 *
 * Fixed schema inconsistencies, improved form validation,
 * standardized field naming, and enhanced UI components
 * 
 * Key fixes:
 * - Aligned with shared schema from @shared/schema
 * - Fixed pictureSendChance vs chatSendChance naming
 * - Improved custom trigger words structure
 * - Enhanced error handling and validation
 * - Added proper TypeScript types
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

// Extended character creation schema that matches the backend expectations
const characterCreationSchema = insertCharacterSchema.extend({
  level: z.number().min(1).max(100).default(1),
  moodDistribution: z
    .object({
      normal: z.number().min(0).max(100).default(70),
      happy: z.number().min(0).max(100).default(20),
      flirty: z.number().min(0).max(100).default(10),
      playful: z.number().min(0).max(100).default(0),
      mysterious: z.number().min(0).max(100).default(0),
      shy: z.number().min(0).max(100).default(0),
    })
    .default({
      normal: 70,
      happy: 20,
      flirty: 10,
      playful: 0,
      mysterious: 0,
      shy: 0,
    }),
  // Fixed to support both string[] and object[] formats
  customTriggerWords: z
    .array(
      z.union([
        z.string(),
        z.object({
          word: z.string(),
          response: z.string(),
        })
      ])
    )
    .default([]),
  customGreetings: z.array(z.string()).default([]),
  customResponses: z.array(z.string()).default([]),
  interests: z.string().optional(),
  quirks: z.string().optional(),
  backstory: z.string().optional(),
  // Standardize on pictureSendChance (used in creation) vs chatSendChance (used in editor)
  pictureSendChance: z.number().min(0).max(100).default(5),
});

type CharacterCreationForm = z.infer<typeof characterCreationSchema>;

interface MediaFile {
  id: string;
  url?: string;
  path?: string;
  filename?: string;
  originalName?: string;
  type: 'image' | 'video' | 'gif';
}

export default function CharacterCreation() {
  const [activeTab, setActiveTab] = useState("basic");
  const [customGreeting, setCustomGreeting] = useState("");
  const [customResponse, setCustomResponse] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [triggerResponse, setTriggerResponse] = useState("");

  const queryClient = useQueryClient();

  // Fetch media files for avatars
  const { data: mediaFiles = [], isError: mediaError } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/media");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch media files:", error);
        return [];
      }
    },
  });

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      bio: "",
      backstory: "",
      interests: "",
      quirks: "",
      description: "",
      imageUrl: "",
      avatarUrl: "",
      personality: "friendly",
      personalityStyle: "Sweet & Caring",
      chatStyle: "casual",
      likes: "",
      dislikes: "",
      requiredLevel: 1,
      level: 1,
      responseTimeMin: 1,
      responseTimeMax: 3,
      responseTimeMs: 2000,
      pictureSendChance: 5,
      isNsfw: false,
      isVip: false,
      isEvent: false,
      isWheelReward: false,
      randomPictureSending: false,
      moodDistribution: {
        normal: 70,
        happy: 20,
        flirty: 10,
        playful: 0,
        mysterious: 0,
        shy: 0,
      },
      customTriggerWords: [],
      customGreetings: [],
      customResponses: [],
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterCreationForm) => {
      try {
        // Validate mood distribution doesn't exceed 100%
        const totalMoodPercentage = Object.values(data.moodDistribution || {}).reduce(
          (sum, value) => sum + value, 0
        );

        if (totalMoodPercentage > 100) {
          throw new Error("Total mood distribution cannot exceed 100%");
        }

        const response = await apiRequest("POST", "/api/characters", data);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Character creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Character created successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      form.reset();
      // Reset local state
      setCustomGreeting("");
      setCustomResponse("");
      setTriggerWord("");
      setTriggerResponse("");
    },
    onError: (error: any) => {
      toast.error(
        "Failed to create character: " + (error.message || "Unknown error")
      );
      console.error("Character creation error:", error);
    },
  });

  const onSubmit = (data: CharacterCreationForm) => {
    // Final validation before submission
    if (!data.name?.trim()) {
      toast.error("Character name is required");
      return;
    }

    createCharacterMutation.mutate(data);
  };

  /**
   * Adds a custom greeting to the form data
   * Validates input and prevents duplicates
   */
  const addCustomGreeting = () => {
    const greeting = customGreeting.trim();
    if (!greeting) {
      toast.error("Please enter a greeting");
      return;
    }

    const currentGreetings = form.getValues("customGreetings") || [];
    if (currentGreetings.includes(greeting)) {
      toast.error("This greeting already exists");
      return;
    }

    form.setValue("customGreetings", [...currentGreetings, greeting]);
    setCustomGreeting("");
    toast.success("Greeting added");
  };

  /**
   * Adds a custom response template to the form data
   * Validates input and prevents duplicates
   */
  const addCustomResponse = () => {
    const response = customResponse.trim();
    if (!response) {
      toast.error("Please enter a response");
      return;
    }

    const currentResponses = form.getValues("customResponses") || [];
    if (currentResponses.includes(response)) {
      toast.error("This response already exists");
      return;
    }

    form.setValue("customResponses", [...currentResponses, response]);
    setCustomResponse("");
    toast.success("Response added");
  };

  /**
   * Adds a trigger word with its associated response
   * Supports both simple string triggers and word-response pairs
   */
  const addTriggerWord = () => {
    const word = triggerWord.trim();
    const response = triggerResponse.trim();

    if (!word) {
      toast.error("Please enter a trigger word");
      return;
    }

    const currentTriggers = form.getValues("customTriggerWords") || [];

    // Check for duplicate trigger words
    const wordExists = currentTriggers.some(trigger => 
      typeof trigger === 'string' 
        ? trigger === word 
        : trigger.word === word
    );

    if (wordExists) {
      toast.error("This trigger word already exists");
      return;
    }

    const newTrigger = response 
      ? { word, response }
      : word;

    form.setValue("customTriggerWords", [...currentTriggers, newTrigger]);
    setTriggerWord("");
    setTriggerResponse("");
    toast.success("Trigger word added");
  };

  /**
   * Removes an item from an array field
   * Generic helper for removing greetings, responses, or triggers
   */
  const removeArrayItem = (
    fieldName: 'customGreetings' | 'customResponses' | 'customTriggerWords',
    index: number
  ) => {
    const currentArray = form.getValues(fieldName) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    form.setValue(fieldName, newArray);
    toast.success("Item removed");
  };

  /**
   * Validates and normalizes mood distribution values
   * Ensures total doesn't exceed 100% and updates form accordingly
   */
  const handleMoodChange = (mood: string, value: number) => {
    const currentDistribution = form.getValues("moodDistribution") || {};
    const newDistribution = { ...currentDistribution, [mood]: value };

    // Calculate total to warn user if approaching 100%
    const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);

    if (total > 100) {
      toast.error("Total mood distribution cannot exceed 100%");
      return;
    }

    form.setValue("moodDistribution", newDistribution);

    if (total > 90) {
      toast.warning("Mood distribution is approaching 100%");
    }
  };

  // Show error message if media files failed to load
  if (mediaError) {
    console.warn("Failed to load media files for character creation");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Create New Character
        </h1>
        <p className="text-gray-400">
          Design your perfect AI companion with detailed personality traits
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
              <TabsTrigger 
                value="basic" 
                className="text-white data-[state=active]:bg-purple-600"
                data-testid="tab-basic"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="personality" 
                className="text-white data-[state=active]:bg-purple-600"
                data-testid="tab-personality"
              >
                Personality
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="text-white data-[state=active]:bg-purple-600"
                data-testid="tab-advanced"
              >
                Advanced
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className="text-white data-[state=active]:bg-purple-600"
                data-testid="tab-custom"
              >
                Custom AI
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">
                    Basic Character Information
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Essential details about your character
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Character Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter character name"
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-character-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiredLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Required Level</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="100"
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-required-level"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Player level required to unlock this character
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Brief description of the character"
                            className="bg-gray-700 border-gray-600 text-white"
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Detailed character description for AI context"
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={4}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          This helps the AI understand how to portray the character
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="backstory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Backstory</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Character's background and history"
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={3}
                            data-testid="textarea-backstory"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Interests & Hobbies</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="What the character enjoys doing"
                              className="bg-gray-700 border-gray-600 text-white"
                              rows={3}
                              data-testid="textarea-interests"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quirks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Quirks & Habits</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Unique traits and mannerisms"
                              className="bg-gray-700 border-gray-600 text-white"
                              rows={3}
                              data-testid="textarea-quirks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Main Image</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-700 border-gray-600 text-white"
                                data-testid="select-main-image"
                              >
                                <SelectValue placeholder="Select main image" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="" className="text-white">
                                No image selected
                              </SelectItem>
                              {Array.isArray(mediaFiles) &&
                                mediaFiles.map((file: MediaFile) => (
                                  <SelectItem 
                                    key={file.id} 
                                    value={file.url || file.path || `/uploads/${file.filename}`}
                                    className="text-white"
                                  >
                                    {file.originalName || file.filename || `File ${file.id.slice(0, 8)}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Avatar Image</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-700 border-gray-600 text-white"
                                data-testid="select-avatar"
                              >
                                <SelectValue placeholder="Select avatar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="" className="text-white">
                                No avatar selected
                              </SelectItem>
                              {Array.isArray(mediaFiles) &&
                                mediaFiles.map((file: MediaFile) => (
                                  <SelectItem 
                                    key={file.id} 
                                    value={file.url || file.path || `/uploads/${file.filename}`}
                                    className="text-white"
                                  >
                                    {file.originalName || file.filename || `File ${file.id.slice(0, 8)}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personality Tab */}
            <TabsContent value="personality" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">
                    Personality Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Define mood distribution and personality traits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personalityStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Personality Style</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-700 border-gray-600 text-white"
                                data-testid="select-personality-style"
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="Sweet & Caring" className="text-white">
                                Sweet & Caring
                              </SelectItem>
                              <SelectItem value="Mysterious" className="text-white">
                                Mysterious
                              </SelectItem>
                              <SelectItem value="Playful" className="text-white">
                                Playful
                              </SelectItem>
                              <SelectItem value="Confident" className="text-white">
                                Confident
                              </SelectItem>
                              <SelectItem value="Shy" className="text-white">
                                Shy
                              </SelectItem>
                              <SelectItem value="Flirtatious" className="text-white">
                                Flirtatious
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chatStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Chat Style</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-700 border-gray-600 text-white"
                                data-testid="select-chat-style"
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="casual" className="text-white">
                                Casual
                              </SelectItem>
                              <SelectItem value="formal" className="text-white">
                                Formal
                              </SelectItem>
                              <SelectItem value="flirty" className="text-white">
                                Flirty
                              </SelectItem>
                              <SelectItem value="mysterious" className="text-white">
                                Mysterious
                              </SelectItem>
                              <SelectItem value="playful" className="text-white">
                                Playful
                              </SelectItem>
                              <SelectItem value="intellectual" className="text-white">
                                Intellectual
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">Mood Distribution</h3>
                      <span className="text-sm text-gray-400">
                        Total: {Object.values(form.watch("moodDistribution") || {}).reduce((sum, val) => sum + val, 0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Configure how often the character displays different moods (total should not exceed 100%)
                    </p>

                    {Object.entries(form.watch("moodDistribution") || {}).map(
                      ([mood, value]) => (
                        <FormField
                          key={mood}
                          control={form.control}
                          name={`moodDistribution.${mood}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel className="capitalize text-white">
                                  {mood}
                                </FormLabel>
                                <span className="text-sm text-gray-400">
                                  {value}%
                                </span>
                              </div>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(values) => {
                                    const newValue = values[0];
                                    field.onChange(newValue);
                                    handleMoodChange(mood, newValue);
                                  }}
                                  className="w-full"
                                  data-testid={`slider-mood-${mood}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="likes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Likes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Things the character likes"
                              className="bg-gray-700 border-gray-600 text-white"
                              rows={3}
                              data-testid="textarea-likes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dislikes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Dislikes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Things the character dislikes"
                              className="bg-gray-700 border-gray-600 text-white"
                              rows={3}
                              data-testid="textarea-dislikes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Advanced Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Fine-tune response behavior and special features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="responseTimeMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Min Response Time (s)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="30"
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-response-time-min"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Minimum time before response
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responseTimeMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Max Response Time (s)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="60"
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-response-time-max"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Maximum time before response
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pictureSendChance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Picture Send Chance (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-picture-chance"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Chance to send pictures with messages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Content Flags</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="randomPictureSending"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4 bg-gray-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">
                                Random Picture Sending
                              </FormLabel>
                              <FormDescription className="text-gray-400">
                                Character can send pictures randomly
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-random-pictures"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isWheelReward"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4 bg-gray-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">
                                Wheel Reward
                              </FormLabel>
                              <FormDescription className="text-gray-400">
                                Available as wheel prize
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isNsfw"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-red-600 p-4 bg-red-900/20">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">
                                NSFW Content
                              </FormLabel>
                              <FormDescription className="text-red-300">
                                18+ content - requires age verification
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-nsfw"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isVip"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-yellow-600 p-4 bg-yellow-900/20">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">
                                VIP Exclusive
                              </FormLabel>
                              <FormDescription className="text-yellow-300">
                                Premium subscription required
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-vip"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom AI Responses Tab */}
            <TabsContent value="custom" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Custom AI Responses & Triggers</CardTitle>
                  <CardDescription className="text-gray-400">
                    Add personalized greetings, responses, and trigger words to make your character unique
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Greetings */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-greeting" className="text-white text-base font-semibold">
                        Custom Greetings
                      </Label>
                      <p className="text-sm text-gray-400 mb-2">
                        Add unique greeting messages for when players first interact with this character
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="custom-greeting"
                          value={customGreeting}
                          onChange={(e) => setCustomGreeting(e.target.value)}
                          placeholder="Enter a custom greeting message..."
                          className="bg-gray-700 border-gray-600 text-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomGreeting();
                            }
                          }}
                          data-testid="input-custom-greeting"
                        />
                        <Button
                          type="button"
                          onClick={addCustomGreeting}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-add-greeting"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form
                          .watch("customGreetings")
                          ?.map((greeting, index) => (
                            <div
                              key={index}
                              className="bg-blue-600/20 border border-blue-500 rounded-md px-3 py-2 text-sm text-white flex items-center gap-2"
                            >
                              <span className="flex-1">{greeting}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeArrayItem('customGreetings', index)}
                                className="h-auto p-1 text-white hover:bg-blue-700/50"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Custom Response Templates */}
                    <div>
                      <Label htmlFor="custom-response" className="text-white text-base font-semibold">
                        Custom Response Templates
                      </Label>
                      <p className="text-sm text-gray-400 mb-2">
                        Add response templates that the AI can use in conversations
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="custom-response"
                          value={customResponse}
                          onChange={(e) => setCustomResponse(e.target.value)}
                          placeholder="Enter a custom response template..."
                          className="bg-gray-700 border-gray-600 text-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomResponse();
                            }
                          }}
                          data-testid="input-custom-response"
                        />
                        <Button
                          type="button"
                          onClick={addCustomResponse}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-add-response"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form
                          .watch("customResponses")
                          ?.map((response, index) => (
                            <div
                              key={index}
                              className="bg-green-600/20 border border-green-500 rounded-md px-3 py-2 text-sm text-white flex items-center gap-2"
                            >
                              <span className="flex-1">{response}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeArrayItem('customResponses', index)}
                                className="h-auto p-1 text-white hover:bg-green-700/50"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Trigger Words */}
                    <div>
                      <Label className="text-white text-base font-semibold">
                        Trigger Words & Responses
                      </Label>
                      <p className="text-sm text-gray-400 mb-2">
                        Set specific words that trigger unique responses from the character
                      </p>
                      <div className="space-y-2">
                        <Input
                          value={triggerWord}
                          onChange={(e) => setTriggerWord(e.target.value)}
                          placeholder="Enter trigger word (e.g., 'dance', 'sing')"
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-trigger-word"
                        />
                        <Input
                          value={triggerResponse}
                          onChange={(e) => setTriggerResponse(e.target.value)}
                          placeholder="Enter response for this trigger (optional - leave empty for word-only trigger)"
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-trigger-response"
                        />
                        <Button
                          type="button"
                          onClick={addTriggerWord}
                          className="bg-purple-600 hover:bg-purple-700 w-full"
                          data-testid="button-add-trigger"
                        >
                          Add Trigger
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {form
                          .watch("customTriggerWords")
                          ?.map((trigger, index) => (
                            <div
                              key={index}
                              className="bg-purple-600/20 border border-purple-500 rounded-md px-3 py-2 text-sm text-white flex justify-between items-center"
                            >
                              <div className="flex-1">
                                {typeof trigger === "string" ? (
                                  <span>
                                    <strong>{trigger}</strong>
                                  </span>
                                ) : (
                                  <span>
                                    <strong>{trigger.word}</strong> → {trigger.response}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeArrayItem('customTriggerWords', index)}
                                className="ml-2 h-auto p-1 text-white hover:bg-purple-700/50"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setCustomGreeting("");
                setCustomResponse("");
                setTriggerWord("");
                setTriggerResponse("");
              }}
              className="border-gray-600 text-white hover:bg-gray-700"
              data-testid="button-reset"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={createCharacterMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-create-character"
            >
              {createCharacterMutation.isPending
                ? "Creating Character..."
                : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}