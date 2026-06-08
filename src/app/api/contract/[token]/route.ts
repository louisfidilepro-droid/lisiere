import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

const euro = (c: number) => "EUR " + (c / 100).toFixed(2);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: grant } = await admin.from("download_grants").select("order_item_id, product_id").eq("token", token).single();
  if (!grant) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  const { data: item } = await admin.from("order_items").select("order_id, license_tier_id, price_cents").eq("id", grant.order_item_id).single();
  if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  const [{ data: order }, { data: product }, { data: tier }] = await Promise.all([
    admin.from("orders").select("customer_email, created_at, stripe_session_id").eq("id", item.order_id).single(),
    admin.from("products").select("title").eq("id", grant.product_id).single(),
    admin.from("license_tiers").select("name, files, rights, is_exclusive").eq("id", item.license_tier_id).single(),
  ]);

  const buyer = order?.customer_email || "the licensee";
  const date = new Date(order?.created_at || Date.now()).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const ref = (order?.stripe_session_id || "").slice(-10).toUpperCase();
  const title = product?.title || "Instrumental";
  const tierName = tier?.name || "Licence";
  const files = tier?.files || "";
  const rights = (tier?.rights || "").split("·").map((s: string) => s.trim()).filter(Boolean);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const violet = rgb(0.48, 0.30, 1);
  const ink = rgb(0.12, 0.11, 0.16);
  const dim = rgb(0.38, 0.36, 0.45);
  let y = 790;
  const M = 56;
  const text = (t: string, x: number, yy: number, f = serif, size = 11, color = ink) => page.drawText(t, { x, y: yy, font: f, size, color });

  text("LISIERE", M, y, serifB, 22, violet); y -= 16;
  text("Music Licence Agreement", M, y, serif, 11, dim); y -= 34;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: rgb(0.85, 0.82, 0.9) }); y -= 30;

  text(`This agreement is issued on ${date} by Lisiere ("the Producer") to ${buyer} ("the Licensee"),`, M, y, serif, 11); y -= 18;
  text(`granting the rights below for the instrumental titled "${title}".`, M, y, serif, 11); y -= 34;

  text("Licence", M, y, serifB, 13, violet); y -= 20;
  text(`Tier: ${tierName}`, M, y, serif, 11); y -= 16;
  text(`Files delivered: ${files}`, M, y, serif, 11); y -= 16;
  text(`Price paid: ${euro(item.price_cents)}`, M, y, serif, 11); y -= 16;
  text(`Order reference: ${ref || "—"}`, M, y, serif, 11); y -= 30;

  text("Rights granted", M, y, serifB, 13, violet); y -= 20;
  for (const r of rights) { text("•  " + r, M, y, serif, 11); y -= 16; }
  y -= 14;

  text("Terms", M, y, serifB, 13, violet); y -= 20;
  const terms = tier?.is_exclusive
    ? ["This is an EXCLUSIVE licence: full ownership of the master is transferred to the Licensee.",
       "The instrumental is permanently removed from sale by the Producer.",
       "Producer credit (prod. Lisiere) is appreciated but not required."]
    : ["This is a NON-EXCLUSIVE licence. The Producer may license the instrumental to others.",
       "Producer credit is required: \"prod. Lisiere\".",
       "Resale or redistribution of the instrumental as-is (e.g. as a beat) is prohibited.",
       "Usage limits are defined by the tier above."];
  for (const t of terms) {
    // simple wrap
    const words = t.split(" "); let line = "";
    for (const w of words) { if ((line + " " + w).length > 78) { text(line, M, y, serif, 10.5); y -= 15; line = w; } else line = (line + " " + w).trim(); }
    if (line) { text(line, M, y, serif, 10.5); y -= 15; }
    y -= 4;
  }

  y = 96;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: rgb(0.85, 0.82, 0.9) }); y -= 20;
  text("Lisiere — lisiere.audio@gmail.com", M, y, sans, 9, dim);
  text("Generated automatically at purchase.", M, y - 14, sans, 9, dim);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="licence-${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf"`,
    },
  });
}
