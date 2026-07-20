import { neon } from "@neondatabase/serverless";

// DATABASE_URL wird bewusst OHNE NEXT_PUBLIC_-Präfix gesetzt, damit sie
// niemals im Browser landet - nur API-Routen (server-seitig) dürfen sie lesen.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL fehlt. Bitte in Vercel unter Settings → Environment Variables setzen (siehe README)."
  );
}

// sql ist eine Template-Tag-Funktion, z.B.: await sql`select * from recipes`
export const sql = neon(databaseUrl || "postgresql://placeholder/placeholder");

export type Recipe = {
  id: string;
  name: string;
  tags: string[];
  last_cooked: string | null; // ISO date string, z.B. "2026-05-12"
  created_at: string;
};
