"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBeat, createUploadUrl } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/browser";
import type { Beat, LicenseTier } from "@/lib/types";

// On-brand cover generator: dark + violet light pools, smoke wisps, fibrous streaks,
// vignette, film grain and a softly glowing title. Sober but textured.
async function generateCover(title: string): Promise<Blob> {
  const S = 1000;
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const x = c.getContext("2d")!;
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const base = x.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, "#0a0712"); base.addColorStop(1, "#050409");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const pools: [number, number, number, string, number][] = [
    [430, 360, 560, "157,107,255", 0.30], [810, 770, 540, "42,24,80", 0.55], [180, 840, 460, "122,77,255", 0.16],
  ];
  for (const [cx, cy, r, col, a] of pools) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  x.globalCompositeOperation = "screen";
  for (let i = 0; i < 24; i++) {
    const cx = rnd(0, S), cy = rnd(0, S), r = rnd(120, 340);
    const col = Math.random() < 0.6 ? "140,100,255" : "150,142,170";
    x.filter = `blur(${rnd(50, 95)}px)`;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${col},${rnd(0.04, 0.12)})`); g.addColorStop(1, "rgba(0,0,0,0)");
    x.save(); x.translate(cx, cy); x.rotate(rnd(0, Math.PI)); x.scale(rnd(1, 2.4), rnd(0.35, 0.7)); x.translate(-cx, -cy);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore();
  }
  x.filter = "blur(2px)";
  for (let i = 0; i < 36; i++) {
    x.strokeStyle = `rgba(150,120,255,${rnd(0.015, 0.05)})`; x.lineWidth = rnd(0.5, 1.6);
    x.beginPath(); let px = rnd(0, S), py = rnd(0, S); x.moveTo(px, py);
    for (let k = 0; k < 6; k++) { px += rnd(-90, 90); py += rnd(-50, 50); x.lineTo(px, py); }
    x.stroke();
  }
  x.filter = "none"; x.globalCompositeOperation = "source-over";
  const vg = x.createRadialGradient(S / 2, S * 0.46, S * 0.25, S / 2, S / 2, S * 0.82);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(3,2,7,0.9)");
  x.fillStyle = vg; x.fillRect(0, 0, S, S);
  const img = x.getImageData(0, 0, S, S); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = Math.random() * 38 - 19; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  try { await (document as unknown as { fonts: { load: (f: string) => Promise<unknown> } }).fonts.load("500 150px 'Cormorant Garamond'"); } catch {}
  x.textAlign = "center"; x.textBaseline = "middle";
  const words = (title || "Lisiere").trim().split(/\s+/);
  const lines: string[] = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > 12) { if (cur) lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  const size = lines.length > 2 ? 104 : 150;
  x.font = `500 ${size}px 'Cormorant Garamond', Georgia, serif`;
  const lh = size * 1.05; const startY = S / 2 - (lines.length - 1) * lh / 2;
  x.shadowColor = "rgba(122,77,255,0.55)"; x.shadowBlur = 38; x.fillStyle = "#f1edf8";
  lines.forEach((ln, i) => x.fillText(ln, S / 2, startY + i * lh));
  x.shadowBlur = 0;
  x.fillStyle = "rgba(182,172,206,0.82)"; x.font = "400 24px 'DM Sans', sans-serif";
  x.fillText("L I S I E R E", S / 2, S - 92);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png", 0.92));
}

export default function BeatForm({ beat, tiers, collections = [] }: { beat?: Beat | null; tiers: LicenseTier[]; collections?: string[] }) {
  const b = beat;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const priceable = tiers.filter((t) => !t.is_exclusive);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData(form);
      const sb = createClient();

      const previewFile = (form.elements.namedItem("preview_file") as HTMLInputElement)?.files?.[0];
      const masterFile = (form.elements.namedItem("master_file") as HTMLInputElement)?.files?.[0];
      const coverFile = (form.elements.namedItem("cover_file") as HTMLInputElement)?.files?.[0];
      fd.delete("preview_file"); fd.delete("master_file"); fd.delete("cover_file");

      // Per-tier price overrides -> JSON { tierId: cents }
      const prices: Record<string, number> = {};
      for (const t of priceable) {
        const v = (fd.get(`price_${t.id}`) as string || "").trim();
        fd.delete(`price_${t.id}`);
        if (v !== "") { const cents = Math.round(parseFloat(v.replace(",", ".")) * 100); if (cents > 0) prices[t.id] = cents; }
      }
      fd.set("prices", JSON.stringify(prices));

      const upload = async (bucket: "previews" | "masters", file: Blob, ext: string) => {
        const { path, token } = await createUploadUrl(bucket, ext);
        const { error } = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file);
        if (error) throw new Error(error.message);
        return path;
      };
      const publicUrl = (path: string) => sb.storage.from("previews").getPublicUrl(path).data.publicUrl;

      if (previewFile && previewFile.size) { setMsg(`Uploading ${previewFile.name}...`); fd.set("preview_path", await upload("previews", previewFile, previewFile.name.split(".").pop() || "mp3")); }
      if (masterFile && masterFile.size) { setMsg(`Uploading ${masterFile.name}...`); fd.set("download_path", await upload("masters", masterFile, masterFile.name.split(".").pop() || "zip")); }

      let coverUrl = ((fd.get("cover_url") as string) || "").trim();
      if (coverFile && coverFile.size) { setMsg("Uploading cover..."); coverUrl = publicUrl(await upload("previews", coverFile, coverFile.name.split(".").pop() || "jpg")); }
      else if (!coverUrl) { setMsg("Generating cover..."); const blob = await generateCover((fd.get("title") as string) || "Lisiere"); coverUrl = publicUrl(await upload("previews", blob, "png")); }
      fd.set("cover_url", coverUrl);

      setMsg("Saving...");
      await saveBeat(fd);
      setMsg("Saved");
      setBusy(false);
      if (!b) form.reset();
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setMsg("Error: " + (err instanceof Error ? err.message : String(err)));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {b && <input type="hidden" name="id" defaultValue={b.id} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field"><label>Title</label><input name="title" defaultValue={b?.title} required /></div>
        <div className="field"><label>Type</label>
          <select name="type" defaultValue={b?.type || "instrumental"}>
            <option value="instrumental">Instrumental</option><option value="drumkit">Drum kit</option>
            <option value="loopkit">Loop kit</option><option value="preset">Preset pack</option>
          </select></div>
        <div className="field"><label>Genre</label><input name="genre" defaultValue={b?.genre ?? ""} list="genre-list" />
          <datalist id="genre-list"><option value="Trap" /><option value="Boom bap" /><option value="Drill" /><option value="R&B" /><option value="Soul" /><option value="Jazz" /><option value="Lo-Fi" /><option value="Afrobeat" /><option value="Cinématique" /></datalist></div>
        <div className="field"><label>Collection / Dossier</label><input name="collection" defaultValue={b?.collection ?? ""} list="coll-list" placeholder="ex : Chaîne A, Pack de loops…" />
          <datalist id="coll-list">{collections.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Mood / ambiance (séparés par des virgules — sert aux filtres client)</label>
          <input name="mood" defaultValue={b?.mood ?? ""} list="mood-list" placeholder="ex : Sombre, Mélancolique, Cosmique" />
          <datalist id="mood-list"><option value="Sombre" /><option value="Mélancolique" /><option value="Cosmique" /><option value="Chaud" /><option value="Nostalgique" /><option value="Rêveur" /><option value="Mystérieux" /><option value="Agressif" /><option value="Apaisant" /><option value="Triomphant" /><option value="Hypnotique" /><option value="Introspectif" /></datalist></div>
        <div className="field"><label>BPM</label><input name="bpm" type="number" defaultValue={b?.bpm ?? ""} /></div>
        <div className="field"><label>Key</label><input name="music_key" defaultValue={b?.music_key ?? ""} /></div>
        <div className="field"><label>Status</label>
          <select name="status" defaultValue={b?.status || "published"}>
            <option value="published">Published</option><option value="draft">Draft</option>
            <option value="hidden">Hidden</option><option value="sold">Sold</option>
          </select></div>
      </div>

      <div style={{ marginTop: 16, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 12 }}>
        <div className="label" style={{ marginBottom: 10 }}>Prix des licences pour ce beat (€) — vide = prix par défaut</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {priceable.map((t) => (
            <div className="field" key={t.id} style={{ marginBottom: 0 }}>
              <label>{t.name.split(" (")[0]}</label>
              <input name={`price_${t.id}`} type="number" step="1" min="0"
                defaultValue={b?.prices?.[t.id] != null ? (b.prices[t.id] / 100) : (t.price_cents != null ? t.price_cents / 100 : "")}
                placeholder={t.price_cents != null ? String(t.price_cents / 100) : ""} />
            </div>
          ))}
        </div>
        <div style={{ color: "var(--tx-faint)", fontSize: ".78rem", marginTop: 8 }}>Exclusive reste « sur demande ».</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="field"><label>Featured</label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--tx-dim)", height: 44 }}>
            <input type="checkbox" name="featured" defaultChecked={b?.featured} style={{ width: "auto" }} /> Mettre en avant</label></div>
        <div className="field"><label>Ordre d’affichage (petit = en premier)</label><input name="sort_order" type="number" defaultValue={b?.sort_order ?? 0} /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Cover image (upload) {b?.cover_url ? "- replace" : "- leave empty to auto-generate"}</label><input name="cover_file" type="file" accept="image/*" /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>...or paste a cover image URL</label><input name="cover_url" defaultValue={b?.cover_url ?? ""} placeholder="https://... (optional)" /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Tags (comma separated)</label><input name="tags" defaultValue={(b?.tags || []).join(", ")} /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Description</label><textarea name="description" defaultValue={b?.description ?? ""} rows={3} /></div>
        <div className="field"><label>Preview audio (MP3) — c’est ce que le client écoute {b?.preview_path ? "· remplacer" : "· requis pour le lecteur"}</label><input name="preview_file" type="file" accept="audio/*" /></div>
        <div className="field"><label>Deliverable file (zip/wav, max 50 Mo) {b?.["download_path" as keyof Beat] ? "- replace" : ""}</label><input name="master_file" type="file" /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}>
          <label>…ou lien de téléchargement externe (fichiers &gt; 50 Mo : WeTransfer, Drive, Dropbox…)</label>
          <input name="download_url" defaultValue={b?.download_url ?? ""} placeholder="https://… — l'acheteur sera redirigé ici après paiement" />
          <span style={{ color: "var(--tx-faint)", fontSize: ".78rem", marginTop: 4 }}>Si rempli, ce lien remplace le fichier uploadé. Idéal pour les WAV/stems lourds.</span>
        </div>
      </div>
      {msg && <p style={{ marginTop: 12, fontSize: ".85rem", color: msg.startsWith("Error") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</p>}
      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>
        {busy ? "Working..." : (b ? "Save changes" : "Add beat")}
      </button>
    </form>
  );
}
