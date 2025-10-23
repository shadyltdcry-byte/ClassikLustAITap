// 🎯 FileStorage - JSON-first data management like characters
// No more hardcoded plugin bullshit, no more database normalization hell!

import { promises as fs } from 'fs';
import { join } from 'path';
import type { Upgrade, Achievement } from './schema';

export class FileStorage {
  private static instance: FileStorage;
  private gameDataPath: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.gameDataPath = join(process.cwd(), 'game-data');
    FileStorage.instance = this;
    console.log('[FileStorage] JSON-first data system initialized! 🎯');
  }

  static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  // 🎯 Generic JSON file operations
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }

  private async readJSON<T>(filePath: string, defaultValue: T[] = []): Promise<T[]> {
    const fullPath = join(this.gameDataPath, filePath);
    
    try {
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data) || defaultValue;
    } catch (error) {
      // File doesn't exist or is invalid - return default
      console.log(`[FileStorage] Creating new file: ${filePath}`);
      return defaultValue as T[];
    }
  }

  private async writeJSON<T>(filePath: string, data: T[]): Promise<void> {
    const fullPath = join(this.gameDataPath, filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    
    await this.ensureDirectory(dir);
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Update cache
    this.cache.set(filePath, data);
    console.log(`[FileStorage] Saved ${data.length} items to ${filePath}`);
  }

  private async getCached<T>(filePath: string): Promise<T[]> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }
    
    const data = await this.readJSON<T>(filePath);
    this.cache.set(filePath, data);
    return data;
  }

  // 🎯 UPGRADES - JSON-FIRST!
  async getAllUpgrades(): Promise<Upgrade[]> {
    const [tapUpgrades, incomeUpgrades, specialUpgrades, boosterUpgrades] = await Promise.all([
      this.getCached<Upgrade>('upgrades/tap-upgrades.json'),
      this.getCached<Upgrade>('upgrades/income-upgrades.json'),
      this.getCached<Upgrade>('upgrades/special-upgrades.json'),
      this.getCached<Upgrade>('upgrades/booster-upgrades.json'),
    ]);

    return [...tapUpgrades, ...incomeUpgrades, ...specialUpgrades, ...boosterUpgrades];
  }

  async getUpgradesByCategory(category: string): Promise<Upgrade[]> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.filter(upgrade => upgrade.category === category);
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.find(upgrade => upgrade.id === id);
  }

  async createUpgrade(upgrade: Upgrade): Promise<Upgrade> {
    // Determine which file to save to based on category
    const fileName = this.getUpgradeFileName(upgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    // Add timestamps
    upgrade.createdAt = new Date();
    upgrade.updatedAt = new Date();
    
    upgrades.push(upgrade);
    await this.writeJSON(fileName, upgrades);
    
    return upgrade;
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    // Find which file contains this upgrade
    const allUpgrades = await this.getAllUpgrades();
    const existingUpgrade = allUpgrades.find(u => u.id === id);
    
    if (!existingUpgrade) {
      return undefined;
    }

    const fileName = this.getUpgradeFileName(existingUpgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    const index = upgrades.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    // Apply updates
    upgrades[index] = {
      ...upgrades[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON(fileName, upgrades);
    return upgrades[index];
  }

  async deleteUpgrade(id: string): Promise<boolean> {
    // Find which file contains this upgrade
    const allUpgrades = await this.getAllUpgrades();
    const existingUpgrade = allUpgrades.find(u => u.id === id);
    
    if (!existingUpgrade) {
      return false;
    }

    const fileName = this.getUpgradeFileName(existingUpgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    const filteredUpgrades = upgrades.filter(u => u.id !== id);
    await this.writeJSON(fileName, filteredUpgrades);
    
    return true;
  }

  private getUpgradeFileName(category: string): string {
    switch (category.toLowerCase()) {
      case 'lpertap':
      case 'tap':
        return 'upgrades/tap-upgrades.json';
      case 'lperhour': 
      case 'income':
      case 'hour':
        return 'upgrades/income-upgrades.json';
      case 'special':
        return 'upgrades/special-upgrades.json';
      case 'booster':
        return 'upgrades/booster-upgrades.json';
      default:
        return 'upgrades/tap-upgrades.json'; // Default fallback
    }
  }

  // 🎯 ACHIEVEMENTS - JSON-FIRST!
  async getAllAchievements(): Promise<Achievement[]> {
    const [collectionAchievements, gameplayAchievements, socialAchievements] = await Promise.all([
      this.getCached<Achievement>('achievements/collection.json'),
      this.getCached<Achievement>('achievements/gameplay.json'),
      this.getCached<Achievement>('achievements/social.json'),
    ]);

    return [...collectionAchievements, ...gameplayAchievements, ...socialAchievements];
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.filter(achievement => achievement.category === category);
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.find(achievement => achievement.id === id);
  }

  async createAchievement(achievement: Achievement): Promise<Achievement> {
    const fileName = this.getAchievementFileName(achievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    achievement.createdAt = new Date();
    achievement.updatedAt = new Date();
    
    achievements.push(achievement);
    await this.writeJSON(fileName, achievements);
    
    return achievement;
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const allAchievements = await this.getAllAchievements();
    const existingAchievement = allAchievements.find(a => a.id === id);
    
    if (!existingAchievement) {
      return undefined;
    }

    const fileName = this.getAchievementFileName(existingAchievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    const index = achievements.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    achievements[index] = {
      ...achievements[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON(fileName, achievements);
    return achievements[index];
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const allAchievements = await this.getAllAchievements();
    const existingAchievement = allAchievements.find(a => a.id === id);
    
    if (!existingAchievement) {
      return false;
    }

    const fileName = this.getAchievementFileName(existingAchievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    const filteredAchievements = achievements.filter(a => a.id !== id);
    await this.writeJSON(fileName, filteredAchievements);
    
    return true;
  }

  private getAchievementFileName(category: string): string {
    switch (category.toLowerCase()) {
      case 'collection':
        return 'achievements/collection.json';
      case 'gameplay':
        return 'achievements/gameplay.json';
      case 'social':
        return 'achievements/social.json';
      default:
        return 'achievements/collection.json'; // Default fallback
    }
  }

  // 🎯 CACHE MANAGEMENT
  clearCache(): void {
    this.cache.clear();
    console.log('[FileStorage] Cache cleared! 🧹');
  }

  getCacheStats(): { files: number; totalItems: number } {
    let totalItems = 0;
    for (const data of this.cache.values()) {
      if (Array.isArray(data)) {
        totalItems += data.length;
      }
    }
    
    return {
      files: this.cache.size,
      totalItems
    };
  }

  // 🎯 EXPORT/IMPORT UTILITIES
  async exportAllData(): Promise<any> {
    return {
      upgrades: await this.getAllUpgrades(),
      achievements: await this.getAllAchievements(),
      exportedAt: new Date().toISOString()
    };
  }

  // 🎯 Initialize default directory structure
  async initializeDirectories(): Promise<void> {
    const directories = [
      'upgrades',
      'achievements', 
      'progression',
      'tasks',
      'premium',
      'entertainment',
      'settings'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(join(this.gameDataPath, dir));
    }

    console.log('[FileStorage] Directory structure initialized! 📁');
  }
}