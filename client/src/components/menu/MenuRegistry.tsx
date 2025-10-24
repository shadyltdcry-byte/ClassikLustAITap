/**
 * MenuRegistry.tsx - Menu Registration Bootstrap
 * Last Edited: 2025-10-24 by Assistant - Centralized menu registration
 */

import { registerMenu, MENU_IDS } from './MenuProvider';
import UpgradesMenu from './menus/UpgradesMenu';
import PassiveMenu from './menus/PassiveMenu';

/**
 * 📋 REGISTER ALL MENUS
 * Call this once at app startup to register all available menus
 */
export function initializeMenuRegistry(): void {
  console.log('📋 [MENU REGISTRY] Initializing menu system...');
  
  // Register core gameplay menus
  registerMenu(MENU_IDS.UPGRADES, UpgradesMenu);
  registerMenu(MENU_IDS.PASSIVE, PassiveMenu);
  
  // TODO: Register other menus as they're created
  // registerMenu(MENU_IDS.TASKS, TasksMenu);
  // registerMenu(MENU_IDS.CHARACTER, CharacterMenu);
  // registerMenu(MENU_IDS.SETTINGS, SettingsMenu);
  // registerMenu(MENU_IDS.ACHIEVEMENTS, AchievementsMenu);
  // registerMenu(MENU_IDS.SHOP, ShopMenu);
  // registerMenu(MENU_IDS.INVENTORY, InventoryMenu);
  // registerMenu(MENU_IDS.LEADERBOARD, LeaderboardMenu);
  // registerMenu(MENU_IDS.ADMIN, AdminMenu);
  
  console.log('✅ [MENU REGISTRY] Menu system initialized successfully!');
}

/**
 * 🎯 MENU SHORTCUTS
 * Convenience functions for common menu operations
 */
export const MenuShortcuts = {
  /**
   * Open upgrades menu with optional category tab
   */
  openUpgrades: (tab?: string) => {
    const { open } = require('./MenuProvider').useMenu();
    open(MENU_IDS.UPGRADES, { initialTab: tab });
  },
  
  /**
   * Open passive income menu
   */
  openPassive: () => {
    const { open } = require('./MenuProvider').useMenu();
    open(MENU_IDS.PASSIVE);
  },
  
  /**
   * Open tasks menu
   */
  openTasks: () => {
    const { open } = require('./MenuProvider').useMenu();
    open(MENU_IDS.TASKS);
  },
  
  /**
   * Open character menu
   */
  openCharacter: () => {
    const { open } = require('./MenuProvider').useMenu();
    open(MENU_IDS.CHARACTER);
  },
  
  /**
   * Open settings menu
   */
  openSettings: () => {
    const { open } = require('./MenuProvider').useMenu();
    open(MENU_IDS.SETTINGS);
  }
};

export default initializeMenuRegistry;