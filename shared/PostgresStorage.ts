import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, asc, and } from 'drizzle-orm';
import postgres from 'postgres';
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
  users,
  characters,
  userCharacters,
  mediaFiles,
  upgrades,
  userUpgrades,
  boosters,
  wheelRewards,
  gameStats,
  chatMessages,
  bonuses
} from "./schema";
import { IStorage } from './storage';

// Define GameSettings type since it's referenced but not in schema
interface GameSettings {
  id: string;
  nsfwEnabled: boolean;
  vipEnabled: boolean;
  autoSave: boolean;
  soundEnabled: boolean;
  notifications: boolean;
  [key: string]: any;
}

export class PostgresStorage implements IStorage {
  private db;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const sql = postgres(connectionString);
    this.db = drizzle(sql);
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    try {
      const result = await this.db.select().from(characters).where(eq(characters.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching character:', error);
      return undefined;
    }
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      const result = await this.db
        .select({ character: characters })
        .from(userCharacters)
        .innerJoin(characters, eq(userCharacters.characterId, characters.id))
        .where(eq(userCharacters.userId, userId));
      
      return result.map(row => row.character);
    } catch (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
  }

  async getAllCharacters(): Promise<Character[]> {
    try {
      const result = await this.db.select().from(characters);
      return result;
    } catch (error) {
      console.error('Error fetching all characters:', error);
      return [];
    }
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    // For now, return the first character - implement proper selection logic later
    const userChars = await this.getUserCharacters(userId);
    return userChars[0];
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const result = await this.db.insert(characters).values(character).returning();
    return result[0];
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    try {
      const result = await this.db.update(characters).set(updates).where(eq(characters.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating character:', error);
      return undefined;
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.db.delete(characters).where(eq(characters.id, id));
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    // Ensure the user has access to this character
    await this.db
      .insert(userCharacters)
      .values({
        userId: userId,
        characterId: characterId
      })
      .onConflictDoNothing();
  }

  // Upgrade management
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    try {
      const result = await this.db.select().from(upgrades).where(eq(upgrades.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching upgrade:', error);
      return undefined;
    }
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    try {
      const result = await this.db
        .select({ upgrade: upgrades })
        .from(userUpgrades)
        .innerJoin(upgrades, eq(userUpgrades.upgradeId, upgrades.id))
        .where(eq(userUpgrades.userId, userId));
      
      return result.map(row => row.upgrade);
    } catch (error) {
      console.error('Error fetching user upgrades:', error);
      return [];
    }
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    try {
      const result = await this.db.select().from(upgrades);
      return result;
    } catch (error) {
      console.error('Error fetching all upgrades:', error);
      return [];
    }
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const result = await this.db.insert(upgrades).values(upgrade).returning();
    return result[0];
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    try {
      const result = await this.db.update(upgrades).set(updates).where(eq(upgrades.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating upgrade:', error);
      return undefined;
    }
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    // Get current user upgrade level or create if doesn't exist
    const existingUpgrade = await this.db
      .select()
      .from(userUpgrades)
      .where(and(
        eq(userUpgrades.userId, userId),
        eq(userUpgrades.upgradeId, upgradeId)
      ))
      .limit(1);

    if (existingUpgrade.length > 0) {
      // Increment existing upgrade level
      await this.db
        .update(userUpgrades)
        .set({ level: existingUpgrade[0].level + 1 })
        .where(eq(userUpgrades.id, existingUpgrade[0].id));
    } else {
      // Create new user upgrade at level 1
      await this.db
        .insert(userUpgrades)
        .values({
          userId: userId,
          upgradeId: upgradeId,
          level: 1
        });
    }

    // Return the upgrade details
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) throw new Error('Upgrade not found');
    return upgrade;
  }

  async deleteUpgrade(id: string): Promise<void> {
    await this.db.delete(upgrades).where(eq(upgrades.id, id));
  }

  // Game stats
  async getUserStats(userId: string): Promise<GameStats> {
    const result = await this.db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1);
    
    if (result.length === 0) {
      // Create default stats if none exist
      const defaultStats = {
        userId: userId,
        totalTaps: 0,
        totalLpEarned: 0,
        totalEnergyUsed: 0,
        sessionsPlayed: 0
      };
      
      const newStats = await this.db.insert(gameStats).values(defaultStats).returning();
      return newStats[0];
    }
    
    return result[0];
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    await this.db.update(gameStats).set(updates).where(eq(gameStats.userId, userId));
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    try {
      let whereClause = eq(chatMessages.userId, userId);
      if (characterId) {
        whereClause = and(whereClause, eq(chatMessages.characterId, characterId))!;
      }
      
      const result = await this.db
        .select()
        .from(chatMessages)
        .where(whereClause)
        .orderBy(asc(chatMessages.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await this.db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    let whereClause = eq(chatMessages.userId, userId);
    
    if (characterId) {
      whereClause = and(whereClause, eq(chatMessages.characterId, characterId))!;
    }
    
    await this.db.delete(chatMessages).where(whereClause);
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    try {
      const result = await this.db
        .select({ spunAt: wheelRewards.spunAt })
        .from(wheelRewards)
        .where(eq(wheelRewards.userId, userId))
        .orderBy(desc(wheelRewards.spunAt))
        .limit(1);
      
      return result.length > 0 ? result[0].spunAt : null;
    } catch (error) {
      return null;
    }
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    await this.db.insert(wheelRewards).values({
      userId: userId,
      reward: reward,
      amount: 1
    });
  }

  // Admin/Settings
  async getGameSettings(): Promise<GameSettings> {
    // For now return default settings - implement settings table later
    return {
      id: "default",
      nsfwEnabled: false,
      vipEnabled: false,
      autoSave: true,
      soundEnabled: true,
      notifications: true
    };
  }

  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    // Implement settings update logic
    console.log('Updating game settings:', settings);
  }

  async getSystemStats(): Promise<any> {
    // Get system-wide statistics
    const userCount = await this.db.select().from(users);
    const characterCount = await this.db.select().from(characters);
    
    return {
      totalUsers: userCount.length,
      totalCharacters: characterCount.length,
      lastUpdated: new Date().toISOString()
    };
  }

  async exportAllData(): Promise<any> {
    // Export all data for backup purposes
    const [allUsers, allCharacters, messages] = await Promise.all([
      this.db.select().from(users),
      this.db.select().from(characters),
      this.db.select().from(chatMessages)
    ]);
    
    return {
      users: allUsers,
      characters: allCharacters,
      messages: messages,
      exportedAt: new Date().toISOString()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    try {
      const result = await this.db.select().from(mediaFiles);
      return result;
    } catch (error) {
      console.error('Error fetching all media:', error);
      return [];
    }
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    try {
      let result;
      
      if (characterId) {
        result = await this.db.select().from(mediaFiles).where(eq(mediaFiles.characterId, characterId));
      } else {
        result = await this.db.select().from(mediaFiles);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    try {
      const result = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching media file:', error);
      return undefined;
    }
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const result = await this.db.insert(mediaFiles).values(file).returning();
    return result[0];
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    // This would handle actual file upload to storage
    // For now, create a database record
    const mediaFile = {
      characterId: file.characterId,
      fileName: file.filename,
      filePath: file.url,
      fileType: file.type,
      mood: file.mood,
      pose: file.pose,
      animationSequence: null,
      isNsfw: file.isNSFW || false,
      isVip: file.isVIP || false
    };
    
    return this.saveMediaFile(mediaFile as any);
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    try {
      const result = await this.db.update(mediaFiles).set(updates).where(eq(mediaFiles.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating media file:', error);
      return undefined;
    }
  }

  async deleteMediaFile(id: string): Promise<void> {
    await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  }
}