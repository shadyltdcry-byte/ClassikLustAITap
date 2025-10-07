CREATE TABLE "bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"reward" text NOT NULL,
	"amount" integer NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"multiplier" real NOT NULL,
	"duration" integer NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"personality" text NOT NULL,
	"backstory" text,
	"mood" text DEFAULT 'neutral' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"isVip" boolean DEFAULT false NOT NULL,
	"level_requirement" integer DEFAULT 1 NOT NULL,
	"custom_triggers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"message" text NOT NULL,
	"response" text,
	"charisma_gained" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_taps" integer DEFAULT 0 NOT NULL,
	"total_lp_earned" integer DEFAULT 0 NOT NULL,
	"total_energy_used" integer DEFAULT 0 NOT NULL,
	"sessions_played" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"fileName" text NOT NULL,
	"filePath" text NOT NULL,
	"fileType" text NOT NULL,
	"mood" text,
	"pose" text,
	"animationSequence" integer,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"isVip" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upgrades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"base_cost" integer NOT NULL,
	"base_effect" real NOT NULL,
	"cost_multiplier" real DEFAULT 1.3 NOT NULL,
	"effect_multiplier" real DEFAULT 1.15 NOT NULL,
	"max_level" integer,
	"level_requirement" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"charisma_points" integer DEFAULT 0 NOT NULL,
	"affection" integer DEFAULT 0 NOT NULL,
	"bond_level" integer DEFAULT 1 NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_upgrades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"upgrade_id" uuid NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"lp" integer DEFAULT 0 NOT NULL,
	"energy" integer DEFAULT 1000 NOT NULL,
	"max_energy" integer DEFAULT 1000 NOT NULL,
	"charisma" integer DEFAULT 0 NOT NULL,
	"lpPerHour" integer DEFAULT 10 NOT NULL,
	"lpPerTap" real DEFAULT 1 NOT NULL,
	"vipStatus" boolean DEFAULT false NOT NULL,
	"nsfwConsent" boolean DEFAULT false NOT NULL,
	"lastTick" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wheel_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward" text NOT NULL,
	"amount" integer NOT NULL,
	"spun_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosters" ADD CONSTRAINT "boosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_upgrades" ADD CONSTRAINT "user_upgrades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_upgrades" ADD CONSTRAINT "user_upgrades_upgrade_id_upgrades_id_fk" FOREIGN KEY ("upgrade_id") REFERENCES "public"."upgrades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wheel_rewards" ADD CONSTRAINT "wheel_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;