"use client";
import { useState } from "react";
import { useStore } from "@/app/store";
import { euro } from "@/lib/format";

export default function Cart() {
  const { items, removeItem, cartOpen, setCartOpen } = useStore();
  const [code, setCode] = useState(""); const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null);
  const [loading, setLoading] = useState(false);

  const sub = items.reduce((s,i)=>s+i.priceCents,0);
  const disc = Math.round(sub*pct/100);

  const applyPromo = async () => {
    if (!code.trim()) return;
    const r = await fetch("/api/promo?code="+encodeURIComponent(code.trim()));
    const d = await r.json();
    if (d.percent_off){ setPct(d.percent_off); setMsg({t:`✓ ${d.percent_off}% off applied`,ok:true}); }
    else { setPct(0); setMsg({t:"✕ Unknown code",ok:false}); }
  };

  const checkout = async () => {
    if (!items.length) return; setLoading(true);
    try {
      const r = await fetch("/api/checkout", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ items: items.map(i=>({ beatId:i.beatId, tierId:i.tierId })), promoCode: pct?code:undefined }) });
      const d = await r.json();
      if (d.url) location.href = d.url; else { setMsg({t: d.error||"Checkout error",ok:false}); setLoading(false); }
    } catch { setMsg({t:"Network error",ok:false}); setLoading(false); }
  };

  return (
    <>
      <div className={`overlay ${cartOpen?"show":""}`} onClick={()=>setCartOpen(false)} />
      <div className={`drawer ${cartOpen?"show":""}`}>
        <div className="drawer-head"><div className="t">Your cart</div>
          <button className="x" onClick={()=>setCartOpen(false)}>×</button></div>
        <div className="drawer-body">
          {items.length===0 ? <div className="empty">Your cart is quiet for now.</div> :
            items.map((i,idx)=>(
              <div className="ci" key={idx}>
                <div className="ci-cover" style={{ background: i.coverUrl?`url('${i.coverUrl}') center/cover`:"linear-gradient(135deg,var(--v-deep),var(--bg-3))" }} />
                <div className="ci-info"><div className="t">{i.title}</div><div className="l">{i.tierName}</div>
                  <button className="ci-rm" onClick={()=>removeItem(idx)}>Remove</button></div>
                <div className="price">{euro(i.priceCents)}</div>
              </div>
            ))}
        </div>
        <div className="drawer-foot">
          <div className="promo">
            <input placeholder="Promo code" value={code} onChange={e=>setCode(e.target.value)} />
            <button onClick={applyPromo}>Apply</button>
          </div>
          {msg && <div className={`promo-msg ${msg.ok?"ok":"err"}`}>{msg.t}</div>}
          <div className="totals"><span>Subtotal</span><span>{euro(sub)}</span></div>
          {disc>0 && <div className="totals" style={{color:"var(--v-vivid)"}}><span>Discount −{pct}%</span><span>−{euro(disc)}</span></div>}
          <div className="totals grand"><span>Total</span><b>{euro(sub-disc)}</b></div>
          <button className="btn btn-primary" style={{width:"100%"}} disabled={loading||!items.length} onClick={checkout}>
            {loading ? "Redirecting…" : "Checkout — card or PayPal"}
          </button>
        </div>
      </div>
    </>
  );
}
