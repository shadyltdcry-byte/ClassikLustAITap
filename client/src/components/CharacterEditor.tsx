/**
 * CharacterEditor.tsx
 * Last Edited: 2025-08-19 by Le Chat
 *
 * Added preview for main and avatar images.
 * Improved form handling and UI consistency.
 */

import { useState, useEffect } from "react";
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
import type { Character } from "@shared/schema";

const MOCK_USER_ID = "default-player";

// Extended character schema for editing
const characterEditSchema = insertCharacterSchema.extend({
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
  chatSendChance: z.number().min(1).max(100).default(1),
  customTriggerWords: z.array(z.string()).default([]),
  customGreetings: z.array(z.string()).default([]),
  customResponses: z.array(z.string()).default([]),
});

type CharacterEditForm = z.infer<typeof characterEditSchema>;

interface CharacterEditorProps {
  character?: Character;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CharacterEditor({
  character,
  isEditing = false,
  onSuccess,
  onCancel,
}: CharacterEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [sendChance, setSendChance] = useState("");
  const [customGreeting, setCustomGreeting] = useState("");
  const [customResponse, setCustomResponse] = useState("");
  const [triggerWord, setTriggerWord] = useState("");

  const queryClient = useQueryClient();

  // Fetch media files for avatars
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["/api/media"],
  });

  const form = useForm<CharacterEditForm>({
    resolver: zodResolver(characterEditSchema),
    defaultValues: {
      name: character?.name ?? "",
      bio: character?.bio ?? "",
      backstory: character?.backstory ?? "",
      interests: character?.interests ?? "",
      quirks: character?.quirks ?? "",
      description: character?.description ?? "",
      imageUrl: character?.imageUrl ?? "",
      avatarUrl: character?.avatarUrl ?? "",
      personality: character?.personality ?? "friendly",
      personalityStyle: character?.personalityStyle ?? "Sweet & Caring",
      chatStyle: character?.chatStyle ?? "casual",
      likes: character?.likes ?? "",
      dislikes: character?.dislikes ?? "",
      requiredLevel: character?.requiredLevel ?? 1,
      level: character?.level ?? 1,
      responseTimeMin: character?.responseTimeMin ?? 1,
      responseTimeMax: character?.responseTimeMax ?? 3,
      responseTimeMs: character?.responseTimeMs ?? 2000,
      chatSendChance: character?.chatSendChance ?? 5,
      isNsfw: character?.isNsfw ?? false,
      isVip: character?.isVip ?? false,
      isEvent: character?.isEvent ?? false,
      isWheelReward: character?.isWheelReward ?? false,
      randomChatResponsesEnabled: character?.randomChatResponsesEnabled ?? false,
      moodDistribution: character?.moodDistribution || {
        normal: 70,
        happy: 20,
        flirty: 10,
        playful: 0,
        mysterious: 0,
        shy: 0,
      },
      customTriggerWords: character?.customTriggerWords || [],
      customGreetings: character?.customGreetings || [],
      customResponses: character?.customResponses || [],
    },
  });

  // Update form when character data changes
  useEffect(() => {
    if (character) {
      form.reset({
        name: character.name ?? "",
        bio: character.bio ?? "",
        backstory: character.backstory ?? "",
        interests: character.interests ?? "",
        quirks: character.quirks ?? "",
        description: character.description ?? "",
        imageUrl: character.imageUrl ?? "",
        avatarUrl: character.avatarUrl ?? "",
        personality: character.personality ?? "friendly",
        personalityStyle: character.personalityStyle ?? "Sweet & Caring",
        chatStyle: character.chatStyle ?? "casual",
        likes: character.likes ?? "",
        dislikes: character.dislikes ?? "",
        requiredLevel: character.requiredLevel ?? 1,
        level: character.level ?? 1,
        responseTimeMin: character.responseTimeMin ?? 1,
        responseTimeMax: character.responseTimeMax ?? 3,
        responseTimeMs: character.responseTimeMs ?? 2000,
        chatSendChance: character.chatSendChance ?? 0,
        isNsfw: character.isNsfw ?? false,
        isVip: character.isVip ?? false,
        isEvent: character.isEvent ?? false,
        isWheelReward: character.isWheelReward ?? false,
        randomChatResponsesEnabled: character.randomChatResponsesEnabled ?? false,
        moodDistribution: character.moodDistribution || {
          normal: 70,
          happy: 20,
          flirty: 10,
          playful: 0,
          mysterious: 0,
          shy: 0,
        },
        customTriggerWords: character.customTriggerWords || [],
        customGreetings: character.customGreetings || [],
        customResponses: character.customResponses || [],
      });
    }
  }, [character, form]);

  const mutation = useMutation({
    mutationFn: async (data: CharacterEditForm) => {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing
        ? `/api/admin/characters/${character?.id}`
        : "/api/admin/characters";

      try {
        const response = await apiRequest(method, endpoint, data);
        return await response.json();
      } catch (error) {
        console.error("Character operation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Character updated successfully!"
          : "Character created successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/character/selected", MOCK_USER_ID],
      });
      if (onSuccess) onSuccess();
      if (!isEditing) form.reset();
    },
    onError: (error: any) => {
      toast.error(
        isEditing ? "Failed to update character" : "Failed to create character",
      );
      console.error("Character operation error:", error);
    },
  });

  const onSubmit = (data: CharacterEditForm) => {
    mutation.mutate(data);
  };

  const addCustomGreeting = () => {
    if (customGreeting.trim()) {
      const currentGreetings = form.getValues("customGreetings") || [];
      form.setValue("customGreetings", [
        ...currentGreetings,
        customGreeting.trim(),
      ]);
      setCustomGreeting("");
    }
  };

  const addCustomResponse = () => {
    if (customResponse.trim()) {
      const currentResponses = form.getValues("customResponses") || [];
      form.setValue("customResponses", [
        ...currentResponses,
        customResponse.trim(),
      ]);
      setCustomResponse("");
    }
  };

  const addTriggerWord = () => {
    if (triggerWord.trim()) {
      const currentTriggers = form.getValues("customTriggerWords") || [];
      form.setValue("customTriggerWords", [
        ...currentTriggers,
        triggerWord.trim(),
      ]);
      setTriggerWord("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isEditing
            ? `Edit ${character?.name || "Character"}`
            : "Create New Character"}
        </h1>
        <p className="text-gray-400">
          {isEditing
            ? "Modify your AI companion's personality and traits"
            : "Design your perfect AI companion with detailed personality traits"}
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
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="personality"
                className="text-white data-[state=active]:bg-purple-600"
              >
                Personality
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="text-white data-[state=active]:bg-purple-600"
              >
                Advanced
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-white data-[state=active]:bg-purple-600"
              >
                AI Behavior
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
                          <FormLabel className="text-white">
                            Character Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter character name"
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
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
                          <FormLabel className="text-white">
                            Required Level to Unlock
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
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
                            placeholder="Brief description of the character"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value ?? ""}
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
                        <FormLabel className="text-white">
                          Detailed Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed character description"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Main Image
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select main image" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                {(mediaFiles as any[]).map((file: any) => (
                                  <SelectItem
                                    key={file.id}
                                    value={
                                      file.url ||
                                      file.path ||
                                      `/uploads/${file.filename}`
                                    }
                                    className="text-white"
                                  >
                                    {file.originalName || file.filename}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Avatar Image
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select avatar image" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                {(mediaFiles as any[]).map((file: any) => (
                                  <SelectItem
                                    key={file.id}
                                    value={
                                      file.url ||
                                      file.path ||
                                      `/uploads/${file.filename}`
                                    }
                                    className="text-white"
                                  >
                                    {file.originalName || file.filename}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-white">Main Image Preview</Label>
                      {form.watch("imageUrl") && (
                        <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                          <img
                            src={form.watch("imageUrl")}
                            alt="Main Preview"
                            className="w-full h-40 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-character.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Avatar Preview</Label>
                      {form.watch("avatarUrl") && (
                        <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                          <img
                            src={form.watch("avatarUrl")}
                            alt="Avatar Preview"
                            className="w-20 h-20 object-cover rounded-full mx-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-avatar.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personality Tab */}
            <TabsContent value="personality" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">
                    Personality Traits
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Define your character's personality and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Base Personality
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select personality type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem
                                  value="friendly"
                                  className="text-white"
                                >
                                  Friendly
                                </SelectItem>
                                <SelectItem value="shy" className="text-white">
                                  Shy
                                </SelectItem>
                                <SelectItem
                                  value="confident"
                                  className="text-white"
                                >
                                  Confident
                                </SelectItem>
                                <SelectItem
                                  value="playful"
                                  className="text-white"
                                >
                                  Playful
                                </SelectItem>
                                <SelectItem
                                  value="mysterious"
                                  className="text-white"
                                >
                                  Mysterious
                                </SelectItem>
                                <SelectItem
                                  value="caring"
                                  className="text-white"
                                >
                                  Caring
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
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
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select chat style" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem
                                  value="casual"
                                  className="text-white"
                                >
                                  Casual
                                </SelectItem>
                                <SelectItem
                                  value="formal"
                                  className="text-white"
                                >
                                  Formal
                                </SelectItem>
                                <SelectItem
                                  value="flirty"
                                  className="text-white"
                                >
                                  Flirty
                                </SelectItem>
                                <SelectItem
                                  value="intellectual"
                                  className="text-white"
                                >
                                  Intellectual
                                </SelectItem>
                                <SelectItem value="cute" className="text-white">
                                  Cute
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              placeholder="Things the character likes"
                              className="bg-gray-700 border-gray-600 text-white"
                              {...field}
                              value={field.value ?? ""}
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
                              placeholder="Things the character dislikes"
                              className="bg-gray-700 border-gray-600 text-white"
                              {...field}
                              value={field.value ?? ""}
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
                  <CardTitle className="text-white">
                    Advanced Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Fine-tune character behavior and restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="chatSendChance"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4 bg-gray-700/50">
                            <div className="space-y-0.5">
                          <FormLabel className="text-white">
                        Picture Chance %
                          </FormLabel>
                          <FormDescription className="text-gray-400">
                            % To Send A Random Picture via Chat
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                        </FormItem>
                          )}
                        />

                    <FormField
                      control={form.control}
                      name="isVip"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4 bg-gray-700/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-white">
                              VIP Character
                            </FormLabel>
                            <FormDescription className="text-gray-400">
                              Requires premium access
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

                    <FormField
                      control={form.control}
                      name="isNsfw"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4 bg-gray-700/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-white">
                              NSFW Content
                            </FormLabel>
                            <FormDescription className="text-gray-400">
                              18+ content allowed
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Behavior Tab */}
            <TabsContent value="ai" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">
                    AI Behavior Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how the AI responds and behaves in conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Response Timing */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">
                      Response Timing
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="responseTimeMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Min Response Time (seconds)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responseTimeMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Max Response Time (seconds)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isEditing ? "Update Character" : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}