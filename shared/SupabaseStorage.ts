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
} from "@shared/schema";
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
  private supabase;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
    return data;
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
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
    return data;
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    const { data, error } = await this.supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching character:', error);
      return undefined;
    }
    return data;
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
    const { data, error } = await this.supabase
      .from('characters')
      .select('*');
    
    if (error) {
      console.error('Error fetching all characters:', error);
      return [];
    }
    return data || [];
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    // For now, return the first character - implement proper selection logic later
    const characters = await this.getUserCharacters(userId);
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
    // Implement character selection logic - could be a user preference or separate table
    // For now, ensure the user has access to this character
    const { error } = await this.supabase
      .from('user_characters')
      .upsert({
        user_id: userId,
        character_id: characterId
      });
    
    if (error) throw error;
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
    const { data, error } = await this.supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // Create default stats if none exist
      const defaultStats = {
        user_id: userId,
        total_taps: 0,
        total_lp_earned: 0,
        total_energy_used: 0,
        sessions_played: 0
      };
      
      const { data: newData, error: createError } = await this.supabase
        .from('game_stats')
        .insert(defaultStats)
        .select()
        .single();
      
      if (createError) throw createError;
      return newData;
    }
    return data;
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    const { error } = await this.supabase
      .from('game_stats')
      .update(updates)
      .eq('user_id', userId);
    
    if (error) throw error;
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
    const { data, error } = await this.supabase
      .from('media_files')
      .insert(file)
      .select()
      .single();
    
    if (error) throw error;
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
}