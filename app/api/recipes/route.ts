import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await sql`
      select id, name, tags, last_cooked, created_at
      from recipes
      order by name asc
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Laden der Rezepte." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string = (body.name ?? "").trim();
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

    if (!name) {
      return NextResponse.json({ error: "Name fehlt." }, { status: 400 });
    }

    const rows = await sql`
      insert into recipes (name, tags, last_cooked)
      values (${name}, ${tags}, null)
      returning id, name, tags, last_cooked, created_at
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Anlegen des Rezepts." },
      { status: 500 }
    );
  }
}
