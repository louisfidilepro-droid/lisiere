"use client";
import { useState } from "react";
import Link from "next/link";
import Sortable from "./Sortable";
import AdminRowPlay from "./AdminRowPlay";
import { reorderBeats, deleteBeat } from "@/app/admin/actions";
import { euro } from "@/lib/format";

export interface AdminBeat {
  key: string; id: string; title: string; collection: string | null; collSlug: string | null;
  genre: string | null; bpm: number | null; music_key: string | null;
  status: string; featured: boolean; fromCents: number; sold: boolean; previewUrl: string | null;
}

export default function BeatsAdminList({ beats }: { beats: AdminBeat[] }) {
  const [items, setItems] = useState<AdminBeat[]>(beats);
  if (items.length === 0) return <p style={{ color: "var(--tx-faint)" }}>Aucun beat. Ajoute-en un ci-dessus.</p>;

  const onReorder = async (next: AdminBeat[]) => { setItems(next); await reorderBeats(next.map((b) => b.id)); };

  return (
    <Sortable items={items} onChange={onReorder} render={(b, controls) => (
      <div className="badmin-row">
        {controls}
        <AdminRowPlay url={b.previewUrl} />
        <div className="badmin-main">
          <b>{b.title}</b>
          <span className="badmin-meta">{b.collection ? <Link className="a-link" href={`/collection/${b.collSlug}`}>{b.collection}</Link> : "—"} · {b.genre || "—"} · {b.bpm || "—"} · {b.music_key || "—"}</span>
        </div>
        <span className="badmin-price">{b.sold ? "—" : euro(b.fromCents)}</span>
        <span className={`st ${b.status}`}>{b.status}</span>
        <span className="badmin-feat">{b.featured ? "★" : ""}</span>
        <span className="badmin-act">
          <Link href={`/admin?edit=${b.id}`} className="a-act">Éditer</Link>
          <form action={deleteBeat} style={{ display: "inline" }}>
            <input type="hidden" name="id" defaultValue={b.id} />
            <button className="a-act" style={{ borderColor: "rgba(255,138,138,.4)", color: "#ff8a8a" }}>Suppr.</button>
          </form>
        </span>
      </div>
    )} />
  );
}
