import { createClient } from '@supabase/supabase-js';
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



// Helper function to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/([_][a-z])/g, (group) => group.toUpperCase().replace('_', ''));
}

// Universal mapper function for database operations
function mapToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[toCamelCase(key)] = obj[key];
    }
  }
  return newObj;
}


// Function to map an array of objects from snake_case to camelCase
function mapArrayToCamelCase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(item => mapToCamelCase(item));
}


export class SupabaseStorage implements IStorage {
  private static instance: SupabaseStorage;
  private supabaseClient;
  public get supabase() { return this.supabaseClient; }

  constructor() {
    let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Ensure URL is properly formatted
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      // If it's just a project ID, construct the full URL
      supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }

    console.log('[SupabaseStorage] Connecting to Supabase:', supabaseUrl);

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Store singleton instance
    SupabaseStorage.instance = this;
    console.log('[SupabaseStorage] Singleton instance created');
  }

  // Singleton getter method
  static getInstance(): SupabaseStorage {
    if (!SupabaseStorage.instance) {
      SupabaseStorage.instance = new SupabaseStorage();
    }
    return SupabaseStorage.instance;
  }

  // Convert camelCase to snake_case for database columns
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Convert object keys from camelCase to snake_case
  private convertKeysToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToSnakeCase(item));
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = this.toSnakeCase(key);
        result[snakeKey] = this.convertKeysToSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  // Convert object keys from snake_case to camelCase
  private convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToCamelCase(item));
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.convertKeysToCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    // Handle telegram IDs differently from UUID IDs
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('telegramid', telegramId)
        .single();

      if (error) {
        console.error('Error fetching user by telegram ID:', error);
        return undefined;
      }
      // Map to camelCase
     return data ? mapToCamelCase(data) : undefined;
    } else {
      // Regular UUID lookup
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user by UUID:', error);
        return undefined;
      }
      // Map to camelCase
      return data ? mapToCamelCase(data) : undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    // Map to camelCase
    return data ? mapToCamelCase(data) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Convert to lowercase for database (Supabase uses lowercase column names)
    const dbUser: any = {};
    Object.keys(user).forEach(key => {
      dbUser[key.toLowerCase()] = user[key];
    });

    const { data, error } = await this.supabaseClient
      .from('users')
      .insert(dbUser)
      .select()
      .single();

    if (error) throw error;
    // Map to camelCase
    return mapToCamelCase(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const safeUpdates = { ...updates };

    // Remove any undefined or null values
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key] === undefined || safeUpdates[key] === null) {
        delete safeUpdates[key];
      }
    });

    // Convert to lowercase for database (Supabase uses lowercase column names)
    const dbUpdates: any = {};
    Object.keys(safeUpdates).forEach(key => {
      dbUpdates[key.toLowerCase()] = safeUpdates[key];
    });

    // Handle telegram IDs differently from UUID IDs
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabaseClient
        .from('users')
        .update(dbUpdates)
        .eq('telegramid', telegramId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user by telegram ID:', error);
        if (error.code === 'PGRST116') {
          console.log(`User ${telegramId} not found, may need to be created`);
        }
        return undefined;
      }
      // Map to camelCase
      return data ? mapToCamelCase(data) : undefined;
    } else {
      // Regular UUID update
      const { data, error } = await this.supabaseClient
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user by UUID:', error);
        if (error.code === 'PGRST116') {
          console.log(`User ${id} not found via UUID, this might be a telegram ID mismatch`);
        }
        return undefined;
      }
      // Map to camelCase
      return data ? mapToCamelCase(data) : undefined;
    }
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    // Load character from JSON file first
    try {
      const fs = await import('fs');
      const path = await import('path');

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
    const { data, error } = await this.supabaseClient
      .from('usercharacters')
      .select(`
        characters (*)
      `)
      .eq('userid', userId);

    if (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
    // Map to camelCase
    return (data?.map((item: any) => item.characters) || []).map(char => mapToCamelCase(char)).filter(Boolean) as Character[];
  }

  async getAllCharacters(): Promise<Character[]> {
    // Load characters from JSON files first (your real data)
    try {
      const fs = await import('fs');
      const path = await import('path');

      const characterDataPath = path.join(process.cwd(), 'character-data');

      if (!fs.existsSync(characterDataPath)) {
        console.log('No character-data directory found');
        return [];
      }

      const files = fs.readdirSync(characterDataPath).filter(file => file.endsWith('.json'));
      const characters: Character[] = [];

      for (const file of files) {
        try {
          const filePath = path.join(characterDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const character = JSON.parse(fileContent);
          characters.push({
            ...character,
            createdAt: new Date(character.createdAt),
            updatedAt: new Date(character.updatedAt || character.createdAt)
          });
        } catch (fileError) {
          console.error(`Error loading character from ${file}:`, fileError);
        }
      }

      console.log(`Loaded ${characters.length} characters from JSON files`);
      return characters;

    } catch (error) {
      console.error('Error loading characters from files:', error);
      return [];
    }
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    // Return the first character from JSON files for now
    const characters = await this.getAllCharacters();
    return characters[0];
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const { data, error } = await this.supabaseClient
      .from('characters')
      .insert(mapToCamelCase(character))
      .select()
      .single();

    if (error) throw error;
    // Map to camelCase
    return mapToCamelCase(data);
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const { data, error } = await this.supabaseClient
      .from('characters')
      .update(mapToCamelCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating character:', error);
      return undefined;
    }
    // Map to camelCase
    return data ? mapToCamelCase(data) : undefined;
  }

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    // For now, just store in memory - implement proper selection logic later
    console.log(`User ${userId} selected character ${characterId}`);
  }

  // Upgrade management
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabaseClient
      .from('upgrades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching upgrade:', error);
      return undefined;
    }
    // Map to camelCase
    return data ? mapToCamelCase(data) : undefined;
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    const { data, error } = await this.supabaseClient
      .from('userupgrades')
      .select(`
        upgrades (*)
      `)
      .eq('userid', userId);

    if (error) {
      console.error('Error fetching user upgrades:', error);
      return [];
    }
    // Map to camelCase
    return (data?.map((item: any) => item.upgrades) || []).map(upgrade => mapToCamelCase(upgrade)).filter(Boolean) as Upgrade[];
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    const { data, error } = await this.supabaseClient
      .from('upgrades')
      .select('*');

    if (error) {
      console.error('Error fetching all upgrades:', error);
      return [];
    }
    // Map to camelCase
    return data ? mapArrayToCamelCase(data) : [];
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const { data, error } = await this.supabaseClient
      .from('upgrades')
      .insert(mapToCamelCase(upgrade))
      .select()
      .single();

    if (error) throw error;
    // Map to camelCase
    return mapToCamelCase(data);
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabaseClient
      .from('upgrades')
      .update(mapToCamelCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating upgrade:', error);
      return undefined;
    }
    // Map to camelCase
    return data ? mapToCamelCase(data) : undefined;
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    // Increment user's upgrade level
    const { data, error } = await this.supabaseClient.rpc('increment_userUpgrade', {
      p_userId: userId,
      p_upgradeId: upgradeId
    });

    if (error) throw error;
    // Map to camelCase
    return mapToCamelCase(data);
  }

  async deleteUpgrade(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('upgrades')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Game stats
  async getUserStats(userId: string): Promise<GameStats> {
    try {
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        const { data: user } = await this.supabaseClient
          .from('users')
          .select('id')
          .eq('telegramId', telegramId)
          .maybeSingle();

        if (user?.id) {
          realUserId = user.id;
        } else {
          return {
            userId: userId,
            totalTaps: 0,
            totalLpEarned: 0,
            totalEnergyUsed: 0,
            sessionsPlayed: 1
          } as GameStats;
        }
      }

      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', realUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        throw error;
      }

      if (!data) {
        const defaultStats = {
          userId: realUserId,
          totalTaps: 0,
          totalLpEarned: 0,
          totalEnergyUsed: 0,
          sessionsPlayed: 0
        };

        const { data: newData, error: createError } = await this.supabaseClient
          .from('users')
          .insert(defaultStats)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user stats:', createError);
          return {
            userId,
            totalTaps: 0,
            totalLpEarned: 0,
            totalEnergyUsed: 0,
            sessionsPlayed: 0
          } as GameStats;
        }
        // Map to camelCase
        return mapToCamelCase(newData);
      }
      // Map to camelCase
      return mapToCamelCase(data);
    } catch (error) {
      console.error('getUserStats error:', error);
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
    const currentStats = await this.getUserStats(userId);

    const incrementedUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.totalTaps !== undefined) {
      incrementedUpdates.totalTaps = (currentStats.totalTaps || 0) + (updates.totalTaps - (currentStats.totalTaps || 0));
    }
    if (updates.totalLpEarned !== undefined) {
      incrementedUpdates.totalLpEarned = (currentStats.totalLpEarned || 0) + (updates.totalLpEarned - (currentStats.totalLpEarned || 0));
    }
    if (updates.totalEnergyUsed !== undefined) {
      incrementedUpdates.totalEnergyUsed = (currentStats.totalEnergyUsed || 0) + (updates.totalEnergyUsed - (currentStats.totalEnergyUsed || 0));
    }

    console.log('📊 User stats update skipped - table removed during cleanup');
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    let query = this.supabaseClient
      .from('chatmessages')
      .select('*')
      .eq('userid', userId)
      .order('createdAt', { ascending: true });

    if (characterId) {
      query = query.eq('characterid', characterId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    // Map to camelCase
    return data ? mapArrayToCamelCase(data) : [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await this.supabaseClient
      .from('chatmessages')
      .insert(mapToCamelCase(message))
      .select()
      .single();

    if (error) throw error;
    // Map to camelCase
    return mapToCamelCase(data);
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    let query = this.supabaseClient
      .from('chatmessages')
      .delete()
      .eq('userid', userId);

    if (characterId) {
      query = query.eq('characterid', characterId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    const { data, error } = await this.supabaseClient
      .from('wheelRewards')
      .select('spunAt')
      .eq('userid', userId)
      .order('spunAt', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data ? new Date(data.spunAt) : null;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('wheelRewards')
      .insert({
        userId: userId,
        reward,
        amount: 1
      });

    if (error) throw error;
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
    const { data: userCount } = await this.supabaseClient
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { data: characterCount } = await this.supabaseClient
      .from('characters')
      .select('id', { count: 'exact', head: true });

    return {
      totalUsers: userCount?.length || 0,
      totalCharacters: characterCount?.length || 0,
      lastUpdated: new Date().toISOString()
    };
  }

  async exportAllData(): Promise<any> {
    const [users, characters, messages] = await Promise.all([
      this.supabaseClient.from('users').select('*'),
      this.supabaseClient.from('characters').select('*'),
      this.supabaseClient.from('chatmessages').select('*')
    ]);

    return {
      users: users.data ? mapArrayToCamelCase(users.data) : [],
      characters: characters.data ? mapArrayToCamelCase(characters.data) : [],
      messages: messages.data ? mapArrayToCamelCase(messages.data) : [],
      exportedAt: new Date().toISOString()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .select('*');

    if (error) {
      console.error('Error fetching all media:', error);
      return [];
    }

    // Map snake_case database columns to camelCase
    return data ? mapArrayToCamelCase(data) : [];
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    let query = this.supabaseClient.from('mediafiles').select('*');

    if (characterId) {
      query = query.eq('characterid', characterId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching media files:', error);
      return [];
    }

    return data ? mapArrayToCamelCase(data) : [];
  }

  async getMediaByCharacter(characterId: string): Promise<MediaFile[]> {
    return this.getMediaFiles(characterId);
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching media file:', error);
      return undefined;
    }
    return data ? mapToCamelCase(data) : undefined;
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const dbFile = mapToCamelCase(file);

    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .insert(dbFile)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    return mapToCamelCase(data);
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    const mediaFile: MediaFile = {
      characterId: file.characterId,
      fileName: file.filename,
      filePath: file.url,
      fileType: file.type,
      mood: file.mood,
      pose: file.pose,
      animationSequence: file.animationSequence,
      isNsfw: file.isNSFW || false,
      isVip: file.isVIP || false,
      isEvent: file.isEvent || false,
      randomSendChance: file.randomSendChance,
      requiredLevel: file.requiredLevel,
      enabledForChat: file.enabledForChat,
      category: file.category,
      autoOrganized: file.autoOrganized,
      createdAt: file.createdAt
    };

    return this.saveMediaFile(mediaFile);
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const dbUpdates = mapToCamelCase(updates);

    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating media file:', error);
      return undefined;
    }

    return data ? mapToCamelCase(data) : undefined;
  }

  async deleteMediaFile(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('mediafiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Additional methods for admin routes compatibility
  async createMedia(file: MediaFile): Promise<MediaFile> {
    return this.saveMediaFile(file);
  }

  async updateMedia(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const dbUpdates = mapToCamelCase(updates);

    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating media:', error);
      return undefined;
    }

    return data ? mapToCamelCase(data) : undefined;
  }

  async deleteMedia(id: string): Promise<void> {
    return this.deleteMediaFile(id);
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
    const { data, error } = await this.supabaseClient
      .from('mediafiles')
      .select('*')
      .or('fileName.is.null,filePath.is.null,characterId.is.null');

    if (error) {
      console.error('Error finding orphaned media files:', error);
      return [];
    }
    return data ? mapArrayToCamelCase(data) : [];
  }

  async getDuplicateMediaFiles(): Promise<{ duplicates: MediaFile[]; groups: { [key: string]: MediaFile[] } }> {
    const allFiles = await this.getAllMedia();
    const fileNameGroups: { [key: string]: MediaFile[] } = {};
    const duplicates: MediaFile[] = [];

    allFiles.forEach(file => {
      if (file.fileName) {
        if (!fileNameGroups[file.fileName]) {
          fileNameGroups[file.fileName] = [];
        }
        fileNameGroups[file.fileName].push(file);
      }
    });

    Object.keys(fileNameGroups).forEach(fileName => {
      if (fileNameGroups[fileName].length > 1) {
        duplicates.push(...fileNameGroups[fileName]);
      }
    });

    return { duplicates, groups: fileNameGroups };
  }

  async getMediaFileStats(): Promise<{
    total: number;
    orphaned: number;
    duplicates: number;
    withoutCharacter: number;
    withoutFileName: number;
  }> {
    const allFiles = await this.getAllMedia();
    const orphanedFiles = await this.getOrphanedMediaFiles();
    const { duplicates } = await this.getDuplicateMediaFiles();

    const withoutCharacter = allFiles.filter(f => !f.characterId).length;
    const withoutFileName = allFiles.filter(f => !f.fileName).length;

    return {
      total: allFiles.length,
      orphaned: orphanedFiles.length,
      duplicates: duplicates.length,
      withoutCharacter,
      withoutFileName
    };
  }

  // Missing admin methods for level requirements
  async getLevelRequirements(): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('levelRequirements')
      .select('*')
      .order('level');

    if (error) {
      console.error('Error fetching level requirements:', error);
      return [];
    }
    return data ? mapArrayToCamelCase(data) : [];
  }

  async createLevelRequirement(levelReq: any): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('levelRequirements')
      .insert(mapToCamelCase(levelReq))
      .select()
      .single();

    if (error) {
      console.error('Error creating level requirement:', error);
      throw new Error(`Failed to create level requirement: ${error.message}`);
    }
    return data ? mapToCamelCase(data) : undefined;
  }

  async updateLevelRequirement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('levelRequirements')
      .update(mapToCamelCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating level requirement:', error);
      throw new Error(`Failed to update level requirement: ${error.message}`);
    }
    return data ? mapToCamelCase(data) : undefined;
  }

  async deleteLevelRequirement(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('levelRequirements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting level requirement:', error);
      throw new Error(`Failed to delete level requirement: ${error.message}`);
    }
  }

  // Missing methods for upgrades management
  async getUpgrades(): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('upgrades')
      .select('*')
      .order('category, name');

    if (error) {
      console.error('Error fetching upgrades:', error);
      return [];
    }
    return data ? mapArrayToCamelCase(data) : [];
  }

  // Missing methods for achievements management
  async getAchievements(): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('achievements')
      .select('*')
      .order('category, sortOrder');

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return data ? mapArrayToCamelCase(data) : [];
  }

  async createAchievement(achievement: any): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('achievements')
      .insert(mapToCamelCase(achievement))
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      throw new Error(`Failed to create achievement: ${error.message}`);
    }
    return data ? mapToCamelCase(data) : undefined;
  }

  async updateAchievement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('achievements')
      .update(mapToCamelCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating achievement:', error);
      throw new Error(`Failed to update achievement: ${error.message}`);
    }
    return data ? mapToCamelCase(data) : undefined;
  }

  async deleteAchievement(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting achievement:', error);
      throw new Error(`Failed to delete achievement: ${error.message}`);
    }
  }

  // Missing method for character selection
  async setSelectedCharacter(userId: string, characterId: string): Promise<void> {
    await this.selectCharacter(userId, characterId);
  }
}