import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { upgrades } from '../shared/schema';

const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

const sql = postgres(connectionString);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding database...');

  const defaultUpgrades = [
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      name: 'Energy Boost',
      description: 'Increases maximum energy',
      category: 'energy',
      baseCost: 100,
      baseEffect: 50,
      costMultiplier: 1.3,
      effectMultiplier: 1.15,
      levelRequirement: 1
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440002',
      name: 'LP Per Hour',
      description: 'Increases passive LP generation',
      category: 'lpPerHour',
      baseCost: 150,
      baseEffect: 5,
      costMultiplier: 1.4,
      effectMultiplier: 1.2,
      levelRequirement: 1
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
      name: 'LP Per Tap',
      description: 'Increases LP gained per tap',
      category: 'lpPerTap',
      baseCost: 200,
      baseEffect: 0.5,
      costMultiplier: 1.5,
      effectMultiplier: 1.1,
      levelRequirement: 1
    }
  ];

  try {
    for (const upgrade of defaultUpgrades) {
      await db.insert(upgrades).values(upgrade).onConflictDoNothing();
    }
    console.log('✅ Default upgrades seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding upgrades:', error);
  }

  await sql.end();
  console.log('🏁 Seeding complete');
}

seed();
