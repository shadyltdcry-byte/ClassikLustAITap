export function calculateUpgradeCost(baseCost: number, currentLevel: number, costMultiplier: number): number {
  return Math.floor(baseCost * Math.pow(costMultiplier, currentLevel));
}

export function calculateUpgradeEffect(baseEffect: number, currentLevel: number, effectMultiplier: number): number {
  return Math.floor(baseEffect * Math.pow(effectMultiplier, currentLevel));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export function getEnergyPercentage(current: number, max: number): number {
  return Math.floor((current / max) * 100);
}

export function canAffordUpgrade(userLP: number, upgradeCost: number): boolean {
  return userLP >= upgradeCost;
}

export function getUserUpgradeLevel(userUpgrades: any[], upgradeId: string): number {
  const userUpgrade = userUpgrades.find(ug => ug.upgradeId === upgradeId);
  return userUpgrade?.level || 0;
}

export function isUpgradeLocked(userLevel: number, upgradeRequirement: number): boolean {
  return userLevel < upgradeRequirement;
}
