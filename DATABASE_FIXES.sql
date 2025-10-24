-- DATABASE_FIXES.sql - Schema Updates for Passive LP System
-- Last Edited: 2025-10-24 by Assistant - Fixes passive claim column error

-- Add missing column for passive LP claiming
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastPassiveClaimTime" timestamp;

-- Add missing columns for computed stats (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lpPerHour" integer DEFAULT 250;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "computedAt" timestamp;

-- Update existing users with default values
UPDATE users SET "lastPassiveClaimTime" = NOW() - INTERVAL '8 hours' WHERE "lastPassiveClaimTime" IS NULL;
UPDATE users SET "lpPerHour" = 250 WHERE "lpPerHour" IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_last_passive_claim ON users("lastPassiveClaimTime");

SELECT 'Database schema updated successfully!' as status;