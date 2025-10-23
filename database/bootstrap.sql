-- ClassikLustAITap Database Bootstrap
-- Schema Version: 2025-10-23
-- Import this ONCE to create a fully functional database
-- All columns use lowercase to match PostgREST/Supabase defaults
-- CamelCase is handled in the application layer via SupabaseStorage mapping

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS chatMessages CASCADE;
DROP TABLE IF EXISTS wheelRewards CASCADE;
DROP TABLE IF EXISTS userUpgrades CASCADE;
DROP TABLE IF EXISTS userCharacters CASCADE;
DROP TABLE IF EXISTS mediaFiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS levelRequirements CASCADE;
DROP TABLE IF EXISTS upgrades CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (core player data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegramId TEXT UNIQUE,  -- Telegram user ID for auth
    userName TEXT UNIQUE,
    displayName TEXT,
    level INTEGER DEFAULT 1,
    lp NUMERIC(15,2) DEFAULT 1000,
    energy INTEGER DEFAULT 1000,
    maxEnergy INTEGER DEFAULT 1000,
    lpPerTap NUMERIC(8,2) DEFAULT 1.5,
    charisma INTEGER DEFAULT 0,
    vipStatus BOOLEAN DEFAULT FALSE,
    nsfwConsent BOOLEAN DEFAULT FALSE,
    lastTick TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table (AI personalities)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    personality TEXT,
    creator TEXT DEFAULT 'Admin',
    bond INTEGER DEFAULT 0,
    affection INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- User-Character relationships (selected characters)
CREATE TABLE userCharacters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    characterId UUID REFERENCES characters(id) ON DELETE CASCADE,
    selectedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(userId, characterId)
);

-- Media files (images, videos, etc.)
CREATE TABLE mediaFiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    characterId UUID REFERENCES characters(id) ON DELETE CASCADE,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileType TEXT NOT NULL,
    mood TEXT,
    pose TEXT,
    animationSequence JSONB,
    isNsfw BOOLEAN DEFAULT FALSE,
    isVip BOOLEAN DEFAULT FALSE,
    isEvent BOOLEAN DEFAULT FALSE,
    isWheelReward BOOLEAN DEFAULT FALSE,
    enabledForChat BOOLEAN DEFAULT TRUE,
    randomSendChance INTEGER DEFAULT 5,
    requiredLevel INTEGER DEFAULT 1,
    category TEXT DEFAULT 'Character',
    autoOrganized BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrades (base upgrade definitions)
CREATE TABLE upgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    baseCost NUMERIC(15,2) NOT NULL,
    hourlyBonus NUMERIC(8,2) DEFAULT 0,
    tapBonus NUMERIC(8,2) DEFAULT 0,
    energyBonus INTEGER DEFAULT 0,
    category TEXT NOT NULL, -- 'lpPerHour', 'lpPerTap', 'energy', 'special'
    maxLevel INTEGER DEFAULT 10,
    requiredLevel INTEGER DEFAULT 1,
    icon TEXT DEFAULT '🔧',
    enabled BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- User upgrade levels (tracks user progress on each upgrade)
CREATE TABLE userUpgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    upgradeId UUID REFERENCES upgrades(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0,
    purchasedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(userId, upgradeId)
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    reward NUMERIC(15,2) DEFAULT 100,
    rewardType TEXT DEFAULT 'lp', -- 'lp', 'energy', 'item'
    icon TEXT DEFAULT '🏆',
    maxProgress INTEGER DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Level requirements
CREATE TABLE levelRequirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER UNIQUE NOT NULL,
    lpRequired NUMERIC(15,2) NOT NULL,
    name TEXT,
    description TEXT,
    unlocks TEXT, -- JSON array of features unlocked
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chatMessages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    characterId UUID REFERENCES characters(id) ON DELETE CASCADE,
    senderType TEXT NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    imageUrl TEXT,
    metaData JSONB,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Wheel rewards (spin history)
CREATE TABLE wheelRewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    reward TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 1,
    rewardType TEXT DEFAULT 'lp',
    spunAt TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegramId ON users(telegramId);
CREATE INDEX idx_mediaFiles_characterId ON mediaFiles(characterId);
CREATE INDEX idx_mediaFiles_category ON mediaFiles(category);
CREATE INDEX idx_chatMessages_userId_createdAt ON chatMessages(userId, createdAt DESC);
CREATE INDEX idx_userUpgrades_userId ON userUpgrades(userId);
CREATE INDEX idx_wheelRewards_userId ON wheelRewards(userId, spunAt DESC);

-- Insert default characters
INSERT INTO characters (id, name, description, personality) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Luna', 'An enigmatic character with deep knowledge', 'Mysterious, intelligent, caring'),
('550e8400-e29b-41d4-a716-446655440002', 'Zara', 'A vibrant and energetic companion', 'Playful, adventurous, loyal');

-- Insert default upgrades
INSERT INTO upgrades (id, name, description, basecost, tapbonus, category, maxlevel, icon) VALUES 
('upgrade-tap-basic', 'Enhanced Tapping', 'Increases LP gained per tap', 100, 1, 'lpPerTap', 25, '👆'),
('upgrade-tap-master', 'Tap Master', 'Significantly boost tap rewards', 2000, 5, 'lpPerTap', 15, '💎'),
('upgrade-test', 'Test Upgrade', 'Testing upgrade system', 10, 5, 'lpPerTap', 10, '🧪');

INSERT INTO upgrades (id, name, description, basecost, hourlybonus, category, maxlevel, icon) VALUES 
('upgrade-passive-basic', 'Passive Income', 'Generate LP automatically over time', 250, 10, 'lpPerHour', 20, '💰'),
('upgrade-combo-master', 'Combo Master', 'Build up combo multipliers for massive LP', 2000, 2, 'special', 10, '✨');

-- Insert default achievements
INSERT INTO achievements (name, description, category, reward, rewardType, icon, maxProgress, sortOrder) VALUES 
('First Steps', 'Make your first tap', 'gameplay', 50, 'lp', '🎯', 1, 1),
('Tap Novice', 'Make 100 taps', 'gameplay', 200, 'lp', '👆', 100, 2),
('LP Collector', 'Collect 10,000 LP', 'collection', 1000, 'lp', '💰', 10000, 3),
('Character Bond', 'Chat with a character 10 times', 'social', 500, 'lp', '💕', 10, 4);

-- Insert default level requirements
INSERT INTO levelRequirements (level, lpRequired, name, description) VALUES 
(1, 0, 'Beginner', 'Starting level'),
(2, 1000, 'Novice', 'First milestone'),
(3, 2500, 'Apprentice', 'Learning the ropes'),
(4, 5000, 'Adept', 'Getting serious'),
(5, 10000, 'Expert', 'Mastering the game'),
(10, 50000, 'Master', 'Elite status'),
(15, 150000, 'Grandmaster', 'Legendary player'),
(20, 500000, 'Ascended', 'Beyond mortal limits');

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updatedAt BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updatedAt BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mediaFiles_updatedAt BEFORE UPDATE ON mediaFiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upgrades_updatedAt BEFORE UPDATE ON upgrades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updatedAt BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
\echo 'ClassikLustAITap database bootstrap completed successfully!';
\echo 'Schema version: 2025-10-23';
\echo 'Tables created: users, characters, mediafiles, upgrades, achievements, levelrequirements, chatmessages, wheelrewards';
\echo 'Default data inserted: 2 characters, 5 upgrades, 4 achievements, 8 level requirements';