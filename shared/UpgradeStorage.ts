/**
 * UpgradeStorage.ts - Self-Healing JSON-First Upgrade System (Error-Free)
 * Last Edited: 2025-10-24 by Assistant - Added defensive guards against undefined errors
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
  private static schemaInFlight: Promise<void> | null = null;
  private static lastSchemaCheck = 0;
  private static readonly SCHEMA_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private cache: Map<string, Upgrade[]> = new Map();
  private storage = SupabaseStorage.getInstance();

  static getInstance() {
    if (!UpgradeStorage.instance) {
      UpgradeStorage.instance = new UpgradeStorage();
    }
    return UpgradeStorage.instance;
  }

  /**
   * 🛡️ THROTTLED SCHEMA INITIALIZATION (ANTI-SPAM)
   * Runs once per server startup or after TTL expires
   * Prevents the log spam from repeated ensureSchema() calls
   */
  async ensureSchema(): Promise<void> {
    const now = Date.now();
    
    // Check if already initialized and within TTL
    if (UpgradeStorage.schemaInitialized && 
        (now - UpgradeStorage.lastSchemaCheck < UpgradeStorage.SCHEMA_TTL_MS)) {
      return; // Silent return - no spam
    }

    // If already in flight, wait for it
    if (UpgradeStorage.schemaInFlight) {
      return UpgradeStorage.schemaInFlight;
    }

    // Start schema initialization
    UpgradeStorage.schemaInFlight = this.doSchemaInit();
    
    try {
      await UpgradeStorage.schemaInFlight;
    } finally {
      UpgradeStorage.schemaInFlight = null;
    }
  }

  /**
   * 🔧 ACTUAL SCHEMA WORK (PRIVATE)
   * Only logs on first run or after TTL - prevents spam
   */
  private async doSchemaInit(): Promise<void> {
    console.log('🔍 [UPGRADES] Initializing schema (throttled)...');
    
    try {
      // 1. Create tables with quoted identifiers for case preservation
      const schemaQueries = [
        // Create upgrades master table (no DROP - preserve existing data)
        `CREATE TABLE IF NOT EXISTS "upgrades" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "maxLevel" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        
        // Create user upgrades progress table (no DROP - preserve existing data)
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

      // Mark as successful
      UpgradeStorage.schemaInitialized = true;
      UpgradeStorage.lastSchemaCheck = Date.now();
      console.log('✅ [UPGRADES] Schema initialized successfully (throttled)');

    } catch (error) {
      console.error('❌ [UPGRADES] Schema initialization failed:', error);
      // Set as initialized anyway to prevent infinite retries
      UpgradeStorage.schemaInitialized = true;
      UpgradeStorage.lastSchemaCheck = Date.now();
    }
  }

  /**
   * 🔄 AUTO-SYNC JSON → DATABASE
   * Reads all JSON upgrade files and ensures they exist in DB for FK validation
   */
  private async syncJsonToDatabase(): Promise<void> {
    try {
      const allUpgrades = await this.loadAllUpgradesFromFiles();
      console.log(`🔄 [UPGRADES] Syncing ${allUpgrades.length} upgrades from JSON to DB...`);

      // Insert/update each upgrade in the master table
      for (const upgrade of allUpgrades) {
        try {
          // Ensure we have valid data before sync
          if (!upgrade || !upgrade.id || typeof upgrade.id !== 'string') {
            console.warn('⚠️ [UPGRADES] Skipping malformed upgrade:', upgrade);
            continue;
          }

          const { error } = await this.storage.supabase
            .from('upgrades')
            .upsert({
              id: upgrade.id, // Always TEXT, no UUID casting
              name: upgrade.name || 'Unknown',
              category: upgrade.category || 'special',
              maxLevel: upgrade.maxLevel || 1
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error && !error.message?.includes('duplicate')) {
            console.warn(`⚠️ [UPGRADES] Failed to sync ${upgrade.id}: ${error.message}`);
          }
        } catch (e: any) {
          console.warn(`⚠️ [UPGRADES] Sync error for ${upgrade?.id || 'unknown'}: ${e.message}`);
          // Continue with other upgrades if one fails
        }
      }

      console.log('✅ [UPGRADES] JSON → DB sync completed');

    } catch (error) {
      console.warn('⚠️ [UPGRADES] JSON sync failed:', error);
    }
  }

  /**
   * 📂 LOAD FILES WITHOUT SCHEMA CALLS
   * Prevents recursive schema initialization
   */
  private async loadAllUpgradesFromFiles(): Promise<Upgrade[]> {
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
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return allUpgrades;
  }

  private async loadUpgradeFile(filename: string): Promise<Upgrade[]> {
    const filePath = join(process.cwd(), 'game-data', 'upgrades', filename);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      
      // Handle both array and single object formats
      const upgrades = Array.isArray(data) ? data : [data];
      
      // Validate and normalize upgrades - DEFENSIVE FILTERING
      return upgrades.filter(upgrade => {
        return upgrade && 
               typeof upgrade.id === 'string' &&
               typeof upgrade.name === 'string' &&
               typeof upgrade.baseCost === 'number' &&
               upgrade.id.length > 0;
      });
    } catch (error) {
      console.warn(`⚠️ [UPGRADES] Failed to load ${filename}:`, error);
      return [];
    }
  }

  /**
   * 📂 GET ALL UPGRADES (PUBLIC API)
   * Only calls schema init once, then uses cache
   */
  async getAllUpgrades(): Promise<Upgrade[]> {
    // Run schema check only once (throttled)
    await this.ensureSchema();
    
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    // Load from files (no recursive schema calls)
    const allUpgrades = await this.loadAllUpgradesFromFiles();

    this.cache.set(cacheKey, allUpgrades);
    return allUpgrades;
  }

  async getUpgrade(upgradeId: string): Promise<Upgrade | null> {
    if (!upgradeId || typeof upgradeId !== 'string') return null;
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.find(u => u.id === upgradeId) || null;
  }

  async getUpgradesByCategory(category: string): Promise<Upgrade[]> {
    if (!category || typeof category !== 'string') return [];
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.filter(u => u.category === category);
  }

  calculateCost(upgrade: Upgrade, currentLevel: number): number {
    if (!upgrade || !Number.isFinite(currentLevel) || currentLevel >= (upgrade.maxLevel || 1)) {
      return Infinity;
    }
    const baseCost = upgrade.baseCost || 0;
    const multiplier = upgrade.costMultiplier || 1.5;
    return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
  }

  calculateEffect(upgrade: Upgrade, level: number): number {
    if (!upgrade || !Number.isFinite(level) || level === 0) return 0;
    const baseEffect = upgrade.baseEffect || 0;
    const multiplier = upgrade.effectMultiplier || 0;
    return baseEffect + (multiplier * (level - 1));
  }

  calculateTotalEffect(upgrade: Upgrade, level: number): number {
    if (!upgrade || !Number.isFinite(level) || level === 0) {
      return upgrade?.baseEffect || 0;
    }
    // For multiplicative effects, compound the bonus
    if (upgrade.category === 'lpPerTap' && upgrade.id !== 'mega-tap') {
      const baseEffect = upgrade.baseEffect || 0;
      const multiplier = upgrade.effectMultiplier || 0;
      return baseEffect * Math.pow(1 + multiplier, level - 1);
    }
    // For additive effects
    const baseEffect = upgrade.baseEffect || 0;
    const multiplier = upgrade.effectMultiplier || 0;
    return baseEffect + (multiplier * level);
  }

  /**
   * 📊 DATABASE OPERATIONS (THROTTLED & DEFENSIVE)
   */
  async getUserUpgrades(userId: string): Promise<UserUpgrade[]> {
    if (!userId || typeof userId !== 'string') return [];
    
    await this.ensureSchema(); // Throttled call
    
    try {
      const { data, error } = await this.storage.supabase
        .from('userUpgrades')
        .select('upgradeId, level')
        .eq('userId', userId);
      
      if (error) {
        console.error('Failed to get user upgrades:', error);
        return [];
      }
      
      // DEFENSIVE: Filter out malformed rows
      const validUpgrades = (data || []).filter(row => {
        return row && 
               typeof row.upgradeId === 'string' && 
               row.upgradeId.length > 0 &&
               Number.isFinite(row.level);
      });
      
      return validUpgrades;
    } catch (error: any) {
      console.error('Exception getting user upgrades:', error);
      return [];
    }
  }

  async getUserUpgradeLevel(userId: string, upgradeId: string): Promise<number> {
    if (!userId || !upgradeId) return 0;
    
    try {
      const userUpgrades = await this.getUserUpgrades(userId);
      const upgrade = userUpgrades.find(u => u.upgradeId === upgradeId);
      return upgrade?.level || 0;
    } catch (error: any) {
      console.error('Exception getting user upgrade level:', error);
      return 0;
    }
  }

  async isUpgradeUnlocked(userId: string, upgrade: Upgrade): Promise<boolean> {
    // DEFENSIVE: Check all inputs
    if (!userId || !upgrade || !upgrade.id) {
      return false;
    }

    try {
      const user = await this.storage.getUser(userId);
      if (!user) return false;

      // Check user level requirement
      const userLevel = user.level || 1;
      const requiredLevel = upgrade.requiredLevel || 1;
      if (userLevel < requiredLevel) return false;

      // Check upgrade requirements (defensive)
      const requirements = upgrade.unlockRequirements || {};
      if (requirements.upgradeId && Number.isFinite(requirements.level)) {
        const requiredLevel = await this.getUserUpgradeLevel(userId, requirements.upgradeId);
        if (requiredLevel < (requirements.level || 0)) return false;
      }

      // Check total upgrade levels requirement (defensive)
      if (Number.isFinite(requirements.totalUpgradeLevels) && requirements.totalUpgradeLevels! > 0) {
        const userUpgrades = await this.getUserUpgrades(userId);
        const totalLevels = userUpgrades.reduce((sum, u) => sum + (u.level || 0), 0);
        if (totalLevels < requirements.totalUpgradeLevels!) return false;
      }

      return true;
    } catch (error: any) {
      console.error('Exception checking upgrade unlock:', error);
      return false; // Fail closed
    }
  }

  async getAvailableUpgrades(userId: string): Promise<(Upgrade & { currentLevel: number; nextCost: number; canAfford: boolean })[]> {
    // DEFENSIVE: Validate input
    if (!userId || typeof userId !== 'string') {
      console.warn('⚠️ [UPGRADES] Invalid userId provided to getAvailableUpgrades');
      return [];
    }

    try {
      // Single schema check at start
      await this.ensureSchema();
      
      const allUpgrades = await this.getAllUpgrades();
      const user = await this.storage.getUser(userId);
      
      if (!user) {
        console.warn(`⚠️ [UPGRADES] User ${userId} not found`);
        return [];
      }

      // Get user progress and create lookup map
      const userUpgrades = await this.getUserUpgrades(userId);
      const progressMap = new Map<string, number>();
      
      // Build progress map with defensive checks
      for (const userUpgrade of userUpgrades) {
        if (userUpgrade && userUpgrade.upgradeId) {
          progressMap.set(userUpgrade.upgradeId, userUpgrade.level || 0);
        }
      }

      const result = [];
      
      // Process each upgrade defensively
      for (const upgrade of allUpgrades) {
        if (!upgrade || !upgrade.id) {
          console.warn('⚠️ [UPGRADES] Skipping malformed upgrade:', upgrade);
          continue;
        }

        try {
          // Check if upgrade is unlocked (with error handling)
          const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
          if (!isUnlocked) continue;

          // Get current level from progress map (defaults to 0)
          const currentLevel = progressMap.get(upgrade.id) || 0;
          
          // Calculate costs and affordability
          const nextCost = this.calculateCost(upgrade, currentLevel);
          const userLP = user.lp || 0;
          const canAfford = Number.isFinite(nextCost) && userLP >= nextCost;

          result.push({
            ...upgrade,
            currentLevel,
            nextCost,
            canAfford
          });
        } catch (upgradeError: any) {
          console.warn(`⚠️ [UPGRADES] Error processing upgrade ${upgrade.id}:`, upgradeError.message);
          // Continue with other upgrades
        }
      }

      console.log(`✅ [UPGRADES] Returning ${result.length} available upgrades`);
      return result;
      
    } catch (error: any) {
      console.error('❌ [UPGRADES] Failed to get available upgrades:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async validatePurchase(userId: string, upgradeId: string): Promise<{ valid: boolean; reason?: string; cost?: number }> {
    // DEFENSIVE: Validate inputs
    if (!userId || !upgradeId) {
      return { valid: false, reason: 'Invalid userId or upgradeId' };
    }

    try {
      await this.ensureSchema(); // Throttled call
      
      const upgrade = await this.getUpgrade(upgradeId);
      if (!upgrade) return { valid: false, reason: 'Upgrade not found' };

      const user = await this.storage.getUser(userId);
      if (!user) return { valid: false, reason: 'User not found' };

      const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
      if (!isUnlocked) return { valid: false, reason: 'Upgrade not unlocked' };

      const currentLevel = await this.getUserUpgradeLevel(userId, upgradeId);
      if (currentLevel >= (upgrade.maxLevel || 1)) {
        return { valid: false, reason: 'Max level reached' };
      }

      const cost = this.calculateCost(upgrade, currentLevel);
      if ((user.lp || 0) < cost) {
        return { valid: false, reason: 'Insufficient LP', cost };
      }

      return { valid: true, cost };
    } catch (error: any) {
      console.error('Exception validating purchase:', error);
      return { valid: false, reason: 'Validation failed' };
    }
  }

  /**
   * 🧹 ADMIN CONTROLS
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 [UPGRADES] Cache cleared');
  }

  // Force schema re-initialization (for admin endpoints)
  forceSchemaRefresh() {
    UpgradeStorage.schemaInitialized = false;
    UpgradeStorage.lastSchemaCheck = 0;
    UpgradeStorage.schemaInFlight = null;
    this.cache.clear();
    console.log('🔄 [UPGRADES] Schema refresh forced');
  }
}