"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Recipe } from "@/lib/supabase";
import {
  ChefHat,
  Plus,
  Check,
  X,
  Trash2,
  Clock,
  Flame,
  Tag as TagIcon,
  Pencil,
} from "lucide-react";

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function formatLastCooked(dateStr: string | null): string {
  const d = daysSince(dateStr);
  if (d === Infinity) return "noch nie gekocht";
  if (d === 0) return "heute gekocht";
  if (d === 1) return "gestern gekocht";
  return `vor ${d} Tagen`;
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [includeTags, setIncludeTags] = useState<Set<string>>(new Set());
  const [excludeTags, setExcludeTags] = useState<Set<string>>(new Set());

  const [tab, setTab] = useState<"vorschlag" | "alle">("vorschlag");

  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editClearCooked, setEditClearCooked] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function fetchRecipes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setRecipes(data ?? []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRecipes();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (
        includeTags.size > 0 &&
        !Array.from(includeTags).every((t) => r.tags.includes(t))
      )
        return false;
      if (excludeTags.size > 0 && r.tags.some((t) => excludeTags.has(t)))
        return false;
      return true;
    });
  }, [recipes, includeTags, excludeTags]);

  const ranked = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = daysSince(a.last_cooked);
      const db = daysSince(b.last_cooked);
      if (da !== db) return db - da; // länger nicht gekocht = weiter oben
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  function toggleTag(tag: string, mode: "include" | "exclude") {
    if (mode === "include") {
      const next = new Set(includeTags);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      setIncludeTags(next);
      if (excludeTags.has(tag)) {
        const nextEx = new Set(excludeTags);
        nextEx.delete(tag);
        setExcludeTags(nextEx);
      }
    } else {
      const next = new Set(excludeTags);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      setExcludeTags(next);
      if (includeTags.has(tag)) {
        const nextIn = new Set(includeTags);
        nextIn.delete(tag);
        setIncludeTags(nextIn);
      }
    }
  }

  async function markCookedToday(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, last_cooked: today } : r))
    );
    await supabase.from("recipes").update({ last_cooked: today }).eq("id", id);
  }

  async function deleteRecipe(id: string) {
    setConfirmDeleteId(null);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("recipes").delete().eq("id", id);
  }

  function startEdit(r: Recipe) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditTags(r.tags.join(", "));
    setEditClearCooked(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditTags("");
    setEditClearCooked(false);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    const tags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const updatePayload: Partial<Recipe> = { name: editName.trim(), tags };
    if (editClearCooked) {
      updatePayload.last_cooked = null;
    }
    const { data, error } = await supabase
      .from("recipes")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setRecipes((prev) =>
        prev
          .map((r) => (r.id === id ? data : r))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
    } else if (error) {
      setError(error.message);
    }
    setSaving(false);
  }

  async function addRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const { data, error } = await supabase
      .from("recipes")
      .insert({ name: newName.trim(), tags, last_cooked: null })
      .select()
      .single();
    if (!error && data) {
      setRecipes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewTags("");
    } else if (error) {
      setError(error.message);
    }
    setAdding(false);
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-5 py-10 md:py-14">
      {/* Header */}
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sage-700 mb-1">
            <ChefHat size={22} strokeWidth={2.2} />
            <span className="font-mono text-xs tracking-widest uppercase">
              Rezept-Gedächtnis
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink leading-tight">
            Was koche ich?
          </h1>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-card border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          Fehler: {error}. Prüfe, ob die Supabase-Umgebungsvariablen gesetzt sind.
        </div>
      )}

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Add recipe */}
          <section className="bg-sage-50 border border-sage-100 rounded-card p-4">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-1.5">
              <Plus size={18} /> Neues Gericht
            </h2>
            <form onSubmit={addRecipe} className="space-y-2.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name, z.B. Linsensuppe"
                className="w-full rounded-card border border-sage-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags, mit Komma getrennt"
                className="w-full rounded-card border border-sage-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="w-full rounded-card bg-sage-700 text-white text-sm font-medium py-2 hover:bg-sage-900 transition-colors disabled:opacity-40"
              >
                {adding ? "Speichern…" : "Hinzufügen"}
              </button>
            </form>
          </section>

          {/* Tag filters */}
          <section>
            <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-1.5">
              <TagIcon size={17} /> Tags filtern
            </h2>
            <p className="text-xs text-ink/50 mb-3">
              Klick = einschließen (alle gewählten müssen passen) · nochmal
              Klick = ausschließen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.length === 0 && (
                <p className="text-xs text-ink/40">Noch keine Tags vorhanden.</p>
              )}
              {allTags.map((tag) => {
                const isIn = includeTags.has(tag);
                const isEx = excludeTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (!isIn && !isEx) toggleTag(tag, "include");
                      else if (isIn) {
                        toggleTag(tag, "include");
                        toggleTag(tag, "exclude");
                      } else {
                        toggleTag(tag, "exclude");
                      }
                    }}
                    className={`tag-chip font-mono text-xs px-2.5 py-1 rounded-full border ${
                      isIn
                        ? "bg-sage-700 text-white border-sage-700"
                        : isEx
                        ? "bg-rust text-white border-rust line-through"
                        : "bg-white text-ink/70 border-sage-300 hover:border-sage-500"
                    }`}
                  >
                    {isIn && <Check size={11} className="inline mr-1 -mt-0.5" />}
                    {isEx && <X size={11} className="inline mr-1 -mt-0.5" />}
                    {tag}
                  </button>
                );
              })}
            </div>
            {(includeTags.size > 0 || excludeTags.size > 0) && (
              <button
                onClick={() => {
                  setIncludeTags(new Set());
                  setExcludeTags(new Set());
                }}
                className="mt-3 text-xs text-ink/50 underline hover:text-ink"
              >
                Filter zurücksetzen
              </button>
            )}
          </section>
        </aside>

        {/* Main content */}
        <section>
          {/* Tabs */}
          <div className="flex gap-1 mb-5 font-mono text-xs uppercase tracking-wide">
            {(["vorschlag", "alle"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  tab === t
                    ? "bg-ink text-paper border-ink"
                    : "border-sage-300 text-ink/60 hover:border-sage-500"
                }`}
              >
                {t === "vorschlag" ? "Vorschlag" : `Alle Rezepte (${recipes.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-ink/50 text-sm">Lade Rezepte…</p>
          ) : ranked.length === 0 ? (
            <p className="text-ink/50 text-sm">
              {recipes.length === 0
                ? "Noch keine Gerichte gespeichert – leg links dein erstes an."
                : "Kein Rezept passt zu den aktuellen Filtern."}
            </p>
          ) : tab === "vorschlag" ? (
            <div className="space-y-3">
              {/* Top suggestion, hervorgehoben */}
              <div className="recipe-card bg-ochre-400/20 border-2 border-ochre-500 rounded-card p-5">
                <div className="flex items-center gap-1.5 text-ochre-600 font-mono text-[11px] uppercase tracking-widest mb-1">
                  <Flame size={13} /> Top-Vorschlag
                </div>
                <h3 className="font-display text-2xl font-semibold mb-1">
                  {ranked[0].name}
                </h3>
                <p className="text-sm text-ink/60 mb-3 flex items-center gap-1.5">
                  <Clock size={13} /> {formatLastCooked(ranked[0].last_cooked)}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {ranked[0].tags.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[11px] px-2 py-0.5 bg-white/60 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => markCookedToday(ranked[0].id)}
                  className="rounded-card bg-ink text-paper text-sm font-medium px-4 py-2 hover:bg-sage-900 transition-colors"
                >
                  Heute gekocht ✓
                </button>
              </div>

              {/* Rest ranked list */}
              {ranked.length > 1 && (
                <div className="pt-2">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-2">
                    Weitere, nach Priorität
                  </p>
                  <ul className="divide-y divide-sage-100">
                    {ranked.slice(1).map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between py-2.5 group"
                      >
                        <div>
                          <span className="font-medium">{r.name}</span>
                          <span className="text-ink/40 text-sm ml-2">
                            {formatLastCooked(r.last_cooked)}
                          </span>
                        </div>
                        <button
                          onClick={() => markCookedToday(r.id)}
                          className="text-xs font-mono text-sage-700 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 border border-sage-300 rounded-full hover:bg-sage-100"
                        >
                          gekocht ✓
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {ranked.map((r) =>
                editingId === r.id ? (
                  <li
                    key={r.id}
                    className="bg-white border-2 border-sage-500 rounded-card px-4 py-3 space-y-2"
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-card border border-sage-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags, mit Komma getrennt"
                      className="w-full rounded-card border border-sage-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                    <label className="flex items-center gap-2 text-xs text-ink/70 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editClearCooked}
                        onChange={(e) => setEditClearCooked(e.target.checked)}
                        className="accent-sage-700"
                      />
                      Kochdatum löschen (als „noch nie gekocht" markieren)
                      {!editClearCooked && (
                        <span className="text-ink/40">
                          — aktuell: {formatLastCooked(r.last_cooked)}
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(r.id)}
                        disabled={saving || !editName.trim()}
                        className="rounded-card bg-sage-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-sage-900 disabled:opacity-40"
                      >
                        {saving ? "Speichern…" : "Speichern"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-card border border-sage-300 text-xs font-medium px-3 py-1.5 hover:bg-sage-100"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={r.id}
                    className="recipe-card flex items-center justify-between bg-white border border-sage-100 rounded-card px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] px-1.5 py-0.5 bg-sage-100 text-sage-700 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 text-ink/40">
                          {formatLastCooked(r.last_cooked)}
                        </span>
                      </div>
                    </div>

                    {confirmDeleteId === r.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-rust font-medium mr-1">
                          Wirklich löschen?
                        </span>
                        <button
                          onClick={() => deleteRecipe(r.id)}
                          className="rounded-card bg-rust text-white text-xs font-medium px-2.5 py-1 hover:bg-rust/80"
                        >
                          Löschen
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-card border border-sage-300 text-xs font-medium px-2.5 py-1 hover:bg-sage-100"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => markCookedToday(r.id)}
                          title="Heute gekocht"
                          className="p-2 rounded-full hover:bg-sage-100 text-sage-700"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => startEdit(r)}
                          title="Bearbeiten"
                          className="p-2 rounded-full hover:bg-sage-100 text-ink/60"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          title="Löschen"
                          className="p-2 rounded-full hover:bg-rust/10 text-rust"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
