import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier } from "@/lib/types";
import Hero from "@/components/Hero";
import BeatCard from "@/components/BeatCard";
import LicenseExplorer from "@/components/LicenseExplorer";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const sb = await createClient();
    const [{ data: beats }, { data: tiers }] = await Promise.all([
      sb.from("products").select("*").in("status", ["published","sold"]).order("created_at", { ascending: false }),
      sb.from("license_tiers").select("*").eq("active", true).order("sort_order"),
    ]);
    return { beats: (beats ?? []) as Beat[], tiers: (tiers ?? []) as LicenseTier[], sb };
  } catch {
    return { beats: [] as Beat[], tiers: [] as LicenseTier[], sb: null };
  }
}

export default async function Home() {
  const { beats, tiers, sb } = await getData();
  const paid = tiers.map(t=>t.price_cents).filter((n): n is number => n != null);
  const fromCents = paid.length ? Math.min(...paid) : 0;
  const pub = (path: string|null) => (path && sb) ? sb.storage.from("previews").getPublicUrl(path).data.publicUrl : null;
  const clientBeats = beats.map(b => ({ ...b, previewUrl: pub(b.preview_path), coverUrl: b.cover_url }));

  return (
    <main>
      <Hero />
      <section className="wrap" id="catalog" style={{ paddingTop: 20 }}>
        {clientBeats.length === 0 ? (
          <p style={{ color:"var(--tx-dim)", textAlign:"center", padding:"60px 0" }}>
            No beats published yet. Add some from the admin.
          </p>
        ) : (
          <div className="grid">
            {clientBeats.map((b,i)=>(
              <BeatCard key={b.id} beat={b} fromCents={fromCents} delay={(i%8)*0.05} />
            ))}
          </div>
        )}
      </section>

      {tiers.length>0 && (
        <section className="wrap" id="licenses">
          <div className="sec-head reveal"><span className="eyebrow">Licensing</span>
            <h2>Pick how far <em className="text-violet">it goes</em>.</h2></div>
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
