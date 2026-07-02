# Was koche ich?

Rezept-Gedächtnis: Du speicherst nur Gericht-Namen + Tags. Die App merkt sich,
wann du was zuletzt gekocht hast, und schlägt dir – gefiltert nach Tags –
das Gericht vor, das am längsten nicht dran war.

Kosten: **0 €** bei privater Nutzung (Vercel Hobby + Supabase Free Tier).

## 1. Supabase-Projekt anlegen (Datenbank)

1. Auf https://supabase.com kostenlos registrieren, "New Project" anlegen.
2. Im Dashboard links auf **SQL Editor** → Inhalt von `supabase.sql`
   (liegt in diesem Projekt) einfügen und ausführen. Das legt die Tabelle
   `recipes` an.
3. Unter **Project Settings → API** findest du:
   - `Project URL` → das ist `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key → das ist `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Lokal einrichten (optional, zum Testen)

```bash
npm install
cp .env.local.example .env.local
# .env.local mit deinen echten Supabase-Werten befüllen
npm run dev
```

Dann läuft die App unter http://localhost:3000

## 3. Deployment auf Vercel (kostenlos)

1. Dieses Projekt in ein eigenes GitHub-Repository pushen.
2. Auf https://vercel.com mit GitHub einloggen → "Add New Project" →
   das Repo auswählen.
3. Beim Import unter **Environment Variables** die zwei Werte aus Schritt 1
   eintragen: `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy klicken. Fertig – die App ist unter einer `*.vercel.app`-URL von
   jedem Gerät aus erreichbar, Daten sind über Supabase synchron.

Jeder weitere `git push` auf den main-Branch deployed automatisch neu.

## Wie die Priorisierung funktioniert

- Gerichte, die du **noch nie** als "gekocht" markiert hast, stehen ganz oben.
- Danach sortiert nach Tagen seit dem letzten Mal – am längsten her zuerst.
- Tag-Filter: Klick auf einen Tag = **einschließen** (nur Gerichte mit
  mindestens einem der gewählten Tags), nochmal klicken = **ausschließen**
  (Gerichte mit diesem Tag werden ausgeblendet).
- "Heute gekocht ✓" setzt das Datum auf heute und das Gericht rutscht in der
  Priorität wieder nach unten.

## Tags

Tags sind frei erweiterbar – einfach beim Hinzufügen eines Gerichts durch
Komma getrennt eintragen (z.B. `Nudeln, vegetarisch, schnell`). Neue Tags
tauchen automatisch im Filter links auf.
