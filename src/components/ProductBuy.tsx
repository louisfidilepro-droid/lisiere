"use client";
import { useState } from "react";
import { useStore } from "@/app/store";
import { euro } from "@/lib/format";
import { tierPrice } from "@/lib/pricing";
import type { Beat, LicenseTier } from "@/lib/types";

interface Props {
  beatId: string; slug: string; title: string; meta: string;
  prices: Beat["prices"]; coverUrl: string | null; previewUrl: string | null;
  tiers: LicenseTier[]; sold: boolean;
}

export default function ProductBuy(p: Props) {
  const { addItem, play } = useStore();
  const [sel, setSel] = useState(0);
  if (p.sold) return <p style={{ color: "#ff8a8a" }}>Ce beat a été vendu en exclusivité — il n’est plus disponible.</p>;
  const t = p.tiers[sel];
  const price = t ? tierPrice(p.prices, t) : null;
  const onRequest = price == null;
  const label = (x: LicenseTier) => { const c = tierPrice(p.prices, x); return c == null ? "Sur demande" : euro(c); };

  return (
    <div>
      {p.previewUrl &&
        <button className="btn btn-ghost pdp-preview" type="button"
          onClick={() => play({ id: p.beatId, title: p.title, meta: p.meta, coverUrl: p.coverUrl, previewUrl: p.previewUrl })}>
          ▶ Écouter l’extrait
        </button>}

      <div className="lic-rail" style={{ marginBottom: 18 }}>
        {p.tiers.map((x, i) => (
          <button key={x.id} className={`lic-tab ${i === sel ? "on" : ""}`} onClick={() => setSel(i)}>
            <span className="lt-n">{x.name.split(" (")[0]}</span>
            <span className="lt-p">{label(x)}</span>
          </button>
        ))}
      </div>

      {t && <>
        <p style={{ color: "var(--tx-dim)", marginBottom: 8 }}>Tu reçois <b style={{ color: "var(--tx)" }}>{t.files}</b></p>
        <p style={{ color: "var(--tx-dim)", fontSize: ".9rem", marginBottom: 22 }}>{t.rights}</p>
        {onRequest ? (
          <a className="btn btn-primary" style={{ width: "100%" }}
            href={`mailto:lisiere.audio@gmail.com?subject=${encodeURIComponent("Exclusivité — " + p.title)}&body=${encodeURIComponent("Bonjour, je suis intéressé par la licence exclusive de « " + p.title + " ».")}`}>
            Exclusivité — nous contacter
          </a>
        ) : (
          <button className="btn btn-primary" style={{ width: "100%" }}
            onClick={() => addItem({
              beatId: p.beatId, slug: p.slug, title: p.title, coverUrl: p.coverUrl,
              tierId: t.id, tierName: t.name, isExclusive: t.is_exclusive, priceCents: price as number,
            })}>
            Ajouter au panier — {euro(price as number)}
          </button>
        )}
      </>}

      <div className="trust">
        <span className="trust-item"><svg viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7z" /></svg>Livraison instantanée</span>
        <span className="trust-item"><svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>Contrat PDF à l’achat</span>
        <span className="trust-item"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>Paiement sécurisé</span>
      </div>
      <p className="pdp-pay">Carte bancaire ou PayPal · fichiers délivrés par lien sécurisé.</p>
    </div>
  );
}
