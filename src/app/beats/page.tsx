import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Beat, LicenseTier } from "@/lib/types";
import Catalog, { CBeat } from "@/components/Catalog";
import { tierPrice } from "@/lib/pricing";
import { euro } from "@/lib/format";
import { aromOgImage, aromContact } from "@/data/arom";

export const dynamic = "force-dynamic";

const SITE = "https://www.xn--lisire-6ua.com/beats";
const DESC = "AROM — instrumentales jerk drill françaises. Écoute et achète tes type beats drill : lease, stems, exclusif. Prod. Lisière.";

export const metadata: Metadata = {
  title: "AROM — Jerk Drill Type Beats | prod. Lisière",
  description: DESC,
  keywords: ["jerk drill type beat", "instru drill", "AROM beats", "type beat drill français", "prod AROM", "drill instrumental"],
  alternates: { canonical: SITE },
  openGraph: {
    title: "AROM — Jerk Drill Type Beats", description: DESC, url: SITE, siteName: "AROM", type: "website",
    ...(aromOgImage ? { images: [{ url: aromOgImage, width: 1200, height: 630 }] } : {}),
  },
  twitter: {
    card: aromOgImage ? "summary_large_image" : "summary",
    title: "AROM — Jerk Drill Type Beats", description: DESC,
    ...(aromOgImage ? { images: [aromOgImage] } : {}),
  },
};

export default async function BeatsPage() {
  const sb = await createClient();
  const [{ data: beats }, { data: tiersData }] = await Promise.all([
    sb.from("products").select("*").eq("brand", "arom").in("status", ["published", "sold"]).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    sb.from("license_tiers").select("*").eq("active", true).order("sort_order"),
  ]);
  const tiers = (tiersData ?? []) as LicenseTier[];
  const list = (beats ?? []) as Beat[];
  const fromOf = (bt: Beat) => { const ps = tiers.map(t => tierPrice(bt.prices, t)).filter((n): n is number => n != null); return ps.length ? Math.min(...ps) : 0; };
  const pub = (p: string | null) => p ? sb.storage.from("previews").getPublicUrl(p).data.publicUrl : null;
  const clientBeats: CBeat[] = list.map(b => ({ ...b, previewUrl: pub(b.preview_path), coverUrl: b.cover_url, fromCents: fromOf(b) }));

  return (
    <div className="arom">
      <section className="arom-hero">
        <span className="arom-kicker">prods by Lisière</span>
        <h1 className="arom-logo">AROM</h1>
        <p className="arom-tag">jerk drill instrumentals — français</p>
        <a className="btn btn-primary arom-hero-cta" href="#beats">Voir les prods</a>
      </section>

      <section className="arom-sec" id="beats">
        <div className="arom-head"><span className="arom-eyebrow">Catalogue</span><h2>Dernières prods</h2></div>
        {clientBeats.length === 0
          ? <p className="arom-note">Bientôt. Ajoute des beats dans <b>/admin</b> avec « Marque = AROM » et ils apparaîtront ici.</p>
          : <Catalog beats={clientBeats} />}
      </section>

      <section className="arom-sec" id="licences">
        <div className="arom-head"><span className="arom-eyebrow">Tarifs</span><h2>Licences</h2></div>
        <div className="arom-lic">
          {tiers.map(t => (
            <div className="arom-lic-row" key={t.id}>
              <span className="arom-lic-name">{t.name.split(" (")[0]}</span>
              <span className="arom-lic-files">{t.files}</span>
              <span className="arom-lic-price">{t.price_cents != null ? euro(t.price_cents) : "sur demande"}</span>
            </div>
          ))}
        </div>
        <p className="arom-note">Usage non commercial gratuit avec le crédit « Prod. AROM » — toute distribution (Spotify, Deezer…) nécessite une licence.</p>
      </section>

      <section className="arom-sec" id="contact">
        <div className="arom-head"><span className="arom-eyebrow">Booking &amp; custom</span><h2>Contact</h2></div>
        <div className="arom-contact">
          <a href={`mailto:${aromContact.email}`}>{aromContact.email}</a>
          <a href={aromContact.instagram} target="_blank" rel="noopener noreferrer">Instagram {aromContact.instagramHandle}</a>
        </div>
        <p className="arom-foot">AROM — prod. Lisière · {new Date().getFullYear()}</p>
      </section>
    </div>
  );
}
