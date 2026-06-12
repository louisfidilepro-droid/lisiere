"use client";
import { useState } from "react";
import Sortable from "./Sortable";
import { saveCollection, deleteCollection, reorderCollections, createUploadUrl } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/browser";

export interface CollGroup {
  name: string; slug: string; count: number; covers: string[];
  row: { id: string; description: string | null; cover_url: string | null; sort_order: number } | null;
}
type Item = CollGroup & { key: string };

export default function CollectionsManager({ groups }: { groups: CollGroup[] }) {
  const [items, setItems] = useState<Item[]>(groups.map((g) => ({ ...g, key: g.slug })));

  if (items.length === 0)
    return <p style={{ color: "var(--tx-faint)", fontSize: ".88rem" }}>Aucun dossier pour l’instant. Donne une « Collection / Dossier » à un beat pour en créer un.</p>;

  const onReorder = async (next: Item[]) => {
    setItems(next);
    await reorderCollections(next.map((i) => ({ name: i.name, slug: i.slug })));
  };

  return (
    <Sortable items={items} onChange={onReorder} render={(g, controls) => <Row key={g.slug} g={g} controls={controls} />} />
  );
}

function Row({ g, controls }: { g: Item; controls: React.ReactNode }) {
  const [cover, setCover] = useState(g.row?.cover_url ?? "");
  const [desc, setDesc] = useState(g.row?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const preview = cover || g.covers[0] || "";

  const uploadCover = async (file: File) => {
    setBusy(true); setMsg("Upload…");
    try {
      const sb = createClient();
      const { path, token } = await createUploadUrl("previews", file.name.split(".").pop() || "jpg");
      const { error } = await sb.storage.from("previews").uploadToSignedUrl(path, token, file);
      if (error) throw new Error(error.message);
      const url = sb.storage.from("previews").getPublicUrl(path).data.publicUrl;
      setCover(url); setMsg("Pochette prête — clique Enregistrer");
    } catch (e) { setMsg("Erreur: " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };

  const save = async () => {
    setBusy(true); setMsg("Enregistrement…");
    const fd = new FormData();
    fd.set("name", g.name); fd.set("cover_url", cover); fd.set("description", desc); fd.set("sort_order", String(g.row?.sort_order ?? 0));
    try { await saveCollection(fd); setMsg("Enregistré ✓"); } catch (e) { setMsg("Erreur: " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };

  return (
    <div className="cm-row">
      {controls}
      <div className="cm-cover" style={{ background: preview ? `url('${preview}') center/cover` : "linear-gradient(150deg,var(--v-deep),var(--bg-0))" }} />
      <div className="cm-title"><b>{g.name}</b><span>{g.count} son{g.count > 1 ? "s" : ""}</span></div>
      <label className="cm-f"><span>Pochette d’un beat</span>
        <select value={g.covers.includes(cover) ? cover : ""} onChange={(e) => setCover(e.target.value)}>
          <option value="">Auto / personnalisée</option>
          {g.covers.map((c, i) => <option key={c} value={c}>Pochette {i + 1}</option>)}
        </select>
      </label>
      <label className="cm-f"><span>…ou uploader</span>
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
      </label>
      <label className="cm-f cm-desc"><span>Description</span>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="optionnel" />
      </label>
      <button type="button" className="a-act" disabled={busy} onClick={save}>{busy ? "…" : "Enregistrer"}</button>
      {g.row && (
        <form action={deleteCollection} style={{ display: "inline" }}>
          <input type="hidden" name="id" value={g.row.id} />
          <button className="a-act" style={{ borderColor: "rgba(255,138,138,.4)", color: "#ff8a8a" }}>Réinit.</button>
        </form>
      )}
      {msg && <span style={{ flexBasis: "100%", fontSize: ".78rem", color: msg.startsWith("Erreur") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</span>}
    </div>
  );
}
