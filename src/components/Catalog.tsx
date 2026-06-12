"use client";
import { useMemo, useState } from "react";
import BeatCard from "./BeatCard";
import type { Beat } from "@/lib/types";

export type CBeat = Beat & { previewUrl: string | null; coverUrl: string | null; fromCents: number };

export default function Catalog({ beats }: { beats: CBeat[] }) {
  const [genre, setGenre] = useState("");
  const [moods, setMoods] = useState<string[]>([]);

  const genres = useMemo(() => Array.from(new Set(beats.map(b => b.genre).filter(Boolean) as string[])).sort(), [beats]);
  const allMoods = useMemo(() => Array.from(new Set(beats.flatMap(b => (b.mood || "").split(",").map(s => s.trim()).filter(Boolean)))).sort(), [beats]);

  const filtered = useMemo(() => beats.filter(b => {
    if (genre && (b.genre || "") !== genre) return false;
    if (moods.length) { const bm = (b.mood || "").toLowerCase(); if (!moods.every(m => bm.includes(m.toLowerCase()))) return false; }
    return true;
  }), [beats, genre, moods]);

  const toggleMood = (m: string) => setMoods(x => x.includes(m) ? x.filter(y => y !== m) : [...x, m]);
  const hasFilters = genres.length > 0 || allMoods.length > 0;

  return (
    <div>
      {hasFilters && (
        <div className="filterbar reveal in">
          {genres.length > 0 && (
            <div className="fgroup"><span className="flabel">Genre</span>
              <button className={`fchip ${genre === "" ? "on" : ""}`} onClick={() => setGenre("")}>Tous</button>
              {genres.map(g => <button key={g} className={`fchip ${genre === g ? "on" : ""}`} onClick={() => setGenre(genre === g ? "" : g)}>{g}</button>)}
            </div>
          )}
          {allMoods.length > 0 && (
            <div className="fgroup"><span className="flabel">Mood</span>
              {allMoods.map(m => <button key={m} className={`fchip ${moods.includes(m) ? "on" : ""}`} onClick={() => toggleMood(m)}>{m}</button>)}
              {moods.length > 0 && <button className="fchip" onClick={() => setMoods([])}>✕ effacer</button>}
            </div>
          )}
        </div>
      )}
      {filtered.length === 0
        ? <p className="catalog-empty">Aucun son ne correspond à ces filtres.</p>
        : <div className="grid">{filtered.map((b, i) => <BeatCard key={b.id} beat={b} fromCents={b.fromCents} delay={(i % 8) * 0.05} />)}</div>}
    </div>
  );
}
