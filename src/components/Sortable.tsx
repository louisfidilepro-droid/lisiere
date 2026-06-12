"use client";
import { useState } from "react";

export interface SortItem { key: string }

/** Reorder list: drag the handle (desktop) or use ▲▼ (mobile). Calls onChange with the new order. */
export default function Sortable<T extends SortItem>({
  items, onChange, render,
}: { items: T[]; onChange: (items: T[]) => void; render: (item: T, controls: React.ReactNode) => React.ReactNode }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const a = [...items]; const [x] = a.splice(from, 1); a.splice(to, 0, x); onChange(a);
  };

  return (
    <div className="sortable">
      {items.map((it, i) => {
        const controls = (
          <span className="sort-ctl">
            <span className="sort-h" draggable
              onDragStart={() => setDrag(i)}
              onDragEnd={() => { setDrag(null); setOver(null); }}
              title="Glisser pour réordonner">⠿</span>
            <button type="button" className="sort-ar" onClick={() => move(i, i - 1)} aria-label="Monter">▲</button>
            <button type="button" className="sort-ar" onClick={() => move(i, i + 1)} aria-label="Descendre">▼</button>
          </span>
        );
        return (
          <div key={it.key}
            className={`sort-row ${over === i && drag !== null && drag !== i ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); setOver(null); }}>
            {render(it, controls)}
          </div>
        );
      })}
    </div>
  );
}
