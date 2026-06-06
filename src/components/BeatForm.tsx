"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBeat, createUploadUrl } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/browser";
import type { Beat } from "@/lib/types";

// Generate an on-brand cover (dark + violet + grain + title) when none is provided.
async function generateCover(title: string): Promise<Blob> {
  const S = 1000;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const x = c.getContext("2d")!;
  x.fillStyle = "#06050a"; x.fillRect(0, 0, S, S);
  const g1 = x.createRadialGradient(420, 360, 60, 460, 440, 780);
  g1.addColorStop(0, "rgba(157,107,255,0.55)");
  g1.addColorStop(0.45, "rgba(122,77,255,0.16)");
  g1.addColorStop(1, "rgba(6,5,10,0)");
  x.fillStyle = g1; x.fillRect(0, 0, S, S);
  const g2 = x.createRadialGradient(820, 840, 40, 820, 840, 520);
  g2.addColorStop(0, "rgba(42,24,80,0.75)");
  g2.addColorStop(1, "rgba(6,5,10,0)");
  x.fillStyle = g2; x.fillRect(0, 0, S, S);
  // grain
  const img = x.getImageData(0, 0, S, S); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = Math.random() * 26 - 13; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  // title
  try { await (document as any).fonts.load("500 120px 'Cormorant Garamond'"); } catch {}
  x.fillStyle = "#ece8f4"; x.textAlign = "center"; x.textBaseline = "middle";
  const words = (title || "Lisiere").trim().split(/\s+/);
  const lines: string[] = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > 12) { if (cur) lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  let size = lines.length > 2 ? 110 : 150;
  x.font = `500 ${size}px 'Cormorant Garamond', Georgia, serif`;
  const lh = size * 1.05; const startY = S / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, i) => x.fillText(ln, S / 2, startY + i * lh));
  x.fillStyle = "rgba(168,160,189,0.85)";
  x.font = "400 26px 'DM Sans', sans-serif";
  x.fillText("L I S I E R E", S / 2, S - 90);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png", 0.92));
}

export default function BeatForm({ beat }: { beat?: Beat | null }) {
  const b = beat;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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

      const upload = async (bucket: "previews" | "masters", file: Blob, ext: string) => {
        const { path, token } = await createUploadUrl(bucket, ext);
        const { error } = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file);
        if (error) throw new Error(error.message);
        return path;
      };
      const publicUrl = (path: string) => sb.storage.from("previews").getPublicUrl(path).data.publicUrl;

      if (previewFile && previewFile.size) {
        setMsg(`Uploading ${previewFile.name}...`);
        fd.set("preview_path", await upload("previews", previewFile, previewFile.name.split(".").pop() || "mp3"));
      }
      if (masterFile && masterFile.size) {
        setMsg(`Uploading ${masterFile.name}...`);
        fd.set("download_path", await upload("masters", masterFile, masterFile.name.split(".").pop() || "zip"));
      }

      // Cover: uploaded file > typed URL > auto-generated from title
      let coverUrl = ((fd.get("cover_url") as string) || "").trim();
      if (coverFile && coverFile.size) {
        setMsg("Uploading cover...");
        coverUrl = publicUrl(await upload("previews", coverFile, coverFile.name.split(".").pop() || "jpg"));
      } else if (!coverUrl) {
        setMsg("Generating cover...");
        const blob = await generateCover((fd.get("title") as string) || "Lisiere");
        coverUrl = publicUrl(await upload("previews", blob, "png"));
      }
      fd.set("cover_url", coverUrl);

      setMsg("Saving...");
      await saveBeat(fd);
      setMsg("Saved ✓");
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
        <div className="field"><label>Genre</label><input name="genre" defaultValue={b?.genre ?? ""} /></div>
        <div className="field"><label>BPM</label><input name="bpm" type="number" defaultValue={b?.bpm ?? ""} /></div>
        <div className="field"><label>Key</label><input name="music_key" defaultValue={b?.music_key ?? ""} /></div>
        <div className="field"><label>Status</label>
          <select name="status" defaultValue={b?.status || "published"}>
            <option value="published">Published</option><option value="draft">Draft</option>
            <option value="hidden">Hidden</option><option value="sold">Sold</option>
          </select></div>
        <div className="field"><label>Featured</label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--tx-dim)", height: 44 }}>
            <input type="checkbox" name="featured" defaultChecked={b?.featured} style={{ width: "auto" }} /> Mettre en avant</label></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Cover image (upload) {b?.cover_url ? "- replace" : "- leave empty to auto-generate"}</label><input name="cover_file" type="file" accept="image/*" /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>...or paste a cover image URL</label><input name="cover_url" defaultValue={b?.cover_url ?? ""} placeholder="https://... (optional)" /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Tags (comma separated)</label><input name="tags" defaultValue={(b?.tags || []).join(", ")} /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Description</label><textarea name="description" defaultValue={b?.description ?? ""} rows={3} /></div>
        <div className="field"><label>Preview audio (MP3) {b?.preview_path ? "- replace" : ""}</label><input name="preview_file" type="file" accept="audio/*" /></div>
        <div className="field"><label>Deliverable file (zip/wav) {b?.["download_path" as keyof Beat] ? "- replace" : ""}</label><input name="master_file" type="file" /></div>
      </div>
      {msg && <p style={{ marginTop: 12, fontSize: ".85rem", color: msg.startsWith("Error") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</p>}
      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>
        {busy ? "Working..." : (b ? "Save changes" : "Add beat")}
      </button>
    </form>
  );
}
