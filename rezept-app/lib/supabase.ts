import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Wird nur zur Laufzeit im Browser relevant, nicht beim Build.
  console.warn(
    "Supabase-Umgebungsvariablen fehlen. Bitte .env.local prüfen (siehe README)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Recipe = {
  id: string;
  name: string;
  tags: string[];
  last_cooked: string | null; // ISO date string, z.B. "2026-05-12"
  created_at: string;
};
