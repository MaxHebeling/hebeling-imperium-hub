import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Supabase client para la app móvil de Reino Editorial.
 * Usa las mismas credenciales que el portal web.
 * Las variables se configuran en app.json > extra o en .env
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "your-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
