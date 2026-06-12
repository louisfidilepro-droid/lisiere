import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier } from "@/lib/types";
import Catalog, { CBeat } from "@/components/Catalog";
import { tierPrice } from "@/lib/pricing";
import { collSlug } from "@/lib/slug";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const [{ data: beatsData }, { data: tiersData }] = await Promise.all([
    sb.from("products").select("*").in("status", ["published", "sold"]).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    sb.from("license_tiers").select("*").eq("active", true).order("sort_order"),
  ]);
  const tiers = (tiersData ?? []) as LicenseTier[];
  const all = (beatsData ?? []) as Beat[];
  const inColl = all.filter(b => b.collection && collSlug(b.collection) === slug);
  if (inColl.length === 0) notFound();
  const name = inColl[0].collection as string;
  const fromOf = (bt: Beat) => { const ps = tiers.map(t => tierPrice(bt.prices, t)).filter((n): n is number => n != null); return ps.length ? Math.min(...ps) : 0; };
  const pub = (p: string | null) => p ? sb.storage.from("previews").getPublicUrl(p).data.publicUrl : null;
  const beats: CBeat[] = inColl.map(b => ({ ...b, previewUrl: pub(b.preview_path), coverUrl: b.cover_url, fromCents: fromOf(b) }));

  return (
    <main className="page">
      <Link href="/#collections" className="a-act" style={{ marginBottom: 24 }}>← Collections</Link>
      <div className="sec-head" style={{ marginTop: 18, marginBottom: 32 }}><span className="eyebrow">Collection</span><h2>{name}</h2></div>
      <Catalog beats={beats} />
    </main>
  );
}
