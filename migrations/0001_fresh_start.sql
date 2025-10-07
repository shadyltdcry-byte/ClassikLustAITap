
-- Drop all tables if they exist (cascade to handle foreign keys)
DROP TABLE IF EXISTS wheelRewards CASCADE;
DROP TABLE IF EXISTS userUpgrades CASCADE;
DROP TABLE IF EXISTS userCharacters CASCADE;
DROP TABLE IF EXISTS mediaFiles CASCADE;
DROP TABLE IF EXISTS gameStats CASCADE;
DROP TABLE IF EXISTS chatMe seessages CASCADE;
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
    maxEnergy INTEGER NOT NULL DEFAULT 1000,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    xpToNext INTEGER NOT NULL DEFAULT 100,
    isVip BOOLEAN NOT NULL DEFAULT false,
    nsfwEnabled BOOLEAN NOT NULL DEFAULT false,
    charismaPoints INTEGER NOT NULL DEFAULT 0,
    vipStatus BOOLEAN NOT NULL DEFAULT false,
    nsfwConsent BOOLEAN NOT NULL DEFAULT false,
    charisma INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create characters table with all needed columns
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    personality TEXT NOT NULL,
    backstory TEXT,
    mood TEXT DEFAULT 'neutral' NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    bondLevel INTEGER DEFAULT 1 NOT NULL,
    affection INTEGER DEFAULT 0 NOT NULL,
    unlockLevel INTEGER DEFAULT 1 NOT NULL,
    isUnlocked BOOLEAN DEFAULT true NOT NULL,
    isNsfw BOOLEAN DEFAULT false NOT NULL,
    isVip BOOLEAN DEFAULT false NOT NULL,
    nsfwEnabled BOOLEAN DEFAULT false NOT NULL,
    levelRequirement INTEGER DEFAULT 1 NOT NULL,
    customTriggers JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create media_files table with pose column
CREATE TABLE mediaFiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    characterId UUID REFERENCES characters(id) ON DELETE CASCADE,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileType TEXT NOT NULL,
    mood TEXT,
    pose TEXT,
    animationSequence INTEGER,
    isNsfw BOOLEAN NOT NULL DEFAULT false,
    isVip BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create upgrades table
CREATE TABLE upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    baseCost INTEGER NOT NULL,
    baseEffect REAL NOT NULL,
    costMultiplier REAL NOT NULL DEFAULT 1.3,
    effectMultiplier REAL NOT NULL DEFAULT 1.15,
    maxLevel INTEGER,
    levelRequirement INTEGER NOT NULL DEFAULT 1,
    unlockLevel INTEGER DEFAULT 1 NOT NULL
);

-- Create other tables
CREATE TABLE userCharacters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    characterId UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    charismaPoints INTEGER NOT NULL DEFAULT 0,
    affection INTEGER NOT NULL DEFAULT 0,
    bondLevel INTEGER NOT NULL DEFAULT 1,
    unlockedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE userUpgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upgradeId UUID NOT NULL REFERENCES upgrades(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    purchasedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE boosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    multiplier REAL NOT NULL,
    duration INTEGER NOT NULL,
    activatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    expiresAt TIMESTAMP NOT NULL
);

CREATE TABLE wheelRewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward TEXT NOT NULL,
    amount INTEGER NOT NULL,
    spunAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE gameStats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    totalTaps INTEGER NOT NULL DEFAULT 0,
    totalLpEarned INTEGER NOT NULL DEFAULT 0,
    totalEnergyUsed INTEGER NOT NULL DEFAULT 0,
    sessionsPlayed INTEGER NOT NULL DEFAULT 0,
    lastUpdated TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chatMessages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    characterId UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    charismaGained INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    reward TEXT NOT NULL,
    amount INTEGER NOT NULL,
    claimedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
