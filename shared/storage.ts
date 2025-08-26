import {
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type Upgrade,
  type InsertUpgrade,
  type GameStats,
  type ChatMessage,
  type InsertChatMessage,
  type MediaFile,
  type WheelReward,
  type UserCharacter
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Character management
  getCharacter(id: string): Promise<Character | undefined>;
  getUserCharacters(userId: string): Promise<Character[]>;
  getAllCharacters(): Promise<Character[]>;
  getSelectedCharacter(userId: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<void>;
  selectCharacter(userId: string, characterId: string): Promise<void>;

  // Upgrade management
  getUpgrade(id: string): Promise<Upgrade | undefined>;
  getUserUpgrades(userId: string): Promise<Upgrade[]>;
  getAllUpgrades(): Promise<Upgrade[]>;
  createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade>;
  updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined>;

  // Game stats
  getUserStats(userId: string): Promise<GameStats>;
  updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void>;

  // Upgrade system
  upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade>;
  deleteUpgrade(id: string): Promise<void>;

  // Chat system
  getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: string, characterId?: string): Promise<void>;

  // Wheel system
  getLastWheelSpin(userId: string): Promise<Date | null>;
  recordWheelSpin(userId: string, reward: string): Promise<void>;

  // Admin/Settings
  getGameSettings(): Promise<any>;
  updateGameSettings(settings: Partial<any>): Promise<void>;
  getSystemStats(): Promise<any>;
  exportAllData(): Promise<any>;

  // Media management
  getAllMedia(): Promise<MediaFile[]>;
  getMediaFiles(characterId?: string): Promise<MediaFile[]>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  saveMediaFile(file: MediaFile): Promise<MediaFile>;
  uploadMedia(file: any): Promise<MediaFile>;
  updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined>;
  deleteMediaFile(id: string): Promise<void>;
}

// Import Drizzle implementation for local PostgreSQL
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema.js';

// Create connection to local PostgreSQL database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Create a simple Drizzle-based storage implementation
class DrizzleStorage implements IStorage {
  async getUser(id: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }
  
  async createUser(userData: any) {
    // Generate a truly unique username with timestamp to avoid duplicates
    const uniqueUsername = userData.username || `Player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    const result = await db.insert(schema.users).values({
      username: uniqueUsername,
      password: "temp_password", // Required field
      level: userData.level || 1,
      lp: userData.lp || 5000,
      lpPerHour: userData.lpPerHour || 250,
      lpPerTap: userData.lpPerTap || 1.5,
      energy: userData.energy || 1000,
      maxEnergy: userData.maxEnergy || 1000,
      charisma: userData.charismaPoints || 0,
      vipStatus: userData.isVip || false,
      nsfwConsent: userData.nsfwEnabled || false
    }).returning();
    return result[0];
  }
  
  async updateUser(id: string, updates: any) {
    const result = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return result[0];
  }
  
  async deleteUser(id: string) {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }
  
  async getAllCharacters() {
    return await db.select().from(schema.characters);
  }
  
  async getSelectedCharacter(userId: string) {
    // For now, return undefined - can implement selection logic later
    return undefined;
  }
  
  async getUserUpgrades(userId: string) {
    return []; // Return empty for now
  }
  
  async getUserStats(userId: string) {
    try {
      const result = await db.select().from(schema.gameStats).where(eq(schema.gameStats.userId, userId)).limit(1);
      if (result[0]) {
        return result[0];
      }
      // Create default stats if none exist
      const defaultStats = {
        userId,
        totalTaps: 0,
        totalLpEarned: 0,
        totalEnergyUsed: 0,
        sessionsPlayed: 1
      };
      const created = await db.insert(schema.gameStats).values(defaultStats).returning();
      return created[0];
    } catch (error) {
      console.error('Error getting user stats:', error);
      // Return default stats on error
      return {
        userId,
        totalTaps: 0,
        totalLpEarned: 0,
        totalEnergyUsed: 0,
        sessionsPlayed: 1
      };
    }
  }
  
  async updateUserStats(userId: string, updates: any) {
    try {
      await db.update(schema.gameStats).set(updates).where(eq(schema.gameStats.userId, userId));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
  
  async getUserByUsername(username: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }
  
  async getAllMedia() {
    return await db.select().from(schema.mediaFiles);
  }
  
  // Placeholder implementations for other methods
  async getCharacter(id: string) { return undefined; }
  async getUserCharacters(userId: string) { return []; }
  async createCharacter(character: any) { return character; }
  async updateCharacter(id: string, updates: any) { return undefined; }
  async deleteCharacter(id: string) {}
  async selectCharacter(userId: string, characterId: string) {}
  async getUpgrade(id: string) { return undefined; }
  async getAllUpgrades() { return []; }
  async createUpgrade(upgrade: any) { return upgrade; }
  async updateUpgrade(id: string, updates: any) { return undefined; }
  async purchaseUpgrade(userId: string, upgradeId: string) { return { id: 'upgrade1', name: 'Test' }; }
  async upgradeUserUpgrade(userId: string, upgradeId: string) { return { id: 'upgrade1', name: 'Test' }; }
  async deleteUpgrade(id: string) {}
  async getChatMessages(userId: string, characterId?: string) { return []; }
  async createChatMessage(message: any) { return message; }
  async clearChatHistory(userId: string, characterId?: string) {}
  async getLastWheelSpin(userId: string) { return null; }
  async recordWheelSpin(userId: string, reward: string) {}
  async getGameSettings() { return {}; }
  async updateGameSettings(settings: any) {}
  async getSystemStats() { return {}; }
  async exportAllData() { return {}; }
  async getMediaFiles(characterId?: string) { return []; }
  async getMediaFile(id: string) { return undefined; }
  async saveMediaFile(file: any) { return file; }
  async uploadMedia(file: any) { return file; }
  async updateMediaFile(id: string, updates: any) { return undefined; }
  async deleteMediaFile(id: string) {}
}

// Create and export storage instance  
export const storage = new DrizzleStorage();

// For backward compatibility, also export DB initialization
let dbInitialized = true;

export function initDB() {
  if (!dbInitialized) {
    console.log('[Storage] DB initialized.');
    dbInitialized = true;
  }
}