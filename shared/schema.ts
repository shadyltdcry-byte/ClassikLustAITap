import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegram_id").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  lp: real("lp").notNull().default(0), // Changed to real to support decimals like 1.5
  energy: integer("energy").notNull().default(1000),
  maxEnergy: integer("max_energy").notNull().default(1000),
  charisma: integer("charisma").notNull().default(0),
  lpPerHour: integer("lp_per_hour").notNull().default(10),
  lpPerTap: real("lp_per_tap").notNull().default(1.0),
  vipStatus: boolean("vip_status").notNull().default(false),
  nsfwConsent: boolean("nsfw_consent").notNull().default(false),
  lastTick: timestamp("last_tick").notNull().default(sql`now()`),
  lastWheelSpin: timestamp("last_wheel_spin"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  bio: text("bio"), // For players to see
  description: text("description"), // For AI system prompts with variables like {characterName}, {mood}
  backstory: text("backstory"),
  mood: text("mood").notNull().default("neutral"),
  isNsfw: boolean("is_nsfw").notNull().default(false),
  isVip: boolean("is_vip").notNull().default(false),
  levelRequirement: integer("level_requirement").notNull().default(1),
  isEnabled: boolean("is_enabled").notNull().default(true),
  customTriggers: jsonb("custom_triggers").default(sql`'[]'::jsonb`),
  avatarPath: text("avatar_path"),
  imageUrl: text("image_url"),
  avatarUrl: text("avatar_url"),
  chatStyle: text("chat_style").default("casual"),
  likes: text("likes"),
  dislikes: text("dislikes"),
  responseTimeMin: integer("response_time_min").default(1),
  responseTimeMax: integer("response_time_max").default(3),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const userCharacters = pgTable("user_characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  charismaPoints: integer("charisma_points").notNull().default(0),
  affection: integer("affection").notNull().default(0),
  bondLevel: integer("bond_level").notNull().default(1),
  unlockedAt: timestamp("unlocked_at").notNull().default(sql`now()`),
});

export const mediaFiles = pgTable("media_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // image, video, gif
  mood: text("mood"),
  pose: text("pose"),
  animationSequence: integer("animation_sequence"),
  isNsfw: boolean("is_nsfw").notNull().default(false),
  isVip: boolean("is_vip").notNull().default(false),
  isEvent: boolean("is_event").notNull().default(false),
  randomSendChance: integer("random_send_chance").notNull().default(5),
  requiredLevel: integer("required_level").notNull().default(1),
  category: text("category").default("Character"), // Character, Avatar, Misc, Event, Other
  enabledForChat: boolean("enabled_for_chat").notNull().default(true), // Toggle for AI chat usage
  autoOrganized: boolean("auto_organized").notNull().default(false), // Track if file is auto-organized
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const upgrades = pgTable("upgrades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // lp_per_hour, energy, lp_per_tap
  baseCost: integer("base_cost").notNull(),
  baseEffect: real("base_effect").notNull(),
  costMultiplier: real("cost_multiplier").notNull().default(1.3),
  effectMultiplier: real("effect_multiplier").notNull().default(1.15),
  maxLevel: integer("max_level"),
  levelRequirement: integer("level_requirement").notNull().default(1),
});

export const userUpgrades = pgTable("user_upgrades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  upgradeId: uuid("upgrade_id").notNull().references(() => upgrades.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(0),
  purchasedAt: timestamp("purchased_at").notNull().default(sql`now()`),
});

export const boosters = pgTable("boosters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // lp_multiplier, energy_regen, etc.
  multiplier: real("multiplier").notNull(),
  duration: integer("duration").notNull(), // in minutes
  activatedAt: timestamp("activated_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
});

export const wheelRewards = pgTable("wheel_rewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reward: text("reward").notNull(),
  amount: integer("amount").notNull(),
  spunAt: timestamp("spun_at").notNull().default(sql`now()`),
});

export const gameStats = pgTable("game_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalTaps: integer("total_taps").notNull().default(0),
  totalLpEarned: integer("total_lp_earned").notNull().default(0),
  totalEnergyUsed: integer("total_energy_used").notNull().default(0),
  sessionsPlayed: integer("sessions_played").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  response: text("response"),
  charismaGained: integer("charisma_gained").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const bonuses = pgTable("bonuses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // level_up, achievement, wheel, ai_gift
  source: text("source").notNull(),
  reward: text("reward").notNull(),
  amount: integer("amount").notNull(),
  claimedAt: timestamp("claimed_at").notNull().default(sql`now()`),
});

export const levelRequirements = pgTable("level_requirements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").notNull().unique(),
  lpRequired: integer("lp_required").notNull(),
  description: text("description"),
  unlockRewards: jsonb("unlock_rewards").default(sql`'[]'::jsonb`), // Array of rewards {type, amount}
  functions: jsonb("functions").default(sql`'[]'::jsonb`), // Multiple functions for level
  upgradeRequirements: jsonb("upgrade_requirements").default(sql`'[]'::jsonb`), // Array of {upgradeId, requiredLevel}
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // tapping, chatting, progression, special
  baseRequirement: jsonb("base_requirement").notNull(), // {type: "total_taps", baseTarget: 10, multiplier: 2}
  levels: jsonb("levels").notNull().default(sql`'[]'::jsonb`), // [{level: 1, target: 10, reward: {type: "lp", amount: 100}}, {level: 2, target: 20, reward: {type: "lp", amount: 200}}]
  maxLevel: integer("max_level").notNull().default(30),
  icon: text("icon"),
  isHidden: boolean("is_hidden").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  currentLevel: integer("current_level").notNull().default(1),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false), // True when max level reached
  lastClaimedLevel: integer("last_claimed_level").notNull().default(0),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCharacters: many(userCharacters),
  userUpgrades: many(userUpgrades),
  boosters: many(boosters),
  wheelRewards: many(wheelRewards),
  gameStats: many(gameStats),
  chatMessages: many(chatMessages),
  bonuses: many(bonuses),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  userCharacters: many(userCharacters),
  mediaFiles: many(mediaFiles),
  chatMessages: many(chatMessages),
}));

export const userCharactersRelations = relations(userCharacters, ({ one }) => ({
  user: one(users, { fields: [userCharacters.userId], references: [users.id] }),
  character: one(characters, { fields: [userCharacters.characterId], references: [characters.id] }),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  character: one(characters, { fields: [mediaFiles.characterId], references: [characters.id] }),
}));

export const upgradesRelations = relations(upgrades, ({ many }) => ({
  userUpgrades: many(userUpgrades),
}));

export const userUpgradesRelations = relations(userUpgrades, ({ one }) => ({
  user: one(users, { fields: [userUpgrades.userId], references: [users.id] }),
  upgrade: one(upgrades, { fields: [userUpgrades.upgradeId], references: [upgrades.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastTick: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertUserCharacterSchema = createInsertSchema(userCharacters).omit({
  id: true,
  unlockedAt: true,
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
});

export const insertUpgradeSchema = createInsertSchema(upgrades).omit({
  id: true,
});

export const insertUserUpgradeSchema = createInsertSchema(userUpgrades).omit({
  id: true,
  purchasedAt: true,
});

export const insertBoosterSchema = createInsertSchema(boosters).omit({
  id: true,
  activatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertLevelRequirementSchema = createInsertSchema(levelRequirements).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
});

// Temporary auth tokens table for Telegram authentication
export const telegramAuthTokens = pgTable("telegram_auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").notNull(),
  username: varchar("username"),
  token: varchar("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type InsertUserCharacter = z.infer<typeof insertUserCharacterSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type Upgrade = typeof upgrades.$inferSelect;
export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
export type UserUpgrade = typeof userUpgrades.$inferSelect;
export type InsertUserUpgrade = z.infer<typeof insertUserUpgradeSchema>;
export type Booster = typeof boosters.$inferSelect;
export type InsertBooster = z.infer<typeof insertBoosterSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type WheelReward = typeof wheelRewards.$inferSelect;
export type Bonus = typeof bonuses.$inferSelect;
export type TelegramAuthToken = typeof telegramAuthTokens.$inferSelect;
export type InsertTelegramAuthToken = typeof telegramAuthTokens.$inferInsert;
export type LevelRequirement = typeof levelRequirements.$inferSelect;
export type InsertLevelRequirement = z.infer<typeof insertLevelRequirementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
