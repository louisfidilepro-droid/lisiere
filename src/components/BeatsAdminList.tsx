"use client";
import { useState } from "react";
import Link from "next/link";
import Sortable from "./Sortable";
import AdminRowPlay from "./AdminRowPlay";
import { reorderBeats, deleteBeat, createSendLink } from "@/app/admin/actions";
import { euro } from "@/lib/format";

export interface AdminBeat {
  key: string; id: string; title: string; collection: string | null; collSlug: string | null;
  genre: string | null; bpm: number | null; music_key: string | null;
  status: string; featured: boolean; fromCents: number; sold: boolean; previewUrl: string | null;
}

function SendPanel({ id, title }: { id: string; title: string }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const gen = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await createSendLink(id, email || undefined);
      setLink(r.url);
      setMsg(r.emailed ? `Envoyé par mail à ${email} ✓` : (email ? "Lien généré (email non configuré — copie-le)" : "Lien généré"));
    } catch (e) { setMsg("Erreur : " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Ton téléchargement — " + title)}&body=${encodeURIComponent("Salut,\n\nVoici ton lien de téléchargement pour « " + title + " » :\n" + link + "\n\nValable 14 jours.\n— Lisière")}`;

  return (
    <div className="badmin-send">
      <div className="badmin-send-row">
        <input type="email" placeholder="email du destinataire (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="a-act" disabled={busy} onClick={gen}>{busy ? "…" : "Générer le lien"}</button>
      </div>
      {link && (
        <div className="badmin-send-row">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="a-act" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
          <a className="a-act" href={mailto}>Ouvrir l’email</a>
        </div>
      )}
      {msg && <span className="badmin-send-msg" style={{ color: msg.startsWith("Erreur") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</span>}
    </div>
  );
}

function Row({ b, controls }: { b: AdminBeat; controls: React.ReactNode }) {
  const [send, setSend] = useState(false);
  return (
    <div>
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
          <button type="button" className={`a-act ${send ? "on" : ""}`} onClick={() => setSend(s => !s)}>Envoyer</button>
          <Link href={`/admin?edit=${b.id}`} className="a-act">Éditer</Link>
          <form action={deleteBeat} style={{ display: "inline" }}>
            <input type="hidden" name="id" defaultValue={b.id} />
            <button className="a-act" style={{ borderColor: "rgba(255,138,138,.4)", color: "#ff8a8a" }}>Suppr.</button>
          </form>
        </span>
      </div>
      {send && <SendPanel id={b.id} title={b.title} />}
    </div>
  );
}

export default function BeatsAdminList({ beats }: { beats: AdminBeat[] }) {
  const [items, setItems] = useState<AdminBeat[]>(beats);
  if (items.length === 0) return <p style={{ color: "var(--tx-faint)" }}>Aucun beat. Ajoute-en un ci-dessus.</p>;
  const onReorder = async (next: AdminBeat[]) => { setItems(next); await reorderBeats(next.map((b) => b.id)); };
  return <Sortable items={items} onChange={onReorder} render={(b, controls) => <Row b={b} controls={controls} />} />;
}
