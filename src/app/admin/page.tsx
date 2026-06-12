import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { euro } from "@/lib/format";
import type { Beat, LicenseTier, Collection } from "@/lib/types";
import { tierPrice } from "@/lib/pricing";
import BeatForm from "@/components/BeatForm";
import AdminRowPlay from "@/components/AdminRowPlay";
import CollectionsManager, { CollGroup } from "@/components/CollectionsManager";
import LicenseEditor from "@/components/LicenseEditor";
import { collSlug } from "@/lib/slug";
import { deleteBeat, signOut } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin/login");

  const { edit } = await searchParams;
  const admin = createAdminClient();
  const { data: beats } = await admin.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  const { data: tiersData } = await admin.from("license_tiers").select("*").order("sort_order");
  const { data: collRows } = await admin.from("collections").select("*").order("sort_order");
  const tiers = (tiersData ?? []) as LicenseTier[];
  const fromOf = (bt: Beat) => { const ps = tiers.map(t => tierPrice(bt.prices, t)).filter((n): n is number => n != null); return ps.length ? Math.min(...ps) : 0; };
  const list = (beats ?? []) as Beat[];
  const pub = (p: string | null) => p ? admin.storage.from("previews").getPublicUrl(p).data.publicUrl : null;
  const collections = Array.from(new Set(list.map(b => (b.collection || "").trim()).filter(Boolean))).sort();
  const rowsBySlug = new Map((((collRows ?? []) as Collection[])).map(r => [r.slug, r]));
  const groupMap = new Map<string, CollGroup>();
  for (const b of list) {
    const name = (b.collection || "").trim(); if (!name) continue;
    const slug = collSlug(name);
    let g = groupMap.get(slug);
    if (!g) { const r = rowsBySlug.get(slug); g = { name, slug, count: 0, covers: [], row: r ? { id: r.id, description: r.description, cover_url: r.cover_url, sort_order: r.sort_order } : null }; groupMap.set(slug, g); }
    g.count++; if (b.cover_url && !g.covers.includes(b.cover_url)) g.covers.push(b.cover_url);
  }
  const groups = [...groupMap.values()];
  let editing: Beat | null = null;
  if (edit) { const { data } = await admin.from("products").select("*").eq("id", edit).single(); editing = data as Beat; }

  return (
    <main className="page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:30}}>
        <h1 className="display" style={{fontSize:"2.6rem"}}>Studio · Catalogue</h1>
        <form action={signOut}><button className="a-act">Sign out</button></form>
      </div>

      <div style={{background:"var(--bg-1)",border:"1px solid var(--line)",borderRadius:16,padding:"26px 28px",marginBottom:40}}>
        <h2 className="display" style={{fontSize:"1.6rem",marginBottom:18}}>{editing?`Edit — ${editing.title}`:"Add a beat"}</h2>
        <BeatForm beat={editing} tiers={tiers} collections={collections} />
        {editing && <Link href="/admin" className="a-act" style={{marginTop:14}}>Cancel edit</Link>}
      </div>

      <details className="adash">
        <summary>Dossiers / Collections <span>({groups.length})</span></summary>
        <div className="adash-body"><CollectionsManager groups={groups} /></div>
      </details>

      <details className="adash">
        <summary>Licences &amp; prix <span>({tiers.length})</span></summary>
        <div className="adash-body"><LicenseEditor tiers={tiers} /></div>
      </details>

      <h2 className="display" style={{fontSize:"1.4rem",margin:"10px 0 16px"}}>Beats</h2>
      <table className="atable">
        <thead><tr><th></th><th>Title</th><th>Collection</th><th>Genre · BPM · Key</th><th>From</th><th>Status</th><th>Feat.</th><th></th></tr></thead>
        <tbody>
          {list.map(b=>(
            <tr key={b.id}>
              <td><AdminRowPlay url={pub(b.preview_path)} /></td>
              <td><b>{b.title}</b></td>
              <td style={{color:"var(--tx-dim)"}}>{b.collection ? <a className="a-act" href={`/collection/${collSlug(b.collection)}`}>{b.collection}</a> : "—"}</td>
              <td style={{color:"var(--tx-dim)"}}>{b.genre} · {b.bpm} · {b.music_key}</td>
              <td>{b.status==="sold"?"—":euro(fromOf(b))}</td>
              <td><span className={`st ${b.status}`}>{b.status}</span></td>
              <td>{b.featured?"★":"—"}</td>
              <td style={{whiteSpace:"nowrap"}}>
                <Link href={`/admin?edit=${b.id}`} className="a-act">Edit</Link>
                <form action={deleteBeat} style={{display:"inline"}}>
                  <input type="hidden" name="id" defaultValue={b.id} />
                  <button className="a-act" style={{borderColor:"rgba(255,138,138,.4)",color:"#ff8a8a"}}>Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
