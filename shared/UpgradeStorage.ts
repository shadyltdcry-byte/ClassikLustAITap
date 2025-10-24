import { promises as fs } from 'fs';
import { join } from 'path';
import { SupabaseStorage } from './SupabaseStorage';

export interface Upgrade {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'lpPerTap' | 'energy' | 'passive' | 'charisma' | 'special';
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
  private cache: Map<string, Upgrade[]> = new Map();
  private storage = SupabaseStorage.getInstance();

  static getInstance() {
    if (!UpgradeStorage.instance) UpgradeStorage.instance = new UpgradeStorage();
    return UpgradeStorage.instance;
  }

  private async loadUpgradeFile(filename: string): Promise<Upgrade[]> {
    const filePath = join(process.cwd(), 'game-data', 'upgrades', filename);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw) as Upgrade[];
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
      return [];
    }
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const files = ['tap-upgrades.json', 'energy-upgrades.json', 'passive-upgrades.json', 'special-upgrades.json'];
    const allUpgrades: Upgrade[] = [];

    for (const file of files) {
      const upgrades = await this.loadUpgradeFile(file);
      allUpgrades.push(...upgrades);
    }

    // Sort by category and sortOrder
    allUpgrades.sort((a, b) => {
      if (a.category !== b.category) {
        const categoryOrder = ['lpPerTap', 'energy', 'passive', 'charisma', 'special'];
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
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
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