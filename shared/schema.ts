
export interface User {
  id: string;
  lpPerTap: number;
  password: string;
  username: string;
  level: number;
  lp: number;
  lpPerHour: number;
  energy: number;
  maxEnergy: number;
  charisma: number;
  telegramId: string | null;
  vipStatus: boolean;
  vipTier?: string;
  vipExpiresAt?: Date;
  lastVipBonusClaim?: Date;
  nsfwConsent: boolean;
  lastTick: Date;
  lastWheelSpin: Date | null;
  createdAt: Date;
  gems?: number;
  jackpotsWon?: number;
}

export interface Character {
  id: string;
  name: string;
  bio?: string;
  description?: string;
  imageUrl?: string;
  avatarUrl?: string;
  personality?: string;
  chatStyle?: string;
  likes?: string;
  dislikes?: string;
  levelRequirement?: number;
  isNsfw?: boolean;
  isVip?: boolean;
  isEnabled?: boolean;
  responseTimeMin?: number;
  responseTimeMax?: number;
  pictureSendChance?: number;
  moodDistribution?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MediaFile {
  id: string;
  fileName?: string;
  filePath?: string;
  characterId?: string;
  uploadedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: number;
  reward: number;
  isActive: boolean;
}

export interface WheelPrize {
  id: string;
  name: string;
  type: 'lp' | 'gems' | 'jackpot';
  amount: number;
  probability: number;
  isActive: boolean;
}

// Schema for character creation/editing
export const insertCharacterSchema = {
  parse: (data: any): Character => data // Simple pass-through for now
};

export type { User as Player };
