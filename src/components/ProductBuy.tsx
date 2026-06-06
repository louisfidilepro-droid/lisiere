"use client";
import { useState } from "react";
import { useStore } from "@/app/store";
import { euro } from "@/lib/format";
import type { LicenseTier } from "@/lib/types";

interface Props {
  beatId: string; slug: string; title: string; meta: string;
  baseCents: number; coverUrl: string | null; previewUrl: string | null;
  tiers: LicenseTier[]; sold: boolean;
}
const label = (t: LicenseTier) => (t.price_cents == null ? "Sur demande" : euro(t.price_cents));

export default function ProductBuy(p: Props) {
  const { addItem, play } = useStore();
  const [sel, setSel] = useState(0);
  if (p.sold) return <p style={{ color: "#ff8a8a" }}>This beat was sold exclusively and is no longer available.</p>;
  const t = p.tiers[sel];
  const onRequest = !t || t.price_cents == null;

  return (
    <div>
      {p.previewUrl &&
        <button className="btn btn-ghost" style={{ marginBottom: 24 }}
          onClick={() => play({ id: p.beatId, title: p.title, meta: p.meta, coverUrl: p.coverUrl, previewUrl: p.previewUrl })}>
          ▶ Preview
        </button>}
      <div className="lic-rail" style={{ marginBottom: 20 }}>
        {p.tiers.map((x, i) => (
          <button key={x.id} className={`lic-tab ${i === sel ? "on" : ""}`} onClick={() => setSel(i)}>
            <span className="lt-n">{x.name.split(" (")[0]}</span>
            <span className="lt-p">{label(x)}</span>
          </button>
        ))}
      </div>
      {t && <>
        <p style={{ color: "var(--tx-dim)", marginBottom: 8 }}>You receive <b style={{ color: "var(--tx)" }}>{t.files}</b></p>
        <p style={{ color: "var(--tx-dim)", fontSize: ".9rem", marginBottom: 24 }}>{t.rights}</p>
        {onRequest ? (
          <a className="btn btn-primary"
            href={`mailto:lisiere.audio@gmail.com?subject=${encodeURIComponent("Exclusive — " + p.title)}&body=${encodeURIComponent("Hi, I'm interested in the exclusive licence for \"" + p.title + "\".")}`}>
            Exclusive — contact us
          </a>
        ) : (
          <button className="btn btn-primary"
            onClick={() => addItem({
              beatId: p.beatId, slug: p.slug, title: p.title, coverUrl: p.coverUrl,
              tierId: t.id, tierName: t.name, isExclusive: t.is_exclusive, priceCents: t.price_cents as number,
            })}>
            Add to cart — {euro(t.price_cents as number)}
          </button>
        )}
      </>}
    </div>
  );
}
