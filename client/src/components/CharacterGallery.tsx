import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Lock, Unlock, Play, Pause, RotateCcw, Heart, Star, Crown, Sparkles, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Character, MediaFile } from "@shared/schema";

export interface CharacterGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCharacterSelected?: (characterId: string) => void;
  currentCharacterId?: string;
}

export function CharacterGallery(props: CharacterGalleryProps) {
  return <div className="hidden" />;
}

export default CharacterGallery;
