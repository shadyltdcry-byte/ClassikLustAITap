import { useState } from "react";
import type { Character, User, GameStats } from "@shared/schema";
import { useChatNotifications } from "@/hooks/useChatNotifications";

export interface CharacterDisplayProps {
  character?: Character;
  user: User;
  stats?: GameStats;
  onTap: (event: React.MouseEvent) => void;
  onAvatarClick?: () => void;
  isTapping: boolean;
  lpPerTap?: number;
  userId?: string;
}

const defaultCharacter: Character = {
  id: "no-character-selected",
  name: "Select Character",
  personality: "neutral",
  bio: null,
  description: null,
  backstory: "Please select a character to interact with!",
  mood: "neutral",
  isNsfw: false,
  isVip: false,
  levelRequirement: 1,
  isEnabled: true,
  customTriggers: [],
  avatarPath: "/uploads/placeholder-avatar.jpg",
  imageUrl: "/uploads/placeholder-avatar.jpg",
  avatarUrl: "/uploads/placeholder-avatar.jpg",
  chatStyle: "casual",
  responseTimeMin: 1,
  responseTimeMax: 3,
  likes: "",
  dislikes: "",
  createdAt: new Date(),
};

export function CharacterDisplay({ character = defaultCharacter, user, onTap, onAvatarClick, isTapping, lpPerTap, userId }: CharacterDisplayProps) {
  return <div className="hidden" />;
}

export default CharacterDisplay;
