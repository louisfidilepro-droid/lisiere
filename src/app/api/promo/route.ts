import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  const sb = await createClient();
  const { data } = await sb.from("promo_codes").select("percent_off").ilike("code", code).eq("active", true).single();
  return NextResponse.json({ percent_off: data?.percent_off ?? null });
}
