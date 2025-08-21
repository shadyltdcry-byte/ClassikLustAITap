-- Insert default characters
INSERT INTO characters (id, name, personality, backstory, mood, bond_level, affection, unlock_level, is_unlocked, nsfw_enabled) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Aria', 'Friendly and energetic', 'A cheerful companion who loves adventures', 'happy', 1, 0, 1, true, false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Luna', 'Mysterious and wise', 'An enigmatic character with deep knowledge', 'neutral', 1, 0, 5, false, false),
  ('550e8400-e29b-41d4-a716-446655440003', 'Zara', 'Bold and confident', 'A strong-willed character who speaks her mind', 'confident', 1, 0, 3, false, true);

-- Insert default upgrades
INSERT INTO upgrades (id, name, description, category, base_cost, base_effect, cost_multiplier, effect_multiplier, unlock_level) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Energy Boost', 'Increases maximum energy', 'energy', 100, 50, 1.3, 1.15, 1),
  ('650e8400-e29b-41d4-a716-446655440002', 'LP Per Hour', 'Increases passive LP generation', 'lp_per_hour', 150, 5, 1.4, 1.2, 1),
  ('650e8400-e29b-41d4-a716-446655440003', 'LP Per Tap', 'Increases LP gained per tap', 'lp_per_tap', 200, 0.5, 1.5, 1.1, 1);

-- Insert sample media files
INSERT INTO media_files (id, character_id, file_name, file_path, file_type, mood, nsfw, unlock_level) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'aria_happy.png', '/media/aria_happy.png', 'image', 'happy', false, 1),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'luna_neutral.png', '/media/luna_neutral.png', 'image', 'neutral', false, 5),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'zara_confident.png', '/media/zara_confident.png', 'image', 'confident', true, 3);

-- Function to increment user stats atomically
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_taps INTEGER DEFAULT 0,
  p_lp_earned NUMERIC DEFAULT 0,
  p_energy_used INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO game_stats (
    user_id,
    total_taps,
    total_lp_earned,
    total_energy_used,
    updated_at
  )
  VALUES (
    p_user_id,
    p_taps,
    p_lp_earned,
    p_energy_used,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_taps = game_stats.total_taps + p_taps,
    total_lp_earned = game_stats.total_lp_earned + p_lp_earned,
    total_energy_used = game_stats.total_energy_used + p_energy_used,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
