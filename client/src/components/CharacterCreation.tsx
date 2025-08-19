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

// Extend the base schema with additional fields
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
  customTriggerWords: z
    .array(
      z.union([
        z.string(),
        z.object({
          word: z.string(),
          response: z.string(),
        }),
      ])
    )
    .default([]),
  customGreetings: z.array(z.string()).default([]),
  customResponses: z.array(z.string()).default([]),
  interests: z.string().optional(),
  quirks: z.string().optional(),
  backstory: z.string().optional(),
  pictureSendChance: z.number().min(0).max(100).default(5),
  image: z.string().optional(),
});

type CharacterCreationForm = z.infer<typeof characterCreationSchema>;

interface MediaFile {
  id: string;
  url?: string;
  path?: string;
  filename?: string;
  originalName?: string;
  type: "image" | "video" | "gif";
}

export default function CharacterCreation() {
  const [image, setImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [customGreeting, setCustomGreeting] = useState("");
  const [customResponse, setCustomResponse] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [triggerResponse, setTriggerResponse] = useState("");

  const queryClient = useQueryClient();

  // Fetch media files
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

  // Handle image input changes and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      bio: "",
      image: "",
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

  // Mutation to create character
  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterCreationForm) => {
      const totalMood = Object.values(data.moodDistribution || {}).reduce(
        (a, b) => a + b,
        0
      );
      if (totalMood > 100)
        throw new Error("Mood distribution cannot exceed 100%");

      const response = await apiRequest("POST", "/api/characters", data);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(
          err?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["/api/characters", "/api/admin/characters"],
      });
      form.reset();
      setCustomGreeting("");
      setCustomResponse("");
      setTriggerWord("");
      setTriggerResponse("");
      setImage(null);
    },
    onError: (error: any) => {
      toast.error(
        "Failed to create character: " + (error.message || "Unknown error")
      );
      console.error("Character creation error:", error);
    },
  });

  const onSubmit = (data: CharacterCreationForm) => {
    if (!data.name?.trim()) {
      toast.error("Character name is required");
      return;
    }
    createCharacterMutation.mutate(data);
  };

  const removeArrayItem = (
    fieldName: "customGreetings" | "customResponses" | "customTriggerWords",
    index: number
  ) => {
    const arr = form.getValues(fieldName) || [];
    const newArr = arr.filter((_: any, i: number) => i !== index);
    form.setValue(fieldName, newArr as any);
    toast.success("Item removed");
  };

  const addCustomGreeting = () => {
    const greeting = customGreeting.trim();
    if (!greeting) return toast.error("Please enter a greeting");

    const existing = form.getValues("customGreetings") || [];
    if (existing.includes(greeting))
      return toast.error("This greeting already exists");

    form.setValue("customGreetings", [...existing, greeting]);
    setCustomGreeting("");
    toast.success("Greeting added");
  };

  const addCustomResponse = () => {
    const resp = customResponse.trim();
    if (!resp) return toast.error("Please enter a response");

    const existing = form.getValues("customResponses") || [];
    if (existing.includes(resp))
      return toast.error("This response already exists");

    form.setValue("customResponses", [...existing, resp]);
    setCustomResponse("");
    toast.success("Response added");
  };

  const addTriggerWord = () => {
    const word = triggerWord.trim();
    const resp = triggerResponse.trim();
    if (!word) return toast.error("Please enter a trigger word");

    const existing = form.getValues("customTriggerWords") || [];
    const dup = existing.some((t: any) =>
      typeof t === "string" ? t === word : t.word === word
    );
    if (dup) return toast.error("This trigger word already exists");

    const newTrigger = resp ? { word, response: resp } : word;
    form.setValue("customTriggerWords", [...existing, newTrigger]);
    setTriggerWord("");
    setTriggerResponse("");
    toast.success("Trigger word added");
  };

  const handleMoodChange = (mood: string, value: number) => {
    const dist = { ...form.getValues("moodDistribution"), [mood]: value };
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total > 100)
      return toast.error("Total mood distribution cannot exceed 100%");
    form.setValue("moodDistribution", dist);
    if (total > 90) toast.warning("Mood distribution is approaching 100%");
  };

  if (mediaError)
    console.warn("Failed to load media files for character creation");

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                value="custom"
                className="text-white data-[state=active]:bg-purple-600"
              >
                Custom AI
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
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
                  {/* Character Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-white">Character Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-black/30 border-purple-500/30 text-white"
                    />
                    {image && (
                      <img
                        src={image}
                        alt="Preview"
                        className="w-20 h-20 object-cover mt-2 rounded"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tabs would go here */}
          </Tabs>

          {/* Submit Buttons */}
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
                setImage(null);
              }}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={createCharacterMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
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
