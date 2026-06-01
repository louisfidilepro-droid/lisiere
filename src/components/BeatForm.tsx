"use client";
import { saveBeat } from "@/app/admin/actions";
import type { Beat } from "@/lib/types";

export default function BeatForm({ beat }: { beat?: Beat | null }) {
  const b = beat;
  return (
    <form action={saveBeat}>
      {b && <input type="hidden" name="id" defaultValue={b.id} />}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="field"><label>Title</label><input name="title" defaultValue={b?.title} required /></div>
        <div className="field"><label>Type</label>
          <select name="type" defaultValue={b?.type||"instrumental"}>
            <option value="instrumental">Instrumental</option><option value="drumkit">Drum kit</option>
            <option value="loopkit">Loop kit</option><option value="preset">Preset pack</option>
          </select></div>
        <div className="field"><label>Genre</label><input name="genre" defaultValue={b?.genre??""} /></div>
        <div className="field"><label>BPM</label><input name="bpm" type="number" defaultValue={b?.bpm??""} /></div>
        <div className="field"><label>Key</label><input name="music_key" defaultValue={b?.music_key??""} /></div>
        <div className="field"><label>Base price (€) — Basic tier</label><input name="base_price" type="number" step="1" defaultValue={b?(b.base_price_cents/100):29} /></div>
        <div className="field"><label>Status</label>
          <select name="status" defaultValue={b?.status||"published"}>
            <option value="published">Published</option><option value="draft">Draft</option>
            <option value="hidden">Hidden</option><option value="sold">Sold</option>
          </select></div>
        <div className="field"><label>Cover image URL</label><input name="cover_url" defaultValue={b?.cover_url??""} placeholder="https://…" /></div>
        <div className="field" style={{gridColumn:"1/-1"}}><label>Tags (comma separated)</label><input name="tags" defaultValue={(b?.tags||[]).join(", ")} /></div>
        <div className="field" style={{gridColumn:"1/-1"}}><label>Description</label><textarea name="description" defaultValue={b?.description??""} rows={3} /></div>
        <div className="field"><label>Preview audio (MP3) {b?.preview_path?"— replace":""}</label><input name="preview_file" type="file" accept="audio/*" /></div>
        <div className="field"><label>Deliverable file (zip/wav) {b?.["download_path" as keyof Beat]?"— replace":""}</label><input name="master_file" type="file" /></div>
        <label style={{display:"flex",gap:8,alignItems:"center",fontSize:".85rem",color:"var(--tx-dim)"}}>
          <input type="checkbox" name="featured" defaultChecked={b?.featured} style={{width:"auto"}} /> Featured</label>
      </div>
      <button className="btn btn-primary" style={{marginTop:18}}>{b?"Save changes":"Add beat"}</button>
    </form>
  );
}
