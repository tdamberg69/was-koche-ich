import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    // Aktuellen Datensatz laden, damit wir nur die übergebenen Felder ändern.
    const existingRows = await sql`
      select id, name, tags, last_cooked, created_at
      from recipes where id = ${id}
    `;
    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json(
        { error: "Rezept nicht gefunden." },
        { status: 404 }
      );
    }

    const name: string =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : existing.name;
    const tags: string[] = Array.isArray(body.tags) ? body.tags : existing.tags;

    // last_cooked: nur ändern, wenn der Schlüssel im Body vorkommt
    // (erlaubt explizites Setzen auf null, um "nie gekocht" zu markieren).
    const lastCooked = Object.prototype.hasOwnProperty.call(
      body,
      "last_cooked"
    )
      ? body.last_cooked
      : existing.last_cooked;

    const rows = await sql`
      update recipes
      set name = ${name}, tags = ${tags}, last_cooked = ${lastCooked}
      where id = ${id}
      returning id, name, tags, last_cooked, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Aktualisieren des Rezepts." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await sql`delete from recipes where id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Löschen des Rezepts." },
      { status: 500 }
    );
  }
}
