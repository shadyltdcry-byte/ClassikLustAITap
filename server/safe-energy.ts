import { SupabaseStorage } from '../shared/SupabaseStorage';
const storage = SupabaseStorage.getInstance();

const ENERGY_REGEN_INTERVAL = 60 * 1000; // 1 min
let energyInterval: NodeJS.Timeout | null = null;

async function regenerateEnergy() {
  try {
    const users = await storage.getAllUsers();
    for (const user of users) {
      if (user.energy < user.maxEnergy) {
        const newEnergy = Math.min(user.maxEnergy, user.energy + 5);
        await storage.updateUser(user.id, { energy: newEnergy });
      }
    }
    console.log(`[Energy Regen] Updated ${users.length} users`);
  } catch (err) {
    console.error("[Energy Regen] Error:", err);
  }
}

export function startEnergyRegen() {
  if (energyInterval) return;
  energyInterval = setInterval(regenerateEnergy, ENERGY_REGEN_INTERVAL);
  console.log("[Energy Regen] Started.");
}
