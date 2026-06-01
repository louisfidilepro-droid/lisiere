import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceFor } from "@/lib/format";

interface Line { beatId: string; tierId: string; }

export async function POST(req: NextRequest) {
  try {
    const { items, promoCode } = (await req.json()) as { items: Line[]; promoCode?: string };
    if (!items?.length) return NextResponse.json({ error: "Empty cart" }, { status: 400 });
    const admin = createAdminClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Re-price everything server-side (never trust the client)
    const ids = [...new Set(items.map(i => i.beatId))];
    const tierIds = [...new Set(items.map(i => i.tierId))];
    const { data: beats } = await admin.from("products").select("id,title,base_price_cents,status").in("id", ids);
    const { data: tiers } = await admin.from("license_tiers").select("id,name,multiplier,is_exclusive").in("id", tierIds);
    if (!beats || !tiers) return NextResponse.json({ error: "Pricing failed" }, { status: 500 });

    let pct = 0;
    if (promoCode) {
      const { data: p } = await admin.from("promo_codes").select("percent_off").ilike("code", promoCode.trim()).eq("active", true).single();
      pct = p?.percent_off ?? 0;
    }

    const line_items: any[] = [];
    const meta: { beatId: string; tierId: string; cents: number }[] = [];
    for (const it of items) {
      const b = beats.find(x => x.id === it.beatId); const t = tiers.find(x => x.id === it.tierId);
      if (!b || !t) return NextResponse.json({ error: "Unknown item" }, { status: 400 });
      if (b.status === "sold") return NextResponse.json({ error: `${b.title} is no longer available` }, { status: 409 });
      let cents = priceFor(b.base_price_cents, t.multiplier);
      if (pct) cents = Math.round(cents * (1 - pct/100));
      meta.push({ beatId: b.id, tierId: t.id, cents });
      line_items.push({
        quantity: 1,
        price_data: { currency: "eur", unit_amount: cents,
          product_data: { name: `${b.title} — ${t.name}` } },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/`,
      automatic_tax: { enabled: false }, // active Stripe Tax + set to true when registered
      metadata: { cart: JSON.stringify(meta).slice(0, 4900) },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Checkout error" }, { status: 500 });
  }
}
