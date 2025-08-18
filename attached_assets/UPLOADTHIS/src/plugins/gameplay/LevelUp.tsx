/**
 * LevelUp.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * Verify XP tracking, unlocks, triggers Bonuses
 * 
 * Please leave a detailed description
 *      of each function you add
 */

interface UpgradeRequirement {
  upgradeType: 'lpPerHour' | 'energy' | 'lpPerTap';
  upgradeName?: string; // Specific upgrade name (for energy and LP per Tap)
  requiredLevel: number;
}

interface LevelRequirement {
  level: number;
  requirements: UpgradeRequirement[];
}

interface PlayerUpgrades {
  lpPerHour: { [key: string]: number };
  energy: { [key: string]: number };
  lpPerTap: { [key: string]: number };
}

// Mock function to simulate fetching player upgrades from a database
async function fetchPlayerUpgrades(playerId: string): Promise<PlayerUpgrades> {
  // Simulating a database fetch
  console.log(`Fetching upgrades for player: ${playerId}`);
  // Mock data representing player upgrades
  return {
    lpPerHour: { 'Upgrade1': 5, 'Upgrade2': 5 },
    energy: { 'MaxEnergy': 3, 'EnergyRegen': 1 },
    lpPerTap: { 'TapBoost': 2, 'CriticalTap': 1 }
  };
}

// Mock function to simulate updating player level in a database
async function updatePlayerLevel(playerId: string, newLevel: number): Promise<void> {
  console.log(`Updating level for player ${playerId} to ${newLevel}`);
  // Simulate database update
}

class LevelUp {
  private static levelRequirements: LevelRequirement[] = [
    {
      level: 5,
      requirements: [
        { upgradeType: 'lpPerHour', requiredLevel: 5 },
        { upgradeType: 'energy', upgradeName: 'MaxEnergy', requiredLevel: 3 },
        { upgradeType: 'lpPerTap', requiredLevel: 2 }
      ]
    },
    // Add more level requirements as needed
  ];

  // Function to check if the player meets the requirements for a specific level
  static async canLevelUp(playerId: string, targetLevel: number): Promise<boolean> {
    const playerUpgrades = await fetchPlayerUpgrades(playerId);
    const levelRequirement = this.levelRequirements.find(lr => lr.level === targetLevel);
    if (!levelRequirement) return false; // Level not configured

    return levelRequirement.requirements.every(req => {
      if (req.upgradeType === 'lpPerHour') {
        return Object.values(playerUpgrades.lpPerHour).every(level => level >= req.requiredLevel);
      } else {
        // For energy and lpPerTap, check specific upgrade if specified
        const upgradeCategory = playerUpgrades[req.upgradeType];
        if (req.upgradeName) {
          return upgradeCategory[req.upgradeName] >= req.requiredLevel;
        } else {
          return Object.values(upgradeCategory).some(level => level >= req.requiredLevel);
        }
      }
    });
  }

  // Function to attempt to level up the player
  static async attemptLevelUp(playerId: string): Promise<void> {
    // Iterate through each level requirement to see if the player can level up
    for (let currentLevel = 1; ; currentLevel++) {
      const canLevelUpToNextLevel = await this.canLevelUp(playerId, currentLevel + 1);
      if (canLevelUpToNextLevel) {
        // If the player can level up, update their level in the database
        await updatePlayerLevel(playerId, currentLevel + 1);
        console.log(`Player ${playerId} has leveled up to level ${currentLevel + 1}`);
      } else {
        console.log(`Player ${playerId} cannot level up further at this time.`);
        break;
      }
    }
  }

  // Update the level configuration
  static updateLevelRequirements(newRequirements: LevelRequirement[]): void {
    this.levelRequirements = newRequirements;
    console.log('Level requirements updated. Syncing game systems...');
  }
}

// Example usage:
LevelUp.attemptLevelUp("player123");
