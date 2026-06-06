"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBeat } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/browser";
import type { Beat } from "@/lib/types";

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

      fd.delete("preview_file");
      fd.delete("master_file");

      const upload = async (bucket: string, file: File, prefix: string) => {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        setMsg(`Uploading ${file.name}...`);
        const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw new Error(error.message);
        return path;
      };

      if (previewFile && previewFile.size) fd.set("preview_path", await upload("previews", previewFile, "preview"));
      if (masterFile && masterFile.size) fd.set("download_path", await upload("masters", masterFile, "master"));

      setMsg("Saving...");
      await saveBeat(fd);
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
        <div className="field"><label>Base price (EUR) - Basic tier</label><input name="base_price" type="number" step="1" defaultValue={b ? (b.base_price_cents / 100) : 29} /></div>
        <div className="field"><label>Status</label>
          <select name="status" defaultValue={b?.status || "published"}>
            <option value="published">Published</option><option value="draft">Draft</option>
            <option value="hidden">Hidden</option><option value="sold">Sold</option>
          </select></div>
        <div className="field"><label>Cover image URL</label><input name="cover_url" defaultValue={b?.cover_url ?? ""} placeholder="https://..." /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Tags (comma separated)</label><input name="tags" defaultValue={(b?.tags || []).join(", ")} /></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Description</label><textarea name="description" defaultValue={b?.description ?? ""} rows={3} /></div>
        <div className="field"><label>Preview audio (MP3) {b?.preview_path ? "- replace" : ""}</label><input name="preview_file" type="file" accept="audio/*" /></div>
        <div className="field"><label>Deliverable file (zip/wav) {b?.["download_path" as keyof Beat] ? "- replace" : ""}</label><input name="master_file" type="file" /></div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--tx-dim)" }}>
          <input type="checkbox" name="featured" defaultChecked={b?.featured} style={{ width: "auto" }} /> Featured</label>
      </div>
      {msg && <p style={{ marginTop: 12, fontSize: ".85rem", color: msg.startsWith("Error") ? "#ff8a8a" : "var(--v-bright)" }}>{msg}</p>}
      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>
        {busy ? "Working..." : (b ? "Save changes" : "Add beat")}
      </button>
    </form>
  );
}
