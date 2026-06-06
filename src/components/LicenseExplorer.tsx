"use client";
import { useState } from "react";
import { euro } from "@/lib/format";
import type { LicenseTier } from "@/lib/types";

const label = (t: LicenseTier) => (t.price_cents == null ? "Sur demande" : euro(t.price_cents));

export default function LicenseExplorer({ tiers }: { tiers: LicenseTier[] }) {
  const [sel, setSel] = useState(0);
  const t = tiers[sel]; if (!t) return null;
  const rights = (t.rights || "").split("·").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="lic-explorer">
      <div className="lic-rail">
        {tiers.map((x, i) => (
          <button key={x.id} className={`lic-tab ${i === sel ? "on" : ""}`} onClick={() => setSel(i)}>
            <span className="lt-n">{x.name.split(" (")[0]}</span>
            <span className="lt-p">{label(x)}</span>
          </button>
        ))}
      </div>
      <div className="lic-stage">
        <div key={sel}>
          <div className="ls-tag">{t.is_exclusive ? "Full ownership" : "Non-exclusive licence"}</div>
          <div className="ls-name">{t.name.split(" (")[0]}{t.is_exclusive && <span className="tag-excl">Exclusive</span>}</div>
          <div className="ls-files">You receive <b>{t.files}</b></div>
          <ul className="ls-list">
            {rights.map((r, i) => (<li key={i}><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg><span>{r}</span></li>))}
          </ul>
          <div className="ls-foot">
            <div className="ls-price">{label(t)}</div>
            <a href="#catalog" className="btn btn-primary">Browse beats</a>
          </div>
        </div>
      </div>
    </div>
  );
}
