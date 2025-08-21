
-- Insert default characters
INSERT INTO characters (id, name, personality, backstory, mood, level, is_nsfw, is_vip, level_requirement) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Aria', 'Friendly and energetic', 'A cheerful companion who loves adventures', 'happy', 1, false, false, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Luna', 'Mysterious and wise', 'An enigmatic character with deep knowledge', 'neutral', 1, false, true, 5),
  ('550e8400-e29b-41d4-a716-446655440003', 'Zara', 'Bold and confident', 'A strong-willed character who speaks her mind', 'confident', 1, true, false, 3);

-- Insert default upgrades
INSERT INTO upgrades (id, name, description, category, base_cost, base_effect, cost_multiplier, effect_multiplier, level_requirement) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Energy Boost', 'Increases maximum energy', 'energy', 100, 50, 1.3, 1.15, 1),
  ('650e8400-e29b-41d4-a716-446655440002', 'LP Per Hour', 'Increases passive LP generation', 'lp_per_hour', 150, 5, 1.4, 1.2, 1),
  ('650e8400-e29b-41d4-a716-446655440003', 'LP Per Tap', 'Increases LP gained per tap', 'lp_per_tap', 200, 0.5, 1.5, 1.1, 1);

-- Insert sample media files
INSERT INTO media_files (id, character_id, file_name, file_path, file_type, mood, pose, is_nsfw, is_vip) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'aria_happy.png', '/media/aria_happy.png', 'image', 'happy', 'standing', false, false),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'luna_neutral.png', '/media/luna_neutral.png', 'image', 'neutral', 'sitting', false, true),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'zara_confident.png', '/media/zara_confident.png', 'image', 'confident', 'standing', true, false);
