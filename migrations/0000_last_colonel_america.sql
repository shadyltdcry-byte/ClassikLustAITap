CREATE TABLE "bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"reward" text NOT NULL,
	"amount" integer NOT NULL,
	"claimedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"multiplier" real NOT NULL,
	"duration" integer NOT NULL,
	"activatedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL
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
	"isEvent" boolean DEFAULT false NOT NULL,
	"levelRequirement" integer DEFAULT 1 NOT NULL,
	"customTriggers" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatMessages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"characterId" uuid NOT NULL,
	"message" text NOT NULL,
	"response" text,
	"charismaGained" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gameStats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"totalTaps" integer DEFAULT 0 NOT NULL,
	"totalLpEarned" integer DEFAULT 0 NOT NULL,
	"totalEnergyUsed" integer DEFAULT 0 NOT NULL,
	"sessionsPlayed" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mediaFiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"characterId" uuid NOT NULL,
	"fileName" text NOT NULL,
	"filePath" text NOT NULL,
	"fileType" text NOT NULL,
	"mood" text,
	"pose" text,
	"animationSequence" integer,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"isVip" boolean DEFAULT false NOT NULL,
	"isEvent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upgrades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"baseCost" integer NOT NULL,
	"baseEffect" real NOT NULL,
	"costMultiplier" real DEFAULT 1.3 NOT NULL,
	"effectMultiplier" real DEFAULT 1.15 NOT NULL,
	"maxLevel" integer,
	"levelRequirement" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userCharacters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"characterId" uuid NOT NULL,
	"charismaPoints" integer DEFAULT 0 NOT NULL,
	"affection" integer DEFAULT 0 NOT NULL,
	"bondLevel" integer DEFAULT 1 NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userUpgrades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"upgradeId" uuid NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"purchasedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"lp" integer DEFAULT 0 NOT NULL,
	"energy" integer DEFAULT 1000 NOT NULL,
	"maxEnergy" integer DEFAULT 1000 NOT NULL,
	"charisma" integer DEFAULT 0 NOT NULL,
	"lpPerHour" integer DEFAULT 10 NOT NULL,
	"lpPerTap" real DEFAULT 1 NOT NULL,
	"vipStatus" boolean DEFAULT false NOT NULL,
	"nsfwConsent" boolean DEFAULT false NOT NULL,
	"eventStatus" boolean DEFAULT false NOT NULL,
	"lastTick" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usersUsernameUnique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wheelRewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"reward" text NOT NULL,
	"amount" integer NOT NULL,
	"spunAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosters" ADD CONSTRAINT "boosters_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_UserId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_characterId_charactersIdFk" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gameStats" ADD CONSTRAINT "gameStats_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mediaFiles" ADD CONSTRAINT "mediaFiles_characterId_charactersIdFk" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCharacters" ADD CONSTRAINT "userCharacters_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCharacters" ADD CONSTRAINT "userCharacters_characterId_charactersIdFk" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userUpgrades" ADD CONSTRAINT "userUpgrades_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userUpgrades" ADD CONSTRAINT "userUpgrades_upgradeId_upgradesIdFk" FOREIGN KEY ("upgradeId") REFERENCES "public"."upgrades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wheelRewards" ADD CONSTRAINT "wheelRewards_userId_usersIdFk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;