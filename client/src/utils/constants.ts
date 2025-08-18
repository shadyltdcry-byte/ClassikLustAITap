/**
 * conetants.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * XP thresholds, upgrade costs, VIP/NSFW,
 * LP & energy rates, Charisma per message)
 *
 * Please leave a detailed description
 *      of each function you add
 */



// Constants and settings for GameManagerCore logic

export const gameConstants = {
  // Tapping
  lpPerTap: 10,               // LP gained per tap
  energyPerTap: 1,            // Energy cost per tap

  // Energy system
  maxEnergy: 20,              // Max energy
  energyRecoverAmount: 1,     // Energy recovered per interval
  energyRecoverInterval: 3000, // 3 seconds per energy recovery (ms)

  // Passive LP (offline)
  lpPerHour: 50,              // LP gained per hour offline
  passiveLpMaxHours: 2,       // Max hours to accumulate offline
  passiveLpInterval: 1000 * 60 * 1, // Update every minute

  // Experience / Leveling
  expPerLevel: (level: number) => 100 + level * 25, // customizable exp curve

  // Other possible constants you can tweak later
  tapMultiplier: 1,           // for upgrades
  energyMultiplier: 1,        // for upgrades
};