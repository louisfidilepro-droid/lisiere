import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.text();                 // RAW body required for signature
  const sig = req.headers.get("stripe-signature");
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook signature: ${e.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as any;
    const admin = createAdminClient();

    // Idempotency: skip if this session was already fulfilled
    const { data: existing } = await admin.from("orders").select("id").eq("stripe_session_id", s.id).maybeSingle();
    if (existing) return NextResponse.json({ received: true });

    const cart: { beatId: string; tierId: string; cents: number }[] = JSON.parse(s.metadata?.cart || "[]");
    const total = cart.reduce((a, c) => a + c.cents, 0);

    const { data: order } = await admin.from("orders").insert({
      customer_email: s.customer_details?.email ?? s.customer_email ?? null,
      total_cents: total, stripe_session_id: s.id, status: "paid",
    }).select("id").single();

    if (order) {
      for (const c of cart) {
        const { data: item } = await admin.from("order_items").insert({
          order_id: order.id, product_id: c.beatId, license_tier_id: c.tierId, price_cents: c.cents,
        }).select("id").single();
        if (item) {
          await admin.from("download_grants").insert({ order_item_id: item.id, product_id: c.beatId });
          // Exclusive → remove from store
          const { data: tier } = await admin.from("license_tiers").select("is_exclusive").eq("id", c.tierId).single();
          if (tier?.is_exclusive) await admin.from("products").update({ status: "sold" }).eq("id", c.beatId);
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
