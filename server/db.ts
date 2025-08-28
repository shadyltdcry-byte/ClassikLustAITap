// Using Supabase only - no PostgreSQL connection needed
import { SupabaseStorage } from '../shared/SupabaseStorage';

// Export Supabase storage singleton
export const storage = SupabaseStorage.getInstance();
export default storage;