import { 
  users, characters, userCharacters, mediaFiles, upgrades, userUpgrades, 
  boosters, wheelRewards, gameStats, chatMessages, bonuses,
  type User, type InsertUser, type Character, type InsertCharacter,
  type UserCharacter, type InsertUserCharacter, type Upgrade, type UserUpgrade,
  type InsertUserUpgrade, type Booster, type InsertBooster, type ChatMessage,
  type InsertChatMessage, type GameStats, type WheelReward, type Bonus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Character operations
  getCharacters(): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  getUserCharacters(userId: string): Promise<UserCharacter[]>;
  getUserCharacter(userId: string, characterId: string): Promise<UserCharacter | undefined>;
  unlockCharacter(data: InsertUserCharacter): Promise<UserCharacter>;
  
  // Upgrade operations
  getUpgrades(): Promise<Upgrade[]>;
  getUserUpgrades(userId: string): Promise<UserUpgrade[]>;
  purchaseUpgrade(data: InsertUserUpgrade): Promise<UserUpgrade>;
  
  // Booster operations
  getActiveBooters(userId: string): Promise<Booster[]>;
  activateBooster(data: InsertBooster): Promise<Booster>;
  
  // Game stats
  getGameStats(userId: string): Promise<GameStats | undefined>;
  updateGameStats(userId: string, updates: Partial<GameStats>): Promise<GameStats>;
  
  // Chat operations
  getChatHistory(userId: string, characterId: string): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Wheel and bonuses
  spinWheel(userId: string, cost: number): Promise<WheelReward>;
  addBonus(userId: string, type: string, source: string, reward: string, amount: number): Promise<Bonus>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, lastTick: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(characters.name);
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [newCharacter] = await db.insert(characters).values(character).returning();
    return newCharacter;
  }

  async getUserCharacters(userId: string): Promise<UserCharacter[]> {
    return await db.select().from(userCharacters).where(eq(userCharacters.userId, userId));
  }

  async getUserCharacter(userId: string, characterId: string): Promise<UserCharacter | undefined> {
    const [userCharacter] = await db
      .select()
      .from(userCharacters)
      .where(and(eq(userCharacters.userId, userId), eq(userCharacters.characterId, characterId)));
    return userCharacter || undefined;
  }

  async unlockCharacter(data: InsertUserCharacter): Promise<UserCharacter> {
    const [userCharacter] = await db.insert(userCharacters).values(data).returning();
    return userCharacter;
  }

  async getUpgrades(): Promise<Upgrade[]> {
    return await db.select().from(upgrades).orderBy(upgrades.category, upgrades.levelRequirement);
  }

  async getUserUpgrades(userId: string): Promise<UserUpgrade[]> {
    return await db.select().from(userUpgrades).where(eq(userUpgrades.userId, userId));
  }

  async purchaseUpgrade(data: InsertUserUpgrade): Promise<UserUpgrade> {
    const [upgrade] = await db.insert(userUpgrades).values(data).returning();
    return upgrade;
  }

  async getActiveBooters(userId: string): Promise<Booster[]> {
    return await db
      .select()
      .from(boosters)
      .where(and(eq(boosters.userId, userId), sql`${boosters.expiresAt} > now()`));
  }

  async activateBooster(data: InsertBooster): Promise<Booster> {
    const [booster] = await db.insert(boosters).values(data).returning();
    return booster;
  }

  async getGameStats(userId: string): Promise<GameStats | undefined> {
    const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId));
    return stats || undefined;
  }

  async updateGameStats(userId: string, updates: Partial<GameStats>): Promise<GameStats> {
    const [stats] = await db
      .update(gameStats)
      .set({ ...updates, lastUpdated: sql`now()` })
      .where(eq(gameStats.userId, userId))
      .returning();
    return stats;
  }

  async getChatHistory(userId: string, characterId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), eq(chatMessages.characterId, characterId)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20);
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db.insert(chatMessages).values(message).returning();
    return chatMessage;
  }

  async spinWheel(userId: string, cost: number): Promise<WheelReward> {
    // Deduct cost from user LP
    await db
      .update(users)
      .set({ lp: sql`${users.lp} - ${cost}` })
      .where(eq(users.id, userId));

    // Generate random reward
    const rewards = [
      { reward: "LP", amount: 1000 },
      { reward: "Energy", amount: 200 },
      { reward: "Booster", amount: 1 },
      { reward: "Charisma", amount: 50 },
    ];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

    const [wheelReward] = await db
      .insert(wheelRewards)
      .values({
        userId,
        reward: randomReward.reward,
        amount: randomReward.amount,
      })
      .returning();

    return wheelReward;
  }

  async addBonus(userId: string, type: string, source: string, reward: string, amount: number): Promise<Bonus> {
    const [bonus] = await db
      .insert(bonuses)
      .values({ userId, type, source, reward, amount })
      .returning();
    return bonus;
  }
}

export const storage = new DatabaseStorage();
