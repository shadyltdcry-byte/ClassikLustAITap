
-- Drop existing tables if they exist
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS wheel_rewards CASCADE;
DROP TABLE IF EXISTS user_upgrades CASCADE;
DROP TABLE IF EXISTS user_characters CASCADE;
DROP TABLE IF EXISTS boosters CASCADE;
DROP TABLE IF EXISTS game_stats CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS upgrades CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bonuses CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  lp INTEGER NOT NULL DEFAULT 0,
  energy INTEGER NOT NULL DEFAULT 1000,
  max_energy INTEGER NOT NULL DEFAULT 1000,
  charisma INTEGER NOT NULL DEFAULT 0,
  lp_per_hour INTEGER NOT NULL DEFAULT 10,
  lp_per_tap REAL NOT NULL DEFAULT 1.0,
  vip_status BOOLEAN NOT NULL DEFAULT false,
  nsfw_consent BOOLEAN NOT NULL DEFAULT false,
  last_tick TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  backstory TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT 'neutral',
  bond_level INTEGER NOT NULL DEFAULT 0,
  affection INTEGER NOT NULL DEFAULT 0,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  is_unlocked BOOLEAN NOT NULL DEFAULT true,
  nsfw_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create upgrades table
CREATE TABLE upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_cost INTEGER NOT NULL,
  cost_multiplier REAL NOT NULL DEFAULT 1.15,
  base_effect REAL NOT NULL,
  effect_multiplier REAL NOT NULL DEFAULT 1.0,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  max_level INTEGER DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create media_files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  mood TEXT DEFAULT 'neutral',
  nsfw BOOLEAN NOT NULL DEFAULT false,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create user_characters table
CREATE TABLE user_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  bond_level INTEGER NOT NULL DEFAULT 0,
  affection INTEGER NOT NULL DEFAULT 0,
  chat_count INTEGER NOT NULL DEFAULT 0,
  last_interaction TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- Create user_upgrades table
CREATE TABLE user_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upgrade_id UUID NOT NULL REFERENCES upgrades(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id, upgrade_id)
);

-- Create boosters table
CREATE TABLE boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  effect_value REAL NOT NULL,
  duration INTEGER NOT NULL,
  cost INTEGER NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create bonuses table
CREATE TABLE bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL,
  multiplier REAL NOT NULL DEFAULT 1.0,
  duration INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create wheel_rewards table
CREATE TABLE wheel_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT false,
  spin_date TIMESTAMP NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL DEFAULT true,
  mood TEXT DEFAULT 'neutral',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create game_stats table
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_taps INTEGER NOT NULL DEFAULT 0,
  total_lp_earned INTEGER NOT NULL DEFAULT 0,
  time_played INTEGER NOT NULL DEFAULT 0,
  characters_unlocked INTEGER NOT NULL DEFAULT 0,
  upgrades_purchased INTEGER NOT NULL DEFAULT 0,
  wheel_spins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
