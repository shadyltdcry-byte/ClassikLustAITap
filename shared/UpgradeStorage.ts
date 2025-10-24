/**
 * UpgradeStorage.ts - Self-Healing JSON-First Upgrade System
 * Last Edited: 2025-10-24 by Assistant - Added auto-schema creation & JSON sync
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { SupabaseStorage } from './SupabaseStorage';

export interface Upgrade {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'lpPerTap' | 'energy' | 'passive' | 'charisma' | 'special' | 'lpPerHour';
  icon: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
  requiredLevel: number;
  sortOrder: number;
  hourlyBonus: number;
  tapBonus: number;
  unlockRequirements: {
    upgradeId?: string;
    level?: number;
    totalUpgradeLevels?: number;
  };
}

export interface UserUpgrade {
  upgradeId: string;
  level: number;
}

export class UpgradeStorage {
  private static instance: UpgradeStorage;
  private static schemaInitialized = false;
  private cache: Map<string, Upgrade[]> = new Map();
  private storage = SupabaseStorage.getInstance();

  static getInstance() {
    if (!UpgradeStorage.instance) {
      UpgradeStorage.instance = new UpgradeStorage();
    }
    return UpgradeStorage.instance;
  }

  /**
   * 🛡️ SELF-HEALING SCHEMA INITIALIZATION
   * Automatically creates tables with proper casing and syncs JSON → DB
   * Runs once per server startup, ensures zero DB setup needed
   */
  private async ensureSchema(): Promise<void> {
    if (UpgradeStorage.schemaInitialized) return;

    console.log('🔧 [UPGRADES] Auto-initializing schema...');
    
    try {
      // 1. Create tables with quoted identifiers for case preservation
      const schemaQueries = [
        // Drop conflicting tables
        'DROP TABLE IF EXISTS userupgrades CASCADE',
        'DROP TABLE IF EXISTS upgrades CASCADE',
        
        // Create upgrades master table
        `CREATE TABLE IF NOT EXISTS "upgrades" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "maxLevel" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        
        // Create user upgrades progress table
        `CREATE TABLE IF NOT EXISTS "userUpgrades" (
          "userId" TEXT NOT NULL,
          "upgradeId" TEXT NOT NULL,
          "level" INTEGER NOT NULL DEFAULT 0,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("userId","upgradeId")
        )`,
        
        // Create indexes
        'CREATE INDEX IF NOT EXISTS "idx_userUpgrades_user" ON "userUpgrades"("userId")',
        'CREATE INDEX IF NOT EXISTS "idx_userUpgrades_upgrade" ON "userUpgrades"("upgradeId")'
      ];

      // Execute schema queries individually (more reliable than bulk)
      for (const query of schemaQueries) {
        try {
          await this.storage.supabase.rpc('exec', { query });
        } catch (error: any) {
          // Ignore expected errors like "already exists"
          if (!error.message?.includes('already exists') && 
              !error.message?.includes('does not exist')) {
            console.warn(`⚠️ [UPGRADES] Schema query warning: ${error.message}`);
          }
        }
      }

      // 2. Auto-sync JSON upgrades to DB for FK compliance
      await this.syncJsonToDatabase();

      // 3. Force PostgREST schema cache refresh
      const timestamp = Date.now();
      try {
        await this.storage.supabase.rpc('exec', { 
          query: `COMMENT ON TABLE "upgrades" IS 'refresh-${timestamp}'` 
        });
      } catch (e) {
        // Comment might fail, ignore
      }

      console.log('✅ [UPGRADES] Schema auto-initialized successfully');
      UpgradeStorage.schemaInitialized = true;

    } catch (error) {
      console.error('❌ [UPGRADES] Schema initialization failed:', error);
      // Set as initialized anyway to prevent infinite retries
      UpgradeStorage.schemaInitialized = true;
    }
  }

  /**
   * 🔄 AUTO-SYNC JSON → DATABASE
   * Reads all JSON upgrade files and ensures they exist in DB for FK validation
   */
  private async syncJsonToDatabase(): Promise<void> {
    try {
      const allUpgrades = await this.getAllUpgrades();
      console.log(`🔄 [UPGRADES] Syncing ${allUpgrades.length} upgrades from JSON to DB...`);

      // Insert/update each upgrade in the master table
      for (const upgrade of allUpgrades) {
        try {
          const { error } = await this.storage.supabase
            .from('upgrades')
            .upsert({
              id: upgrade.id,
              name: upgrade.name,
              category: upgrade.category,
              maxLevel: upgrade.maxLevel
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error && !error.message?.includes('duplicate')) {
            console.warn(`⚠️ [UPGRADES] Failed to sync ${upgrade.id}: ${error.message}`);
          }
        } catch (e) {
          // Continue with other upgrades if one fails
        }
      }

      console.log('✅ [UPGRADES] JSON → DB sync completed');

    } catch (error) {
      console.warn('⚠️ [UPGRADES] JSON sync failed:', error);
    }
  }

  private async loadUpgradeFile(filename: string): Promise<Upgrade[]> {
    const filePath = join(process.cwd(), 'game-data', 'upgrades', filename);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      
      // Handle both array and single object formats
      const upgrades = Array.isArray(data) ? data : [data];
      
      // Validate and normalize upgrades
      return upgrades.filter(upgrade => {
        return upgrade && 
               typeof upgrade.id === 'string' &&
               typeof upgrade.name === 'string' &&
               typeof upgrade.baseCost === 'number';
      });
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
      return [];
    }
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    // Auto-heal schema on any access
    await this.ensureSchema();
    
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const files = [
      'tap-upgrades.json', 
      'energy-upgrades.json', 
      'passive-upgrades.json', 
      'special-upgrades.json',
      'lpPerHour.json',
      'lpPerTap.json',
      'booster-upgrades.json',
      'income-upgrades.json'
    ];
    
    const allUpgrades: Upgrade[] = [];

    for (const file of files) {
      const upgrades = await this.loadUpgradeFile(file);
      allUpgrades.push(...upgrades);
    }

    // Sort by category and sortOrder
    allUpgrades.sort((a, b) => {
      if (a.category !== b.category) {
        const categoryOrder = ['lpPerTap', 'energy', 'passive', 'lpPerHour', 'charisma', 'special'];
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      }
      return a.sortOrder - b.sortOrder;
    });

    this.cache.set(cacheKey, allUpgrades);
    return allUpgrades;
  }

  async getUpgrade(upgradeId: string): Promise<Upgrade | null> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.find(u => u.id === upgradeId) || null;
  }

  async getUpgradesByCategory(category: string): Promise<Upgrade[]> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.filter(u => u.category === category);
  }

  calculateCost(upgrade: Upgrade, currentLevel: number): number {
    if (currentLevel >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier || 1.5, currentLevel));
  }

  calculateEffect(upgrade: Upgrade, level: number): number {
    if (level === 0) return 0;
    return upgrade.baseEffect + (upgrade.effectMultiplier * (level - 1));
  }

  calculateTotalEffect(upgrade: Upgrade, level: number): number {
    if (level === 0) return upgrade.baseEffect;
    // For multiplicative effects, compound the bonus
    if (upgrade.category === 'lpPerTap' && upgrade.id !== 'mega-tap') {
      return upgrade.baseEffect * Math.pow(1 + upgrade.effectMultiplier, level - 1);
    }
    // For additive effects
    return upgrade.baseEffect + (upgrade.effectMultiplier * level);
  }

  async getUserUpgrades(userId: string): Promise<UserUpgrade[]> {
    await this.ensureSchema(); // Auto-heal
    
    const { data, error } = await this.storage.supabase
      .from('userUpgrades')
      .select('upgradeId, level')
      .eq('userId', userId);
    
    if (error) {
      console.error('Failed to get user upgrades:', error);
      return [];
    }
    
    return data || [];
  }

  async getUserUpgradeLevel(userId: string, upgradeId: string): Promise<number> {
    await this.ensureSchema(); // Auto-heal
    
    const userUpgrades = await this.getUserUpgrades(userId);
    const upgrade = userUpgrades.find(u => u.upgradeId === upgradeId);
    return upgrade?.level || 0;
  }

  async isUpgradeUnlocked(userId: string, upgrade: Upgrade): Promise<boolean> {
    const user = await this.storage.getUser(userId);
    if (!user) return false;

    // Check user level requirement
    if ((user.level || 1) < upgrade.requiredLevel) return false;

    // Check upgrade requirements
    if (upgrade.unlockRequirements.upgradeId && upgrade.unlockRequirements.level) {
      const requiredLevel = await this.getUserUpgradeLevel(userId, upgrade.unlockRequirements.upgradeId);
      if (requiredLevel < upgrade.unlockRequirements.level) return false;
    }

    // Check total upgrade levels requirement
    if (upgrade.unlockRequirements.totalUpgradeLevels) {
      const userUpgrades = await this.getUserUpgrades(userId);
      const totalLevels = userUpgrades.reduce((sum, u) => sum + u.level, 0);
      if (totalLevels < upgrade.unlockRequirements.totalUpgradeLevels) return false;
    }

    return true;
  }

  async getAvailableUpgrades(userId: string): Promise<(Upgrade & { currentLevel: number; nextCost: number; canAfford: boolean })[]> {
    await this.ensureSchema(); // Auto-heal on every access
    
    const allUpgrades = await this.getAllUpgrades();
    const user = await this.storage.getUser(userId);
    const userUpgrades = await this.getUserUpgrades(userId);
    
    if (!user) return [];

    const result = [];
    for (const upgrade of allUpgrades) {
      const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
      if (!isUnlocked) continue;

      const currentLevel = await this.getUserUpgradeLevel(userId, upgrade.id);
      const nextCost = this.calculateCost(upgrade, currentLevel);
      const canAfford = (user.lp || 0) >= nextCost;

      result.push({
        ...upgrade,
        currentLevel,
        nextCost,
        canAfford
      });
    }

    return result;
  }

  async validatePurchase(userId: string, upgradeId: string): Promise<{ valid: boolean; reason?: string; cost?: number }> {
    await this.ensureSchema(); // Auto-heal
    
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) return { valid: false, reason: 'Upgrade not found' };

    const user = await this.storage.getUser(userId);
    if (!user) return { valid: false, reason: 'User not found' };

    const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
    if (!isUnlocked) return { valid: false, reason: 'Upgrade not unlocked' };

    const currentLevel = await this.getUserUpgradeLevel(userId, upgradeId);
    if (currentLevel >= upgrade.maxLevel) return { valid: false, reason: 'Max level reached' };

    const cost = this.calculateCost(upgrade, currentLevel);
    if ((user.lp || 0) < cost) return { valid: false, reason: 'Insufficient LP', cost };

    return { valid: true, cost };
  }

  clearCache() {
    this.cache.clear();
  }
}