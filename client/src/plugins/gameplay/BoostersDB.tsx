/**
 * BoostersDB.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 * Please leave a detailed description
 *      of each function you add
 */



// This file acts as a standalone data layer for the Boosters plugin.
// It contains the mock booster data and functions for data manipulation.
// It does NOT contain any React components or UI elements.

import type { Upgrade } from "@shared/schema";

// --- BOOSTER DATA TYPES ---

export type BoosterData = {
  id: string;
  name: string;
  description: string;
  basecost: number;
  hourlybonus: number;
  tapbonus: number;
  maxlevel: number;
  requiredlevel: number;
  icon: string;
  level: number;
};

// Static booster definitions - in production these would come from backend
let mockBoosters: BoosterData[] = [
  {
    id: "special-talent",
    name: "Special Talent",
    description: "Unlock unique abilities and earn more LP.",
    basecost: 100,
    hourlybonus: 10,
    tapbonus: 0,
    maxlevel: 10,
    requiredlevel: 1,
    icon: "star",
    level: 0,
  },
  {
    id: "gift-selection",
    name: "Gift Selection",
    description: "Find better gifts and receive more LP.",
    basecost: 250,
    hourlybonus: 25,
    tapbonus: 0,
    maxlevel: 15,
    requiredlevel: 5,
    icon: "gift",
    level: 0,
  },
  {
    id: "active-listening",
    name: "Active Listening",
    description: "Your character pays better attention, increasing hourly LP.",
    basecost: 500,
    hourlybonus: 50,
    tapbonus: 0,
    maxlevel: 20,
    requiredlevel: 10,
    icon: "headphones",
    level: 0,
  },
  {
    id: "date-experience",
    name: "Date Experience",
    description: "Boosts your LP gain from successful dates.",
    basecost: 750,
    hourlybonus: 0,
    tapbonus: 5,
    maxlevel: 25,
    requiredlevel: 15,
    icon: "heart",
    level: 0,
  },
  {
    id: "cooking-mastery",
    name: "Cooking Mastery",
    description: "Improves your cooking skills for a passive LP bonus.",
    basecost: 1000,
    hourlybonus: 100,
    tapbonus: 0,
    maxlevel: 30,
    requiredlevel: 20,
    icon: "chefhat",
    level: 0,
  },
];

// --- CORE FUNCTIONS (API Mock) ---

/**
 * Simulates fetching all boosters from the database.
 * @returns {Promise<BoosterData[]>} A promise that resolves with an array of boosters.
 */
export const fetchBoosters = async (): Promise<BoosterData[]> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockBoosters;
};

/**
 * Simulates creating a new booster in the database.
 * @param {BoosterData} boosterData The new booster's data.
 * @returns {Promise<BoosterData>} A promise that resolves with the created booster.
 */
export const createBooster = async (boosterData: Omit<BoosterData, "id" | "level">): Promise<BoosterData> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const newBooster: BoosterData = {
    ...boosterData,
    id: `booster_${Date.now()}`,
    level: 0,
  };
  mockBoosters.push(newBooster);
  return newBooster;
};

/**
 * Simulates deleting a booster from the database.
 * @param {string} boosterId The ID of the booster to delete.
 * @returns {Promise<void>} A promise that resolves when the booster is deleted.
 */
export const deleteBooster = async (boosterId: string): Promise<void> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  mockBoosters = mockBoosters.filter(b => b.id !== boosterId);
};


