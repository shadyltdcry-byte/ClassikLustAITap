
-- Fix character table columns to use snake_case consistently
ALTER TABLE characters RENAME COLUMN "isNsfw" TO "is_nsfw";
ALTER TABLE characters RENAME COLUMN "isVip" TO "is_vip";
ALTER TABLE characters RENAME COLUMN "isEvent" TO "is_event";
ALTER TABLE characters RENAME COLUMN "levelRequirement" TO "level_requirement";
ALTER TABLE characters RENAME COLUMN "isEnabled" TO "is_enabled";
ALTER TABLE characters RENAME COLUMN "customTriggers" TO "custom_triggers";
ALTER TABLE characters RENAME COLUMN "avatarPath" TO "avatar_path";
ALTER TABLE characters RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE characters RENAME COLUMN "chatStyle" TO "chat_style";
ALTER TABLE characters RENAME COLUMN "responseTimeMin" TO "response_time_min";
ALTER TABLE characters RENAME COLUMN "responseTimeMax" TO "response_time_max";
ALTER TABLE characters RENAME COLUMN "createdAt" TO "created_at";

-- Add avatar_url column if it doesn't exist
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
