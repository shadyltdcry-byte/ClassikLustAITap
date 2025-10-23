-- ClassikLustAITap Database Bootstrap
-- Schema Version: 2025-10-23
-- Import this ONCE to create a fully functional database
-- All columns use lowercase to match PostgREST/Supabase defaults
-- CamelCase is handled in the application layer via SupabaseStorage mapping

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS chatmessages CASCADE;
DROP TABLE IF EXISTS wheelrewards CASCADE;
DROP TABLE IF EXISTS userupgrades CASCADE;
DROP TABLE IF EXISTS usercharacters CASCADE;
DROP TABLE IF EXISTS mediafiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS levelrequirements CASCADE;
DROP TABLE IF EXISTS upgrades CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (core player data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegramid TEXT UNIQUE,  -- Telegram user ID for auth
    username TEXT UNIQUE,
    displayname TEXT,
    level INTEGER DEFAULT 1,
    lp NUMERIC(15,2) DEFAULT 1000,
    energy INTEGER DEFAULT 1000,
    maxenergy INTEGER DEFAULT 1000,
    lppertap NUMERIC(8,2) DEFAULT 1.5,
    charisma INTEGER DEFAULT 0,
    vipstatus BOOLEAN DEFAULT FALSE,
    nsfwconsent BOOLEAN DEFAULT FALSE,
    lasttick TIMESTAMPTZ DEFAULT NOW(),
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
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
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- User-Character relationships (selected characters)
CREATE TABLE usercharacters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES users(id) ON DELETE CASCADE,
    characterid UUID REFERENCES characters(id) ON DELETE CASCADE,
    selectedat TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(userid, characterid)
);

-- Media files (images, videos, etc.)
CREATE TABLE mediafiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    characterid UUID REFERENCES characters(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filetype TEXT NOT NULL,
    mood TEXT,
    pose TEXT,
    animationsequence JSONB,
    isnsfw BOOLEAN DEFAULT FALSE,
    isvip BOOLEAN DEFAULT FALSE,
    isevent BOOLEAN DEFAULT FALSE,
    iswheelreward BOOLEAN DEFAULT FALSE,
    enabledforchat BOOLEAN DEFAULT TRUE,
    randomsendchance INTEGER DEFAULT 5,
    requiredlevel INTEGER DEFAULT 1,
    category TEXT DEFAULT 'Character',
    autoorganized BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrades (base upgrade definitions)
CREATE TABLE upgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    basecost NUMERIC(15,2) NOT NULL,
    hourlybonus NUMERIC(8,2) DEFAULT 0,
    tapbonus NUMERIC(8,2) DEFAULT 0,
    energybonus INTEGER DEFAULT 0,
    category TEXT NOT NULL, -- 'lpPerHour', 'lpPerTap', 'energy', 'special'
    maxlevel INTEGER DEFAULT 10,
    requiredlevel INTEGER DEFAULT 1,
    icon TEXT DEFAULT '🔧',
    enabled BOOLEAN DEFAULT TRUE,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- User upgrade levels (tracks user progress on each upgrade)
CREATE TABLE userupgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES users(id) ON DELETE CASCADE,
    upgradeid UUID REFERENCES upgrades(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0,
    purchasedat TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(userid, upgradeid)
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    reward NUMERIC(15,2) DEFAULT 100,
    rewardtype TEXT DEFAULT 'lp', -- 'lp', 'energy', 'item'
    icon TEXT DEFAULT '🏆',
    maxprogress INTEGER DEFAULT 1,
    sortorder INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- Level requirements
CREATE TABLE levelrequirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER UNIQUE NOT NULL,
    lprequired NUMERIC(15,2) NOT NULL,
    name TEXT,
    description TEXT,
    unlocks TEXT, -- JSON array of features unlocked
    createdat TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chatmessages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES users(id) ON DELETE CASCADE,
    characterid UUID REFERENCES characters(id) ON DELETE CASCADE,
    sendertype TEXT NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    imageurl TEXT,
    metadata JSONB,
    createdat TIMESTAMPTZ DEFAULT NOW()
);

-- Wheel rewards (spin history)
CREATE TABLE wheelrewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES users(id) ON DELETE CASCADE,
    reward TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 1,
    rewardtype TEXT DEFAULT 'lp',
    spunat TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegramid ON users(telegramid);
CREATE INDEX idx_mediafiles_characterid ON mediafiles(characterid);
CREATE INDEX idx_mediafiles_category ON mediafiles(category);
CREATE INDEX idx_chatmessages_userid_createdat ON chatmessages(userid, createdat DESC);
CREATE INDEX idx_userupgrades_userid ON userupgrades(userid);
CREATE INDEX idx_wheelrewards_userid ON wheelrewards(userid, spunat DESC);

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
INSERT INTO achievements (name, description, category, reward, rewardtype, icon, maxprogress, sortorder) VALUES 
('First Steps', 'Make your first tap', 'gameplay', 50, 'lp', '🎯', 1, 1),
('Tap Novice', 'Make 100 taps', 'gameplay', 200, 'lp', '👆', 100, 2),
('LP Collector', 'Collect 10,000 LP', 'collection', 1000, 'lp', '💰', 10000, 3),
('Character Bond', 'Chat with a character 10 times', 'social', 500, 'lp', '💕', 10, 4);

-- Insert default level requirements
INSERT INTO levelrequirements (level, lprequired, name, description) VALUES 
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
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updatedat BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updatedat BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mediafiles_updatedat BEFORE UPDATE ON mediafiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upgrades_updatedat BEFORE UPDATE ON upgrades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updatedat BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
\echo 'ClassikLustAITap database bootstrap completed successfully!';
\echo 'Schema version: 2025-10-23';
\echo 'Tables created: users, characters, mediafiles, upgrades, achievements, levelrequirements, chatmessages, wheelrewards';
\echo 'Default data inserted: 2 characters, 5 upgrades, 4 achievements, 8 level requirements';