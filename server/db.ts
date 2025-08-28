// Supabase-only database configuration
import { SupabaseStorage } from '../shared/SupabaseStorage';

// Single database connection - Supabase handles everything
export const storage = SupabaseStorage.getInstance();
export default storage;

console.log('✅ Using Supabase as primary database');