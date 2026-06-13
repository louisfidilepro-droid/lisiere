"use client";
import { useMemo, useState } from "react";
import { createShare } from "@/app/admin/actions";

export interface ShareBeat { id: string; title: string; collection: string | null }

export default function ShareBuilder({ beats, collections }: { beats: ShareBeat[]; collections: string[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [full, setFull] = useState(false);
  const [dl, setDl] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");

  const shown = useMemo(() => beats.filter(b => (b.title + " " + (b.collection || "")).toLowerCase().includes(q.toLowerCase())), [beats, q]);
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addCollection = (name: string) => { if (!name) return; setSel(s => { const n = new Set(s); beats.filter(b => b.collection === name).forEach(b => n.add(b.id)); return n; }); };

  const gen = async () => {
    setBusy(true); setMsg(""); setLink("");
    try {
      const r = await createShare([...sel], { title, fullQuality: full, allowDownload: dl });
      setLink(r.url); setMsg("Lien créé ✓");
    } catch (e) { setMsg("Erreur : " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };

  return (
    <div className="sb">
      <div className="sb-top">
        <input className="sb-input" placeholder="Nom du lien (ex : Pack pour Niro)" value={title} onChange={e => setTitle(e.target.value)} />
        <select className="sb-input" defaultValue="" onChange={e => { addCollection(e.target.value); e.currentTarget.value = ""; }}>
          <option value="">+ Ajouter un dossier entier…</option>
          {collections.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <input className="sb-input" placeholder="Filtrer les beats…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="sb-list">
        {shown.map(b => (
          <label key={b.id} className={`sb-item ${sel.has(b.id) ? "on" : ""}`}>
            <input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} />
            <span className="sb-item-t">{b.title}</span>
            <span className="sb-item-c">{b.collection || "—"}</span>
          </label>
        ))}
      </div>

      <div className="sb-opts">
        <label><input type="checkbox" checked={full} onChange={e => setFull(e.target.checked)} /> Écoute en qualité complète (sinon extrait)</label>
        <label><input type="checkbox" checked={dl} onChange={e => setDl(e.target.checked)} /> Autoriser le téléchargement</label>
      </div>

      <div className="sb-go">
        <span className="sb-count">{sel.size} sélectionné{sel.size > 1 ? "s" : ""}</span>
        <button type="button" className="btn btn-primary" disabled={busy || sel.size === 0} onClick={gen}>{busy ? "…" : "Générer le lien d'écoute"}</button>
      </div>

      {link && (
        <div className="sb-result">
          <input readOnly value={link} onFocus={e => e.currentTarget.select()} />
          <button type="button" className="a-act" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
          <a className="a-act" href={link} target="_blank" rel="noopener noreferrer">Ouvrir</a>
        </div>
      )}
      {msg && <span style={{ fontSize: ".8rem", color: msg.startsWith("Erreur") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</span>}
    </div>
  );
}
