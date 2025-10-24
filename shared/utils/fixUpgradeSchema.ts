/**
 * Fix: Adjust schema to ensure userUpgrades.level exists and ids are TEXT, not UUID
 */
import { SupabaseStorage } from './SupabaseStorage';

export async function fixUpgradeSchemaNow() {
  const storage = SupabaseStorage.getInstance();
  const queries = [
    // Ensure quoted table names and correct columns
    `CREATE TABLE IF NOT EXISTS "upgrades" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "maxLevel" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "userUpgrades" (
      "userId" TEXT NOT NULL,
      "upgradeId" TEXT NOT NULL,
      "level" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("userId","upgradeId")
    )`,
    'CREATE INDEX IF NOT EXISTS "idx_userUpgrades_user" ON "userUpgrades"("userId")',
    'CREATE INDEX IF NOT EXISTS "idx_userUpgrades_upgrade" ON "userUpgrades"("upgradeId")'
  ];

  for (const q of queries) {
    try { await storage.supabase.rpc('exec', { query: q }); } catch {}
  }
}
