import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier } from "@/lib/types";
import ProductBuy from "@/components/ProductBuy";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: beat } = await sb.from("products").select("*").eq("slug", slug).in("status", ["published", "sold"]).single();
  if (!beat) notFound();
  const b = beat as Beat;
  const { data: tiers } = await sb.from("license_tiers").select("*").eq("active", true).order("sort_order");
  const previewUrl = b.preview_path ? sb.storage.from("previews").getPublicUrl(b.preview_path).data.publicUrl : null;
  const cover = b.cover_url ? `url('${b.cover_url}') center/cover` : "linear-gradient(150deg,var(--v-deep),var(--bg-0))";
  const moods = (b.mood || "").split(",").map((m) => m.trim()).filter(Boolean);

  return (
    <main className={`page pdp ${b.brand === "arom" ? "arom" : ""}`}>
      <Link href="/" className="a-act" style={{ marginBottom: 22, display: "inline-block" }}>← Retour</Link>
      <div className="pdp-grid">
        <div className="pdp-cover-wrap">
          <div className="pdp-cover" style={{ background: cover }} />
        </div>
        <div className="pdp-info">
          <span className="eyebrow">{b.collection || (b.type === "instrumental" ? "Instrumental" : b.type)}</span>
          <h1 className="display pdp-title">{b.title}</h1>
          <div className="pdp-tags">
            {b.bpm ? <span>{b.bpm} BPM</span> : null}
            {b.music_key ? <span>{b.music_key}</span> : null}
            {b.genre ? <span>{b.genre}</span> : null}
            {moods.map((m) => <span key={m}>{m}</span>)}
          </div>
          {b.description && <p className="pdp-desc">{b.description}</p>}
          <ProductBuy beatId={b.id} slug={b.slug} title={b.title}
            meta={`${b.bpm ?? ""} BPM · ${b.music_key ?? ""} · ${b.genre ?? ""}`}
            prices={b.prices} coverUrl={b.cover_url} previewUrl={previewUrl}
            tiers={(tiers ?? []) as LicenseTier[]} sold={b.status === "sold"} />
        </div>
      </div>
    </main>
  );
}
