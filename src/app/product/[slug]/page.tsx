import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier } from "@/lib/types";
import ProductBuy from "@/components/ProductBuy";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: beat } = await sb.from("products").select("*").eq("slug", slug).in("status",["published","sold"]).single();
  if (!beat) notFound();
  const b = beat as Beat;
  const { data: tiers } = await sb.from("license_tiers").select("*").eq("active", true).order("sort_order");
  const previewUrl = b.preview_path ? sb.storage.from("previews").getPublicUrl(b.preview_path).data.publicUrl : null;
  const cover = b.cover_url ? `url('${b.cover_url}') center/cover` : "linear-gradient(150deg,var(--v-deep),var(--bg-0))";

  return (
    <main className="page">
      <Link href="/" className="a-act" style={{marginBottom:30}}>← Back</Link>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:50,alignItems:"start",marginTop:20}}>
        <div style={{aspectRatio:"1",borderRadius:20,background:cover,boxShadow:"var(--shadow)"}} />
        <div>
          <h1 className="display" style={{fontSize:"3.4rem",marginBottom:8}}>{b.title}</h1>
          <div className="card-meta" style={{marginBottom:24}}><span>{b.bpm} BPM</span><span>{b.music_key}</span><span>{b.genre}</span></div>
          {b.description && <p style={{color:"var(--tx-dim)",marginBottom:30,maxWidth:460}}>{b.description}</p>}
          <ProductBuy beatId={b.id} slug={b.slug} title={b.title}
            meta={`${b.bpm??""} BPM · ${b.music_key??""} · ${b.genre??""}`}
            baseCents={b.base_price_cents} coverUrl={b.cover_url} previewUrl={previewUrl}
            tiers={(tiers??[]) as LicenseTier[]} sold={b.status==="sold"} />
        </div>
      </div>
    </main>
  );
}
