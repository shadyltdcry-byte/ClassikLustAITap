
-- Drop all tables if they exist (cascade to handle foreign keys)
DROP TABLE IF EXISTS wheel_rewards CASCADE;
DROP TABLE IF EXISTS user_upgrades CASCADE;
DROP TABLE IF EXISTS user_characters CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS game_stats CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bonuses CASCADE;
DROP TABLE IF EXISTS boosters CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS upgrades CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    lp INTEGER NOT NULL DEFAULT 5000,
    lpPerHour INTEGER NOT NULL DEFAULT 250,
    lpPerTap REAL NOT NULL DEFAULT 1.5,
    energy INTEGER NOT NULL DEFAULT 1000,
    max_energy INTEGER NOT NULL DEFAULT 1000,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next INTEGER NOT NULL DEFAULT 100,
    isVip BOOLEAN NOT NULL DEFAULT false,
    nsfw_enabled BOOLEAN NOT NULL DEFAULT false,
    charisma_points INTEGER NOT NULL DEFAULT 0,
    vipStatus BOOLEAN NOT NULL DEFAULT false,
    nsfw_consent BOOLEAN NOT NULL DEFAULT false,
    charisma INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create characters table with all needed columns
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    personality TEXT NOT NULL,
    backstory TEXT,
    mood TEXT DEFAULT 'neutral' NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    bond_level INTEGER DEFAULT 1 NOT NULL,
    affection INTEGER DEFAULT 0 NOT NULL,
    unlock_level INTEGER DEFAULT 1 NOT NULL,
    isUnlocked BOOLEAN DEFAULT true NOT NULL,
    isNsfw BOOLEAN DEFAULT false NOT NULL,
    isVip BOOLEAN DEFAULT false NOT NULL,
    nsfw_enabled BOOLEAN DEFAULT false NOT NULL,
    level_requirement INTEGER DEFAULT 1 NOT NULL,
    custom_triggers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create media_files table with pose column
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mood TEXT,
    pose TEXT,
    animation_sequence INTEGER,
    isNsfw BOOLEAN NOT NULL DEFAULT false,
    isVip BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create upgrades table
CREATE TABLE upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    base_cost INTEGER NOT NULL,
    base_effect REAL NOT NULL,
    cost_multiplier REAL NOT NULL DEFAULT 1.3,
    effect_multiplier REAL NOT NULL DEFAULT 1.15,
    max_level INTEGER,
    level_requirement INTEGER NOT NULL DEFAULT 1,
    unlock_level INTEGER DEFAULT 1 NOT NULL
);

-- Create other tables
CREATE TABLE user_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    charisma_points INTEGER NOT NULL DEFAULT 0,
    affection INTEGER NOT NULL DEFAULT 0,
    bond_level INTEGER NOT NULL DEFAULT 1,
    unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upgrade_id UUID NOT NULL REFERENCES upgrades(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE boosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    multiplier REAL NOT NULL,
    duration INTEGER NOT NULL,
    activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE wheel_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward TEXT NOT NULL,
    amount INTEGER NOT NULL,
    spun_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_taps INTEGER NOT NULL DEFAULT 0,
    total_lp_earned INTEGER NOT NULL DEFAULT 0,
    total_energy_used INTEGER NOT NULL DEFAULT 0,
    sessions_played INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    charisma_gained INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    reward TEXT NOT NULL,
    amount INTEGER NOT NULL,
    claimed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
