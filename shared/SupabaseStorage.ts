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

// 🎯 Field normalization - fixes PostgREST casing issues
const toCamel: Record<string, string> = {
  basecost: 'baseCost',
  baseeffect: 'baseEffect',
  costmultiplier: 'costMultiplier',
  effectmultiplier: 'effectMultiplier',
  maxlevel: 'maxLevel',
  levelrequirement: 'levelRequirement',
  unlocklevel: 'unlockLevel',
  currentlevel: 'currentLevel',
  sortorder: 'sortOrder',
  hourlybonus: 'hourlyBonus',
  tapbonus: 'tapBonus',
  requiredlevel: 'requiredLevel',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
};

const toSnake: Record<string, string> = Object.fromEntries(
  Object.entries(toCamel).map(([k, v]) => [v, k])
);

function normalizeFromDb<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = Array.isArray(row) ? [] : {};
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel[k] ?? k;
    out[key] = v && typeof v === 'object' && !Array.isArray(v)
      ? normalizeFromDb(v as any) : v;
  }
  return out;
}

function normalizeToDb<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = Array.isArray(row) ? [] : {};
  for (const [k, v] of Object.entries(row)) {
    const key = toSnake[k] ?? k;
    out[key] = v && typeof v === 'object' && !Array.isArray(v)
      ? normalizeToDb(v as any) : v;
  }
  return out;
}

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

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    SupabaseStorage.instance = this;
  }

  static getInstance(): SupabaseStorage {
    if (!SupabaseStorage.instance) {
      SupabaseStorage.instance = new SupabaseStorage();
    }
    return SupabaseStorage.instance;
  }

  // Upgrades - normalized
  async getAllUpgrades(): Promise<Upgrade[]> {
    const { data, error } = await this.supabase.from('upgrades').select('*');
    if (error) { console.error('Error fetching all upgrades:', error); return []; }
    return (data || []).map(normalizeFromDb);
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabase.from('upgrades').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') { console.error('Error fetching upgrade:', error); return undefined; }
    return data ? normalizeFromDb(data) : undefined;
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .insert(normalizeToDb(upgrade))
      .select()
      .single();
    if (error) throw error;
    return normalizeFromDb(data);
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const { data, error } = await this.supabase
      .from('upgrades')
      .update(normalizeToDb(updates))
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error && error.code !== 'PGRST116') { console.error('Error updating upgrade:', error); return undefined; }
    return data ? normalizeFromDb(data) : undefined;
  }
}
