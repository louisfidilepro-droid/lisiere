import type { Metadata } from "next";
import { aromBeats, beatstarsEmbedUrl, aromOgImage, aromContact } from "@/data/arom";

const URL = "https://www.xn--lisire-6ua.com/beats";
const DESC = "AROM — instrumentales jerk drill françaises. Écoute et achète tes type beats drill : lease MP3/WAV, stems, exclusif. Prod. Lisière.";

export const metadata: Metadata = {
  title: "AROM — Jerk Drill Type Beats | prod. Lisière",
  description: DESC,
  keywords: ["jerk drill type beat", "instru drill", "AROM beats", "type beat drill français", "prod AROM", "drill instrumental"],
  alternates: { canonical: URL },
  openGraph: {
    title: "AROM — Jerk Drill Type Beats",
    description: DESC,
    url: URL,
    siteName: "AROM",
    type: "website",
    ...(aromOgImage ? { images: [{ url: aromOgImage, width: 1200, height: 630 }] } : {}),
  },
  twitter: {
    card: aromOgImage ? "summary_large_image" : "summary",
    title: "AROM — Jerk Drill Type Beats",
    description: DESC,
    ...(aromOgImage ? { images: [aromOgImage] } : {}),
  },
};

function ytId(url: string) { const m = url.match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ""; }
function thumb(b: { youtube: string; cover?: string }) { return b.cover || (ytId(b.youtube) ? `https://i.ytimg.com/vi/${ytId(b.youtube)}/hqdefault.jpg` : ""); }

const LICENCES = [
  { name: "Lease", files: "MP3 + WAV", price: "30 €" },
  { name: "Stems", files: "WAV + pistes séparées", price: "90 €" },
  { name: "Exclusif", files: "droits exclusifs, beat retiré", price: "sur demande" },
];

export default function BeatsPage() {
  return (
    <div className="arom">
      <section className="arom-hero">
        <span className="arom-kicker">prods by Lisière</span>
        <h1 className="arom-logo">AROM</h1>
        <p className="arom-tag">jerk drill instrumentals — français</p>
        <a className="arom-btn solid arom-hero-cta" href="#beats">Voir les prods</a>
      </section>

      <section className="arom-sec" id="beats">
        <div className="arom-head"><span className="arom-eyebrow">Catalogue</span><h2>Dernières prods</h2></div>
        <div className="arom-grid">
          {aromBeats.map((b, i) => {
            const t = thumb(b);
            return (
              <article className="arom-card" key={i}>
                <div className="arom-cover">
                  {t
                    ? <img src={t} alt={`${b.title} — jerk drill type beat`} loading="lazy" />
                    : <span className="arom-cover-empty">{b.title}</span>}
                  <span className="arom-bpm">{b.bpm} BPM</span>
                </div>
                <div className="arom-card-body">
                  <h3 className="arom-card-title">{b.title}</h3>
                  <div className="arom-actions">
                    <a className="arom-btn ghost" href={b.youtube} target="_blank" rel="noopener noreferrer">Écouter</a>
                    <a className="arom-btn solid" href={b.buy} target="_blank" rel="noopener noreferrer">Acheter</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {beatstarsEmbedUrl && (
          <div className="arom-embed">
            <iframe src={beatstarsEmbedUrl} title="AROM — store BeatStars" loading="lazy" allow="autoplay" />
          </div>
        )}
      </section>

      <section className="arom-sec" id="licences">
        <div className="arom-head"><span className="arom-eyebrow">Tarifs</span><h2>Licences</h2></div>
        <div className="arom-lic">
          {LICENCES.map((l) => (
            <div className="arom-lic-row" key={l.name}>
              <span className="arom-lic-name">{l.name}</span>
              <span className="arom-lic-files">{l.files}</span>
              <span className="arom-lic-price">{l.price}</span>
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
