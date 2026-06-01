import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: grant } = await admin.from("download_grants")
    .select("id, product_id, expires_at").eq("token", token).single();
  if (!grant) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (new Date(grant.expires_at) < new Date())
    return NextResponse.json({ error: "This download link has expired." }, { status: 410 });

  const { data: product } = await admin.from("products").select("download_path").eq("id", grant.product_id).single();
  if (!product?.download_path) return NextResponse.json({ error: "File not available yet" }, { status: 404 });

  // Signed URL from the PRIVATE 'masters' bucket — valid 60s, single use here
  const { data: signed } = await admin.storage.from("masters").createSignedUrl(product.download_path, 60, { download: true });
  if (!signed?.signedUrl) return NextResponse.json({ error: "Could not create download" }, { status: 500 });

  await admin.from("download_grants").update({ downloaded_at: new Date().toISOString() }).eq("id", grant.id);
  return NextResponse.redirect(signed.signedUrl);
}
