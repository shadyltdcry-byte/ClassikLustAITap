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

// CRITICAL FIX: Map camelCase to actual database column names
function toDBColumn(str: string): string {
  // Map camelCase API fields to actual database column names
  const fieldMap: { [key: string]: string } = {
    'characterId': 'characterid',  // Database has lowercase characterid
    'filePath': 'filepath',
    'fileName': 'filename', 
    'fileType': 'filetype',
    'isNsfw': 'isnsfw',
    'isVip': 'isvip',
    'isEvent': 'isevent',
    'isWheelReward': 'iswheelreward',
    'enabledForChat': 'enabledforchat',
    'randomSendChance': 'randomsendchance',
    'requiredLevel': 'requiredlevel',
    'levelRequirement': 'levelrequirement',
    'createdAt': 'createdat',
    'updatedAt': 'updatedat',
    'userId': 'userid',
    'telegramId': 'telegramid',
    'sortOrder': 'sortorder'
  };
  
  return fieldMap[str] || str.toLowerCase();
}

// Map camelCase object to database column names
function mapToDBColumns<T extends Record<string, any>>(obj: T): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[toDBColumn(key)] = obj[key];
    }
  }
  return newObj;
}

// Map database results back to camelCase
function fromDBColumns(obj: Record<string, any>): Record<string, any> {
  const fieldMap: { [key: string]: string } = {
    'characterid': 'characterId',
    'filepath': 'filePath',
    'filename': 'fileName',
    'filetype': 'fileType',
    'isnsfw': 'isNsfw',
    'isvip': 'isVip',
    'isevent': 'isEvent',
    'iswheelreward': 'isWheelReward',
    'enabledforchat': 'enabledForChat',
    'randomsendchance': 'randomSendChance',
    'requiredlevel': 'requiredLevel',
    'levelrequirement': 'levelRequirement',
    'createdat': 'createdAt',
    'updatedat': 'updatedAt',
    'userid': 'userId',
    'telegramid': 'telegramId',
    'sortorder': 'sortOrder'
  };
  
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = fieldMap[key] || key;
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

// Function to map an array of objects from database to camelCase
function mapArrayFromDB<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(item => fromDBColumns(item));
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

  // User management
  async getUser(id: string): Promise<User | undefined> {
    // Handle telegram IDs differently from UUID IDs
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('telegramid', telegramId)  // Use lowercase
        .maybeSingle();  // Use maybeSingle to prevent multiple row errors

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by telegram ID:', error);
        return undefined;
      }
      return data ? fromDBColumns(data) : undefined;
    } else {
      // Regular UUID lookup
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();  // Use maybeSingle to prevent multiple row errors

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by UUID:', error);
        return undefined;
      }
      return data ? fromDBColumns(data) : undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(mapToDBColumns(user))
      .select()
      .single();

    if (error) throw error;
    return fromDBColumns(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const safeUpdates = { ...updates };
    
    // Remove any undefined or null values
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key] === undefined || safeUpdates[key] === null) {
        delete safeUpdates[key];
      }
    });

    // Convert to database column names
    const dbUpdates = mapToDBColumns(safeUpdates);

    // Handle telegram IDs differently from UUID IDs
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabase
        .from('users')
        .update(dbUpdates)
        .eq('telegramid', telegramId)  // Use lowercase
        .select()
        .maybeSingle();  // Use maybeSingle to prevent multiple row errors

      if (error && error.code !== 'PGRST116') {
        console.error('Error updating user by telegram ID:', error);
        return undefined;
      }
      return data ? fromDBColumns(data) : undefined;
    } else {
      // Regular UUID update
      const { data, error } = await this.supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();  // Use maybeSingle to prevent multiple row errors

      if (error && error.code !== 'PGRST116') {
        console.error('Error updating user by UUID:', error);
        return undefined;
      }
      return data ? fromDBColumns(data) : undefined;
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
    const { data, error } = await this.supabase
      .from('userCharacters')
      .select(`
        characters (*)
      `)
      .eq('userid', userId);  // Use lowercase

    if (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
    return (data?.map((item: any) => item.characters) || []).map(char => fromDBColumns(char)).filter(Boolean) as Character[];
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
    const { data, error } = await this.supabase
      .from('characters')
      .insert(mapToDBColumns(character))
      .select()
      .single();

    if (error) throw error;
    return fromDBColumns(data);
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const { data, error } = await this.supabase
      .from('characters')
      .update(mapToDBColumns(updates))
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error updating character:', error);
      return undefined;
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('upgrades')
      .select('*')
      .eq('id', id)
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching upgrade:', error);
      return undefined;
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    const { data, error } = await this.supabase
      .from('userUpgrades')
      .select(`
        upgrades (*)
      `)
      .eq('userid', userId);  // Use lowercase

    if (error) {
      console.error('Error fetching user upgrades:', error);
      return [];
    }
    return (data?.map((item: any) => item.upgrades) || []).map(upgrade => fromDBColumns(upgrade)).filter(Boolean) as Upgrade[];
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .select('*');

    if (error) {
      console.error('Error fetching all upgrades:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .insert(mapToDBColumns(upgrade))
      .select()
      .single();

    if (error) throw error;
    return fromDBColumns(data);
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .update(mapToDBColumns(updates))
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error updating upgrade:', error);
      return undefined;
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    // Increment user's upgrade level
    const { data, error } = await this.supabase.rpc('increment_userUpgrade', {
      p_userid: userId,      // Use lowercase
      p_upgradeid: upgradeId // Use lowercase
    });

    if (error) throw error;
    return fromDBColumns(data);
  }

  async deleteUpgrade(id: string): Promise<void> {
    const { error } = await this.supabase
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
        const { data: user } = await this.supabase
          .from('users')
          .select('id')
          .eq('telegramid', telegramId)  // Use lowercase
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

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', realUserId)
        .maybeSingle();  // Use maybeSingle to prevent multiple row errors

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

        const { data: newData, error: createError } = await this.supabase
          .from('users')
          .insert(mapToDBColumns(defaultStats))
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
        return fromDBColumns(newData);
      }
      return fromDBColumns(data);
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
    let query = this.supabase
      .from('chatMessages')
      .select('*')
      .eq('userid', userId)  // Use lowercase
      .order('createdat', { ascending: true });  // Use lowercase

    if (characterId) {
      query = query.eq('characterid', characterId);  // Use lowercase
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chatMessages')
      .insert(mapToDBColumns(message))
      .select()
      .single();

    if (error) throw error;
    return fromDBColumns(data);
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    let query = this.supabase
      .from('chatMessages')
      .delete()
      .eq('userid', userId);  // Use lowercase

    if (characterId) {
      query = query.eq('characterid', characterId);  // Use lowercase
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    const { data, error } = await this.supabase
      .from('wheelRewards')
      .select('spunat')  // Use lowercase
      .eq('userid', userId)  // Use lowercase
      .order('spunat', { ascending: false })  // Use lowercase
      .limit(1)
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last wheel spin:', error);
      return null;
    }
    return data ? new Date(data.spunat) : null;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    const { error } = await this.supabase
      .from('wheelRewards')
      .insert({
        userid: userId,  // Use lowercase
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
      eventEnabled: false,
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
    const { data: userCount } = await this.supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { data: characterCount } = await this.supabase
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
      this.supabase.from('users').select('*'),
      this.supabase.from('characters').select('*'),
      this.supabase.from('chatMessages').select('*')
    ]);

    return {
      users: users.data ? mapArrayFromDB(users.data) : [],
      characters: characters.data ? mapArrayFromDB(characters.data) : [],
      messages: messages.data ? mapArrayFromDB(messages.data) : [],
      exportedAt: new Date().toISOString()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    const { data, error } = await this.supabase
      .from('mediaFiles')
      .select('*');

    if (error) {
      console.error('Error fetching all media:', error);
      return [];
    }

    // Map database columns back to camelCase
    return data ? mapArrayFromDB(data) : [];
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    let query = this.supabase.from('mediaFiles').select('*');
    if (characterId) {
      query = query.eq('characterid', characterId);  // Use lowercase database column
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  async getMediaByCharacter(characterId: string): Promise<MediaFile[]> {
    return this.getMediaFiles(characterId);
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const dbFile = mapToDBColumns(file);
    console.log('[SupabaseStorage] Saving media file:', dbFile);
    const { data, error } = await this.supabase
      .from('mediaFiles')
      .insert(dbFile)
      .select()
      .single();
    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }
    return fromDBColumns(data);
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const dbUpdates = mapToDBColumns(updates);
    console.log('[SupabaseStorage] Updating media file:', id, 'with:', dbUpdates);
    const { data, error } = await this.supabase
      .from('mediaFiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors
    if (error && error.code !== 'PGRST116') {
      console.error('Error updating media file:', error);
      return undefined;
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    const mediaFile: MediaFile = {
      characterId: file.characterId,
      fileName: file.fileName,
      filePath: file.url,
      fileType: file.type,
      mood: file.mood,
      pose: file.pose,
      animationSequence: file.animationSequence,
      isNsfw: file.isNsfw || false,
      isVip: file.isVip || false,
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

  async deleteMediaFile(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('mediaFiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Additional methods for admin routes compatibility
  async createMedia(file: MediaFile): Promise<MediaFile> {
    return this.saveMediaFile(file);
  }

  async updateMedia(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const dbUpdates = mapToDBColumns(updates);

    const { data, error } = await this.supabase
      .from('mediaFiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error updating media:', error);
      return undefined;
    }

    return data ? fromDBColumns(data) : undefined;
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
    const { data, error } = await this.supabase
      .from('mediaFiles')
      .select('*')
      .or('filename.is.null,filepath.is.null,characterid.is.null');  // Use lowercase

    if (error) {
      console.error('Error finding orphaned media files:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
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
    const { data, error } = await this.supabase
      .from('levelRequirements')
      .select('*')
      .order('level');

    if (error) {
      console.error('Error fetching level requirements:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  async createLevelRequirement(levelReq: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('levelRequirements')
      .insert(mapToDBColumns(levelReq))
      .select()
      .single();

    if (error) {
      console.error('Error creating level requirement:', error);
      throw new Error(`Failed to create level requirement: ${error.message}`);
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async updateLevelRequirement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('levelRequirements')
      .update(mapToDBColumns(updates))
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error updating level requirement:', error);
      throw new Error(`Failed to update level requirement: ${error.message}`);
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async deleteLevelRequirement(id: string): Promise<void> {
    const { error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('upgrades')
      .select('*')
      .order('category, name');

    if (error) {
      console.error('Error fetching upgrades:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  // Missing methods for achievements management  
  async getAchievements(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .order('category, sortorder');  // Use lowercase

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return data ? mapArrayFromDB(data) : [];
  }

  async createAchievement(achievement: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('achievements')
      .insert(mapToDBColumns(achievement))
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      throw new Error(`Failed to create achievement: ${error.message}`);
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async updateAchievement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('achievements')
      .update(mapToDBColumns(updates))
      .eq('id', id)
      .select()
      .maybeSingle();  // Use maybeSingle to prevent multiple row errors

    if (error && error.code !== 'PGRST116') {
      console.error('Error updating achievement:', error);
      throw new Error(`Failed to update achievement: ${error.message}`);
    }
    return data ? fromDBColumns(data) : undefined;
  }

  async deleteAchievement(id: string): Promise<void> {
    const { error } = await this.supabase
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