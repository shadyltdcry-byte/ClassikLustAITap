-- Default characters removed - add your own characters via the admin interface

-- Insert default upgrades
INSERT INTO upgrades (id, name, description, category, basecost, baseeffect, costmultiplier, effectmultiplier, unlocklevel) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Energy Boost', 'Increases maximum energy', 'energy', 100, 50, 1.3, 1.15, 1),
  ('650e8400-e29b-41d4-a716-446655440002', 'LP Per Hour', 'Increases passive LP generation', 'lpPerHour', 150, 5, 1.4, 1.2, 1),
  ('650e8400-e29b-41d4-a716-446655440003', 'LP Per Tap', 'Increases LP gained per tap', 'lpPerTap', 200, 0.5, 1.5, 1.1, 1);

-- Sample media files removed - upload your own media via the admin interface

-- Default character removed - create characters via the admin interface

-- Create RPC function to increment user stats
CREATE OR REPLACE FUNCTION increment_userStats(
  p_userId text,
  p_taps integer DEFAULT 0,
  p_lpEarned numeric DEFAULT 0,
  p_energyUsed integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO gameStats (userId, totalTaps, totalLpEarned, totalEnergyUsed, sessionsPlayed)
  VALUES (p_userId, p_taps, p_lpEarned, p_energyUsed, 1)
  ON CONFLICT (userId) 
  DO UPDATE SET
    totalTaps = gameStats.totalTaps + p_taps,
    totalLpEarned = gameStats.totalLpEarned + p_lp_earned,
    totalEnergyUsed = gameStats.totalEnergyUsed + p_energyUsed,
    updated_at = now();
END;
$$;

-- Create RPC function to increment user upgrade
CREATE OR REPLACE FUNCTION increment_userUpgrade(
  p_userId text,
  p_upgradeId text
)
RETURNS upgrades
LANGUAGE plpgsql
AS $$
DECLARE
  upgradeRecord upgrades;
BEGIN
  -- Get the upgrade details
  SELECT * INTO upgradeRecord FROM upgrades WHERE id = p_upgradeId;

  -- Increment the user's upgrade level
  INSERT INTO userUpgrades (userId, upgradeId, level)
  VALUES (p_userId, p_upgradeId, 1)
  ON CONFLICT (userId, upgradeId)
  DO UPDATE SET
    level = userUpgrades.level + 1,
    updatedAt = now();

  RETURN upgradeRecord;
END;
$$;