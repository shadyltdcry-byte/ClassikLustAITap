/**
 * GameManagerCore.tsx
 *
 * Core logic for taps, energy regen, passive LP, upgrades, boosters, and VIP.
 * Last Edited: 2025-08-18 by Assistant
 */

import { getPlayer, updatePlayer } from "./FileManagerCore";
import { Player, Upgrade, Booster } from "./types";
import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { createPlayerFolder, saveConversation, fetchConversations } from './GameManagerDB';

// --------------------
// Default constants for game mechanics
// --------------------
export const TAP_VALUE = 1; // base LP per tap
export const ENERGY_COST = 1; // energy cost per tap
export const MAX_ENERGY = 100;
export const ENERGY_RECOVERY_RATE = 1; // per interval
export const ENERGY_RECOVERY_INTERVAL = 5000; // ms
export const PASSIVE_LP_RATE = 10; // LP per hour
export const PASSIVE_CAP_HOURS = 8; // max hours before login reset

// --------------------
// Server Configuration
// --------------------
const app: Express = express();
const port: number = 3000;

export const SERVER_BASE_URL: string = `http://localhost:${port}`;
export const PLAYER_DATA_DIR: string = './data/player_conversations';

app.use(bodyParser.json());

export const startServer = (): void => {
  app.post('/player/:id/conversation', async (req: Request, res: Response) => {
    const playerId: string = req.params.id;
    const conversation = req.body;
    try {
      await saveConversation(playerId, conversation);
      res.status(200).send('Conversation saved');
    } catch (error) {
      console.error('Failed to save conversation:', error);
      res.status(500).send('Failed to save conversation');
    }
  });

  app.get('/player/:id/conversations', async (req: Request, res: Response) => {
    const playerId: string = req.params.id;
    try {
      const conversations = await fetchConversations(playerId);
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      res.status(500).json([]);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at ${SERVER_BASE_URL}`);
  });
};

// --------------------
// Tap function
// --------------------
export async function handleTap(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  if (player.energy <= 0) {
    throw new Error("Not enough energy!");
  }
  // Base tap LP
  let tapLP = TAP_VALUE;
  // Apply upgrades that increase tap
  player.upgrades?.forEach((upg: Upgrade) => {
    if (upg.type === "tap") tapLP += upg.bonus * (upg.currentLevel || 1);
  });
  // Apply active tap boosters
  const tapBooster = player.activeBoosters?.tap;
  if (tapBooster && tapBooster.expires > Date.now()) {
    tapLP *= tapBooster.multiplier;
  }
  // Update player
  player.lp += tapLP;
  player.energy -= ENERGY_COST;
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Passive LP calculation
// --------------------
export async function calculatePassiveIncome(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  const now = Date.now();
  const lastLogin = player.lastLogin || now;
  const elapsedHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));
  // Base passive LP
  let passiveRate = PASSIVE_LP_RATE;
  // Upgrades that affect passive LP
  player.upgrades?.forEach((upg: Upgrade) => {
    if (upg.type === "passiveLP") passiveRate += upg.bonus * (upg.currentLevel || 1);
  });
  // VIP multiplier
  if (player.isVIP) passiveRate *= 1.5;
  // Active passive booster
  const passiveBooster = player.activeBoosters?.passive;
  if (passiveBooster && passiveBooster.expires > now) {
    passiveRate *= passiveBooster.multiplier;
  }
  // Cap hours
  const cappedHours = Math.min(elapsedHours, PASSIVE_CAP_HOURS);
  player.lp += cappedHours * passiveRate;
  player.lastLogin = now;
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Energy regen loop
// --------------------
export async function recoverEnergy(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  if (player.energy < MAX_ENERGY) {
    let regenRate = ENERGY_RECOVERY_RATE;
    // Energy booster
    const energyBooster = player.activeBoosters?.energy;
    if (energyBooster && energyBooster.expires > Date.now()) {
      regenRate *= energyBooster.multiplier;
    }
    player.energy = Math.min(player.energy + regenRate, MAX_ENERGY);
    await updatePlayer(playerId, player);
  }
  return player;
}

// --------------------
// On login refresh
// --------------------
export async function onPlayerLogin(playerId: string): Promise<Player> {
  let player = await calculatePassiveIncome(playerId);
  await recoverEnergy(playerId);
  player.lastLogin = Date.now();
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Optional: reset boosters after expiration
// --------------------
export async function cleanupExpiredBoosters(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  const now = Date.now();
  if (player.activeBoosters) {
    for (const key of Object.keys(player.activeBoosters)) {
      const booster = player.activeBoosters[key as keyof typeof player.activeBoosters];
      if (booster && booster.expires <= now) {
        delete player.activeBoosters[key as keyof typeof player.activeBoosters];
      }
    }
  }
  await updatePlayer(playerId, player);
  return player;
}

// Start the server
startServer();
