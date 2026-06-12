import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier, Collection } from "@/lib/types";
import Hero from "@/components/Hero";
import Catalog, { CBeat } from "@/components/Catalog";
import LicenseExplorer from "@/components/LicenseExplorer";
import { tierPrice } from "@/lib/pricing";
import { collSlug } from "@/lib/slug";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const sb = await createClient();
    const [{ data: beats }, { data: tiers }, { data: colls }] = await Promise.all([
      sb.from("products").select("*").eq("brand", "lisiere").in("status", ["published", "sold"]).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      sb.from("license_tiers").select("*").eq("active", true).order("sort_order"),
      sb.from("collections").select("*").order("sort_order"),
    ]);
    return { beats: (beats ?? []) as Beat[], tiers: (tiers ?? []) as LicenseTier[], colls: (colls ?? []) as Collection[], sb };
  } catch {
    return { beats: [] as Beat[], tiers: [] as LicenseTier[], colls: [] as Collection[], sb: null };
  }
}

export default async function Home() {
  const { beats, tiers, colls, sb } = await getData();
  const collMeta = new Map(colls.map(c => [c.slug, c]));
  const fromOf = (bt: Beat) => { const ps = tiers.map(t => tierPrice(bt.prices, t)).filter((n): n is number => n != null); return ps.length ? Math.min(...ps) : 0; };
  const pub = (path: string | null) => (path && sb) ? sb.storage.from("previews").getPublicUrl(path).data.publicUrl : null;
  const clientBeats: CBeat[] = beats.map(b => ({ ...b, previewUrl: pub(b.preview_path), coverUrl: b.cover_url, fromCents: fromOf(b) }));

  const map = new Map<string, { name: string; slug: string; cover: string | null; count: number; order: number }>();
  for (const b of clientBeats) {
    const name = (b.collection || "").trim(); if (!name) continue;
    const slug = collSlug(name); const e = map.get(slug);
    if (e) { e.count++; if (!e.cover) e.cover = b.coverUrl; } else map.set(slug, { name, slug, cover: b.coverUrl, count: 1, order: 0 });
  }
  for (const c of map.values()) { const m = collMeta.get(c.slug); if (m) { if (m.cover_url) c.cover = m.cover_url; c.order = m.sort_order; } }
  const collections = [...map.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return (
    <main>
      <Hero />

      {collections.length > 0 && (
        <section className="wrap" id="collections" style={{ marginTop: 6 }}>
          <div className="sec-head reveal"><span className="eyebrow">Collections</span><h2>Par <em className="text-violet">dossier</em>.</h2></div>
          <div className="coll-grid">
            {collections.map(c => (
              <Link key={c.slug} href={`/collection/${c.slug}`} className="coll-card reveal">
                <div className="coll-cover" style={{ background: c.cover ? `url('${c.cover}') center/cover` : "linear-gradient(150deg,var(--v-deep),var(--bg-0))" }} />
                <div className="coll-meta"><span className="coll-name">{c.name}</span><span className="coll-count">{c.count} son{c.count > 1 ? "s" : ""}</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="wrap" id="catalog" style={{ paddingTop: 8, marginTop: collections.length ? 64 : 22, scrollMarginTop: 90 }}>
        <div className="sec-head reveal"><span className="eyebrow">Catalogue</span><h2>Tous les <em className="text-violet">sons</em>.</h2></div>
        {clientBeats.length === 0
          ? <p style={{ color: "var(--tx-dim)", textAlign: "center", padding: "60px 0" }}>Aucun beat publié pour l’instant.</p>
          : <Catalog beats={clientBeats} />}
      </section>

      {tiers.length > 0 && (
        <section className="wrap" id="licenses">
          <div className="sec-head reveal"><span className="eyebrow">Licences</span><h2>Choisis jusqu’où <em className="text-violet">ça va</em>.</h2></div>
          <div className="reveal"><LicenseExplorer tiers={tiers} /></div>
        </section>
      )}

      <footer><div className="wrap"><div className="foot-line">
        <span className="foot-brand">Lisière</span>
        <span className="foot-meta">© MMXXVI · prod. Lisière</span>
      </div></div></footer>
    </main>
  );
}
