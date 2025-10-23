-- ClassikLustAITap Database Bootstrap (Production Ready)
-- Schema Version: 2025-10-23-14-18
-- Run this after a purge to recreate all required tables and seed defaults
-- Uses quoted CamelCase identifiers + UUID primary keys with human-readable keys

-- Users
CREATE TABLE "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "telegramId" TEXT UNIQUE,
  username TEXT UNIQUE,
  "displayName" TEXT,
  level INT4 DEFAULT 1,
  lp NUMERIC(15,2) DEFAULT 1000,
  energy INT4 DEFAULT 1000,
  "maxEnergy" INT4 DEFAULT 1000,
  "lpPerTap" NUMERIC(8,2) DEFAULT 1.5,
  "lpPerHour" NUMERIC(8,2) DEFAULT 0,
  charisma INT4 DEFAULT 0,
  "vipStatus" BOOL DEFAULT FALSE,
  "nsfwConsent" BOOL DEFAULT FALSE,
  "lastTick" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Characters
CREATE TABLE "characters" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  creator TEXT DEFAULT 'Admin',
  "bondLevel" INT4 DEFAULT 0,
  affection INT4 DEFAULT 0,
  enabled BOOL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- UserCharacters
CREATE TABLE "userCharacters" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"(id) ON DELETE CASCADE,
  "characterId" UUID REFERENCES "characters"(id) ON DELETE CASCADE,
  "unlockedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "characterId")
);

-- MediaFiles
CREATE TABLE "mediaFiles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "characterId" UUID REFERENCES "characters"(id) ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  mood TEXT,
  pose TEXT,
  "animationSequence" JSONB,
  "isNsfw" BOOL DEFAULT FALSE,
  "isVip" BOOL DEFAULT FALSE,
  "isEvent" BOOL DEFAULT FALSE,
  "enabledForChat" BOOL DEFAULT TRUE,
  "randomSendChance" INT4 DEFAULT 5,
  "requiredLevel" INT4 DEFAULT 1,
  category TEXT DEFAULT 'Character',
  "autoOrganized" BOOL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrades
CREATE TABLE "upgrades" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE, -- Human-readable identifier like 'tap-basic'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'lpPerTap' | 'lpPerHour' | 'energy' | 'special'
  "baseCost" INT4 NOT NULL,
  "baseEffect" NUMERIC(8,2) DEFAULT 1,
  "costMultiplier" NUMERIC(4,2) DEFAULT 1.3,
  "effectMultiplier" NUMERIC(4,2) DEFAULT 1.25,
  "maxLevel" INT4 DEFAULT 10,
  "levelRequirement" INT4 DEFAULT 1,
  "unlockLevel" INT4 DEFAULT 1,
  icon TEXT DEFAULT '🔧',
  rarity TEXT,
  "currentLevel" INT4 DEFAULT 0,
  "sortOrder" INT4 DEFAULT 0,
  "hourlyBonus" INT4 DEFAULT 0,
  "tapBonus" INT4 DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- UserUpgrades
CREATE TABLE "userUpgrades" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"(id) ON DELETE CASCADE,
  "upgradeId" UUID REFERENCES "upgrades"(id) ON DELETE CASCADE,
  "currentLevel" INT4 DEFAULT 0,
  "totalSpent" INT4 DEFAULT 0,
  "lastPurchased" TIMESTAMPTZ,
  "purchasedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "upgradeId")
);

-- Achievements
CREATE TABLE "achievements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  reward NUMERIC(15,2) DEFAULT 100,
  "rewardType" TEXT DEFAULT 'lp',
  icon TEXT DEFAULT '🏆',
  "maxProgress" INT4 DEFAULT 1,
  "sortOrder" INT4 DEFAULT 0,
  enabled BOOL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- LevelRequirements
CREATE TABLE "levelRequirements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INT4 UNIQUE NOT NULL,
  "lpRequired" NUMERIC(15,2) NOT NULL,
  name TEXT,
  description TEXT,
  unlocks TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ChatMessages
CREATE TABLE "chatMessages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"(id) ON DELETE CASCADE,
  "characterId" UUID REFERENCES "characters"(id) ON DELETE CASCADE,
  "senderType" TEXT NOT NULL,
  message TEXT NOT NULL,
  "imageUrl" TEXT,
  "metaData" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- WheelRewards
CREATE TABLE "wheelRewards" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"(id) ON DELETE CASCADE,
  reward TEXT NOT NULL,
  amount NUMERIC(15,2) DEFAULT 1,
  "rewardType" TEXT DEFAULT 'lp',
  "spunAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_telegramId ON "users"("telegramId");
CREATE INDEX idx_mediaFiles_characterId ON "mediaFiles"("characterId");
CREATE INDEX idx_mediaFiles_category ON "mediaFiles"(category);
CREATE INDEX idx_chatMessages_userId_createdAt ON "chatMessages"("userId", "createdAt" DESC);
CREATE INDEX idx_userUpgrades_userId ON "userUpgrades"("userId");
CREATE INDEX idx_wheelRewards_userId ON "wheelRewards"("userId", "spunAt" DESC);
CREATE INDEX idx_upgrades_key ON "upgrades"(key);

-- Seed data
INSERT INTO "characters" (name, description, personality) VALUES 
('Luna', 'An enigmatic character with deep knowledge', 'Mysterious, intelligent, caring'),
('Zara', 'A vibrant and energetic companion', 'Playful, adventurous, loyal');

-- Upgrades seed (UUID auto-generated, use key for human-readable IDs)
INSERT INTO "upgrades" (key, name, description, category, "baseCost", "tapBonus", "maxLevel", icon) VALUES 
('tap-basic', 'Enhanced Tapping', 'Increases LP gained per tap', 'lpPerTap', 100, 1, 25, '👆'),
('tap-master', 'Tap Master', 'Significantly boost tap rewards', 'lpPerTap', 2000, 5, 15, '💎'),
('tap-test', 'Test Upgrade', 'Testing upgrade system', 'lpPerTap', 10, 5, 10, '🧪');

INSERT INTO "upgrades" (key, name, description, category, "baseCost", "hourlyBonus", "maxLevel", icon) VALUES 
('passive-basic', 'Passive Income', 'Generate LP automatically over time', 'lpPerHour', 250, 10, 20, '💰'),
('combo-master', 'Combo Master', 'Build up combo multipliers for massive LP', 'special', 2000, 2, 10, '✨');

-- Achievements seed
INSERT INTO "achievements" (name, description, category, reward, "rewardType", icon, "maxProgress", "sortOrder") VALUES 
('First Steps', 'Make your first tap', 'gameplay', 50, 'lp', '🎯', 1, 1),
('Tap Novice', 'Make 100 taps', 'gameplay', 200, 'lp', '👆', 100, 2),
('LP Collector', 'Collect 10,000 LP', 'collection', 1000, 'lp', '💰', 10000, 3),
('Character Bond', 'Chat with a character 10 times', 'social', 500, 'lp', '💕', 10, 4);

-- Level requirements seed
INSERT INTO "levelRequirements" (level, "lpRequired", name, description) VALUES 
(1, 0, 'Beginner', 'Starting level'),
(2, 1000, 'Novice', 'First milestone'),
(3, 2500, 'Apprentice', 'Learning the ropes'),
(4, 5000, 'Adept', 'Getting serious'),
(5, 10000, 'Expert', 'Mastering the game'),
(10, 50000, 'Master', 'Elite status'),
(15, 150000, 'Grandmaster', 'Legendary player'),
(20, 500000, 'Ascended', 'Beyond mortal limits');

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_characters_updated BEFORE UPDATE ON "characters"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_mediaFiles_updated BEFORE UPDATE ON "mediaFiles"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upgrades_updated BEFORE UPDATE ON "upgrades"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_achievements_updated BEFORE UPDATE ON "achievements"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Bootstrap complete: schema recreated and seeded with proper UUIDs.';