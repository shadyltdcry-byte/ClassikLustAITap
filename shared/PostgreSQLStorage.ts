import { db } from '../server/db.js';
import { eq, and, desc } from 'drizzle-orm';
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
  bonuses,
  achievements,
  userAchievements,
  levelRequirements
} from "./schema.js";
import { IStorage } from './storage.js';
import fs from 'fs';
import path from 'path';

export class PostgreSQLStorage implements IStorage {
  private static instance: PostgreSQLStorage;

  constructor() {
    // Store singleton instance
    PostgreSQLStorage.instance = this;
    console.log('[PostgreSQLStorage] Singleton instance created');
  }

  // Singleton getter method
  static getInstance(): PostgreSQLStorage {
    if (!PostgreSQLStorage.instance) {
      PostgreSQLStorage.instance = new PostgreSQLStorage();
    }
    return PostgreSQLStorage.instance;
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    try {
      // Handle telegram IDs differently from UUID IDs
      if (id.startsWith('telegram_')) {
        const telegramId = id.replace('telegram_', '');
        const result = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
        return result[0];
      } else {
        // Regular UUID lookup
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    // Load character from JSON file first
    try {
      const characterDataPath = path.join(process.cwd(), 'character-data');
      
      if (!fs.existsSync(characterDataPath)) {
        return undefined;
      }
      
      const files = fs.readdirSync(characterDataPath).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        try {
          const filePath = path.join(characterDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const character = JSON.parse(fileContent);
          
          if (character.id === id) {
            return {
              ...character,
              createdAt: new Date(character.createdAt),
              updatedAt: new Date(character.updatedAt || character.createdAt)
            };
          }
        } catch (fileError) {
          console.error(`Error loading character from ${file}:`, fileError);
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error loading character from file:', error);
      return undefined;
    }
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      const result = await db.select({
        character: characters
      }).from(userCharacters)
        .innerJoin(characters, eq(userCharacters.characterId, characters.id))
        .where(eq(userCharacters.userId, userId));
      
      return result.map(row => row.character);
    } catch (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
  }

  async getAllCharacters(): Promise<Character[]> {
    // Load characters from JSON files first (your real data)
    try {
      const characterDataPath = path.join(process.cwd(), 'character-data');
      
      if (!fs.existsSync(characterDataPath)) {
        console.log('No character-data directory found');
        return [];
      }
      
      const files = fs.readdirSync(characterDataPath).filter(file => file.endsWith('.json'));
      const charactersList: Character[] = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(characterDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const character = JSON.parse(fileContent);
          charactersList.push({
            ...character,
            createdAt: new Date(character.createdAt),
            updatedAt: new Date(character.updatedAt || character.createdAt)
          });
        } catch (fileError) {
          console.error(`Error loading character from ${file}:`, fileError);
        }
      }
      
      console.log(`Loaded ${charactersList.length} characters from JSON files`);
      return charactersList;
      
    } catch (error) {
      console.error('Error loading characters from files:', error);
      return [];
    }
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    // Return the first character from JSON files for now
    const charactersList = await this.getAllCharacters();
    return charactersList[0];
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const result = await db.insert(characters).values(character).returning();
    return result[0];
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    try {
      const result = await db.update(characters).set(updates).where(eq(characters.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating character:', error);
      return undefined;
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    // For now, just store in memory - implement proper selection logic later
    console.log(`User ${userId} selected character ${characterId}`);
  }

  async setSelectedCharacter(userId: string, characterId: string): Promise<void> {
    await this.selectCharacter(userId, characterId);
  }

  // Upgrade management
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    try {
      const result = await db.select().from(upgrades).where(eq(upgrades.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching upgrade:', error);
      return undefined;
    }
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    try {
      const result = await db.select({
        upgrade: upgrades
      }).from(userUpgrades)
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
      const result = await db.select().from(upgrades);
      return result;
    } catch (error) {
      console.error('Error fetching all upgrades:', error);
      return [];
    }
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const result = await db.insert(upgrades).values(upgrade).returning();
    return result[0];
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    try {
      const result = await db.update(upgrades).set(updates).where(eq(upgrades.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating upgrade:', error);
      return undefined;
    }
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    // First get the upgrade details
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) throw new Error('Upgrade not found');

    // Increment the user's upgrade level or create new record
    const existingUserUpgrade = await db.select().from(userUpgrades)
      .where(and(eq(userUpgrades.userId, userId), eq(userUpgrades.upgradeId, upgradeId)))
      .limit(1);

    if (existingUserUpgrade.length > 0) {
      await db.update(userUpgrades)
        .set({ level: existingUserUpgrade[0].level + 1 })
        .where(and(eq(userUpgrades.userId, userId), eq(userUpgrades.upgradeId, upgradeId)));
    } else {
      await db.insert(userUpgrades).values({
        userId,
        upgradeId,
        level: 1
      });
    }

    return upgrade;
  }

  async deleteUpgrade(id: string): Promise<void> {
    await db.delete(upgrades).where(eq(upgrades.id, id));
  }

  // Game stats
  async getUserStats(userId: string): Promise<GameStats> {
    try {
      // Convert telegram ID to real user ID if needed
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const user = await this.getUser(userId);
        if (user?.id) {
          realUserId = user.id;
        } else {
          // Return default stats if no user found
          return {
            userId: userId,
            totalTaps: 0,
            totalLpEarned: 0,
            totalEnergyUsed: 0,
            sessionsPlayed: 1
          } as GameStats;
        }
      }

      const result = await db.select().from(gameStats).where(eq(gameStats.userId, realUserId)).limit(1);
      
      if (result.length === 0) {
        // Create default stats if none exist
        const defaultStats = {
          userId: realUserId,
          totalTaps: 0,
          totalLpEarned: 0,
          totalEnergyUsed: 0,
          sessionsPlayed: 0
        };
        
        const newStats = await db.insert(gameStats).values(defaultStats).returning();
        return newStats[0];
      }
      
      return result[0];
    } catch (error) {
      console.error('getUserStats error:', error);
      // Return default stats on any error
      return {
        userId,
        totalTaps: 0,
        totalLpEarned: 0,
        totalEnergyUsed: 0,
        sessionsPlayed: 0
      } as GameStats;
    }
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    try {
      const currentStats = await this.getUserStats(userId);
      
      // Increment values instead of replacing them
      const incrementedUpdates: Partial<GameStats> = {};
      
      if (updates.totalTaps !== undefined) {
        incrementedUpdates.totalTaps = (currentStats.totalTaps || 0) + updates.totalTaps;
      }
      if (updates.totalLpEarned !== undefined) {
        incrementedUpdates.totalLpEarned = (currentStats.totalLpEarned || 0) + updates.totalLpEarned;
      }
      if (updates.totalEnergyUsed !== undefined) {
        incrementedUpdates.totalEnergyUsed = (currentStats.totalEnergyUsed || 0) + updates.totalEnergyUsed;
      }
      
      await db.update(gameStats).set(incrementedUpdates).where(eq(gameStats.userId, userId));
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    try {
      let query = db.select().from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt));
      
      if (characterId) {
        query = db.select().from(chatMessages)
          .where(and(eq(chatMessages.userId, userId), eq(chatMessages.characterId, characterId)))
          .orderBy(desc(chatMessages.createdAt));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    if (characterId) {
      await db.delete(chatMessages)
        .where(and(eq(chatMessages.userId, userId), eq(chatMessages.characterId, characterId)));
    } else {
      await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    }
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    try {
      const result = await db.select().from(wheelRewards)
        .where(eq(wheelRewards.userId, userId))
        .orderBy(desc(wheelRewards.spunAt))
        .limit(1);
      
      return result.length > 0 ? result[0].spunAt : null;
    } catch (error) {
      console.error('Error fetching last wheel spin:', error);
      return null;
    }
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    await db.insert(wheelRewards).values({
      userId,
      reward,
      amount: 1
    });
  }

  // Admin/Settings
  async getGameSettings(): Promise<any> {
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

  async updateGameSettings(settings: Partial<any>): Promise<void> {
    // Implement settings update logic
    console.log('Updating game settings:', settings);
  }

  async getSystemStats(): Promise<any> {
    try {
      const userCount = await db.select().from(users);
      const characterCount = await db.select().from(characters);
      
      return {
        totalUsers: userCount.length,
        totalCharacters: characterCount.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        totalCharacters: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async exportAllData(): Promise<any> {
    try {
      const [usersData, charactersData, messagesData] = await Promise.all([
        db.select().from(users),
        db.select().from(characters),
        db.select().from(chatMessages)
      ]);
      
      return {
        users: usersData,
        characters: charactersData,
        messages: messagesData,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        users: [],
        characters: [],
        messages: [],
        exportedAt: new Date().toISOString()
      };
    }
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    try {
      const result = await db.select().from(mediaFiles);
      return result;
    } catch (error) {
      console.error('Error fetching all media:', error);
      return [];
    }
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    try {
      if (characterId) {
        const result = await db.select().from(mediaFiles).where(eq(mediaFiles.characterId, characterId));
        return result;
      } else {
        const result = await db.select().from(mediaFiles);
        return result;
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    try {
      const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching media file:', error);
      return undefined;
    }
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const result = await db.insert(mediaFiles).values(file).returning();
    return result[0];
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    // This would handle actual file upload
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
      const result = await db.update(mediaFiles).set(updates).where(eq(mediaFiles.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating media file:', error);
      return undefined;
    }
  }

  async deleteMediaFile(id: string): Promise<void> {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  }

  // Additional methods used by routes but not in IStorage interface
  async getUpgrades(): Promise<Upgrade[]> {
    return this.getAllUpgrades();
  }

  async getLevelRequirements(): Promise<any[]> {
    try {
      const result = await db.select().from(levelRequirements).orderBy(levelRequirements.level);
      return result;
    } catch (error) {
      console.error('Error fetching level requirements:', error);
      return [];
    }
  }

  async createLevelRequirement(requirement: any): Promise<any> {
    const result = await db.insert(levelRequirements).values(requirement).returning();
    return result[0];
  }

  async updateLevelRequirement(id: string, updates: any): Promise<any> {
    const result = await db.update(levelRequirements).set(updates).where(eq(levelRequirements.id, id)).returning();
    return result[0];
  }

  async deleteLevelRequirement(id: string): Promise<void> {
    await db.delete(levelRequirements).where(eq(levelRequirements.id, id));
  }

  async getAchievements(): Promise<any[]> {
    try {
      const result = await db.select().from(achievements).orderBy(achievements.sortOrder);
      return result;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  async createAchievement(achievement: any): Promise<any> {
    const result = await db.insert(achievements).values(achievement).returning();
    return result[0];
  }

  async updateAchievement(id: string, updates: any): Promise<any> {
    const result = await db.update(achievements).set(updates).where(eq(achievements.id, id)).returning();
    return result[0];
  }

  async deleteAchievement(id: string): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, id));
  }

  // Bulk cleanup methods for ghost files
  async bulkDeleteMediaFiles(ids: string[]): Promise<{ deletedCount: number; errors: string[] }> {
    const results = { deletedCount: 0, errors: [] as string[] };
    
    for (const id of ids) {
      try {
        await this.deleteMediaFile(id);
        results.deletedCount++;
      } catch (error) {
        results.errors.push(`Failed to delete ${id}: ${error}`);
      }
    }
    
    return results;
  }

  async getOrphanedMediaFiles(): Promise<MediaFile[]> {
    try {
      // Find media files with missing or invalid data
      const result = await db.select().from(mediaFiles);
      return result.filter(file => !file.fileName || !file.filePath || !file.characterId);
    } catch (error) {
      console.error('Error finding orphaned media files:', error);
      return [];
    }
  }

  async getDuplicateMediaFiles(): Promise<{ duplicates: MediaFile[]; groups: { [key: string]: MediaFile[] } }> {
    // Get all media files and group by fileName to find duplicates
    const allFiles = await this.getAllMedia();
    const fileNameGroups: { [key: string]: MediaFile[] } = {};
    const duplicates: MediaFile[] = [];

    // Group files by fileName
    allFiles.forEach(file => {
      if (file.fileName) {
        if (!fileNameGroups[file.fileName]) {
          fileNameGroups[file.fileName] = [];
        }
        fileNameGroups[file.fileName].push(file);
      }
    });

    // Find groups with more than one file (duplicates)
    Object.keys(fileNameGroups).forEach(fileName => {
      if (fileNameGroups[fileName].length > 1) {
        duplicates.push(...fileNameGroups[fileName]);
      }
    });

    return { duplicates, groups: fileNameGroups };
  }
}