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
        .eq('telegramId', telegramId)
        .single();
      
      if (error) {
        console.error('Error fetching user by telegram ID:', error);
        return undefined;
      }
      return data || undefined;
    } else {
      // Regular UUID lookup
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user by UUID:', error);
        return undefined;
      }
      return data;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    return data;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Use all updates since lastTick column now exists in database
    const safeUpdates = { ...updates };
    
    // Handle telegram IDs differently from UUID IDs
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabase
        .from('users')
        .update(safeUpdates)
        .eq('telegramId', telegramId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user by telegram ID:', error);
        // If user doesn't exist, try to create it with telegram ID
        if (error.code === 'PGRST116') {
          console.log(`User ${telegramId} not found, may need to be created`);
        }
        return undefined;
      }
      return data;
    } else {
      // Regular UUID update
      const { data, error } = await this.supabase
        .from('users')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user by UUID:', error);
        // If user doesn't exist with UUID, it might be a telegram ID
        if (error.code === 'PGRST116') {
          console.log(`User ${id} not found via UUID, this might be a telegram ID mismatch`);
        }
        return undefined;
      }
      return data;
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
      .from('user_characters')
      .select(`
        characters (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
    return data?.map((item: any) => item.characters).filter(Boolean) || [];
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
      .insert(character)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const { data, error } = await this.supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating character:', error);
      return undefined;
    }
    return data;
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
      .single();
    
    if (error) {
      console.error('Error fetching upgrade:', error);
      return undefined;
    }
    return data;
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    const { data, error } = await this.supabase
      .from('user_upgrades')
      .select(`
        upgrades (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user upgrades:', error);
      return [];
    }
    return data?.map((item: any) => item.upgrades).filter(Boolean) || [];
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .select('*');
    
    if (error) {
      console.error('Error fetching all upgrades:', error);
      return [];
    }
    return data || [];
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .insert(upgrade)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating upgrade:', error);
      return undefined;
    }
    return data;
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    // Increment user's upgrade level
    const { data, error } = await this.supabase.rpc('increment_user_upgrade', {
      p_user_id: userId,
      p_upgrade_id: upgradeId
    });
    
    if (error) throw error;
    return data;
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
      // Convert telegram ID to UUID if needed
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        const { data: user } = await this.supabase
          .from('users')
          .select('id')
          .eq('telegramId', telegramId)
          .maybeSingle();
        
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

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', realUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        throw error;
      }
      
      if (!data) {
        // Create default stats if none exist
        const defaultStats = {
          user_id: realUserId,
          total_taps: 0,
          total_lp_earned: 0,
          total_energy_used: 0,
          sessions_played: 0
        };
        
        const { data: newData, error: createError } = await this.supabase
          .from('users')
          .insert(defaultStats)
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user stats:', createError);
          // Return default stats if database insert fails
          return {
            userId,
            totalTaps: 0,
            totalLpEarned: 0,
            totalEnergyUsed: 0,
            sessionsPlayed: 0
          } as GameStats;
        }
        return newData;
      }
      return data;
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
    // Get current stats first
    const currentStats = await this.getUserStats(userId);
    
    // Increment values instead of replacing them
    const incrementedUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // If specific stats are being updated, add to existing values
    if (updates.totalTaps !== undefined) {
      incrementedUpdates.total_taps = (currentStats.totalTaps || 0) + (updates.totalTaps - (currentStats.totalTaps || 0));
    }
    if (updates.totalLpEarned !== undefined) {
      incrementedUpdates.total_lp_earned = (currentStats.totalLpEarned || 0) + (updates.totalLpEarned - (currentStats.totalLpEarned || 0));
    }
    if (updates.totalEnergyUsed !== undefined) {
      incrementedUpdates.total_energy_used = (currentStats.totalEnergyUsed || 0) + (updates.totalEnergyUsed - (currentStats.totalEnergyUsed || 0));
    }
    
    // DISABLED: user_stats table was removed during ghost column cleanup
    // const { error } = await this.supabase
    //   .from('user_stats')
    //   .update(incrementedUpdates)
    //   .eq('user_id', userId);
    // 
    // if (error) throw error;
    console.log('📊 User stats update skipped - table removed during cleanup');
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    let query = this.supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (characterId) {
      query = query.eq('character_id', characterId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return data || [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    let query = this.supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);
    
    if (characterId) {
      query = query.eq('character_id', characterId);
    }
    
    const { error } = await query;
    if (error) throw error;
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    const { data, error } = await this.supabase
      .from('wheel_rewards')
      .select('spun_at')
      .eq('user_id', userId)
      .order('spun_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data ? new Date(data.spun_at) : null;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    const { error } = await this.supabase
      .from('wheel_rewards')
      .insert({
        user_id: userId,
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
    // Get system-wide statistics
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
    // Export all data for backup purposes
    const [users, characters, messages] = await Promise.all([
      this.supabase.from('users').select('*'),
      this.supabase.from('characters').select('*'),
      this.supabase.from('chat_messages').select('*')
    ]);
    
    return {
      users: users.data || [],
      characters: characters.data || [],
      messages: messages.data || [],
      exportedAt: new Date().toISOString()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    const { data, error } = await this.supabase
      .from('media_files')
      .select('*');
    
    if (error) {
      console.error('Error fetching all media:', error);
      return [];
    }
    return data || [];
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    let query = this.supabase.from('media_files').select('*');
    
    if (characterId) {
      query = query.eq('character_id', characterId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
    return data || [];
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const { data, error } = await this.supabase
      .from('media_files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching media file:', error);
      return undefined;
    }
    return data;
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    // Map the file object to match database schema
    const dbFile = {
      id: file.id,
      character_id: file.characterId,
      file_name: file.fileName,
      file_path: file.filePath,
      file_type: file.fileType || 'image',
      mood: file.mood,
      pose: file.pose,
      animation_sequence: file.animationSequence,
      is_nsfw: file.isNsfw || false,
      is_vip: file.isVip || false,
      is_event: file.isEvent || false,
      random_send_chance: file.randomSendChance || 5,
      required_level: file.requiredLevel || 1,
      enabled_for_chat: file.enabledForChat !== false,
      created_at: file.createdAt || new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('media_files')
      .insert(dbFile)
      .select()
      .single();
    
    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }
    return data;
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    // This would handle actual file upload to Supabase Storage
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
    const { data, error } = await this.supabase
      .from('media_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating media file:', error);
      return undefined;
    }
    return data;
  }

  async deleteMediaFile(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_files')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Additional methods for admin routes compatibility
  async createMedia(file: MediaFile): Promise<MediaFile> {
    return this.saveMediaFile(file);
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
    // Find media files with missing or invalid data
    const { data, error } = await this.supabase
      .from('media_files')
      .select('*')
      .or('file_name.is.null,file_path.is.null,character_id.is.null');
    
    if (error) {
      console.error('Error finding orphaned media files:', error);
      return [];
    }
    return data || [];
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
      .from('level_requirements')
      .select('*')
      .order('level');
    
    if (error) {
      console.error('Error fetching level requirements:', error);
      return [];
    }
    return data || [];
  }

  async createLevelRequirement(levelReq: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('level_requirements')
      .insert(levelReq)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating level requirement:', error);
      throw new Error(`Failed to create level requirement: ${error.message}`);
    }
    return data;
  }

  async updateLevelRequirement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('level_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating level requirement:', error);
      throw new Error(`Failed to update level requirement: ${error.message}`);
    }
    return data;
  }

  async deleteLevelRequirement(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('level_requirements')
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
    return data || [];
  }

  // Missing methods for achievements management  
  async getAchievements(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .order('category, sort_order');
    
    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return data || [];
  }

  async createAchievement(achievement: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating achievement:', error);
      throw new Error(`Failed to create achievement: ${error.message}`);
    }
    return data;
  }

  async updateAchievement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('achievements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating achievement:', error);
      throw new Error(`Failed to update achievement: ${error.message}`);
    }
    return data;
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