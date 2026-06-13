"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { collSlug } from "@/lib/slug";

async function guard() {
  const user = await getUser();
  if (!user || !isAdmin(user.email)) throw new Error("Not authorised");
}
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("beat-" + Date.now());

/** Admin-only: create a one-time signed upload URL (service role bypasses RLS).
 *  The browser then uploads the file straight to Storage via uploadToSignedUrl. */
export async function createUploadUrl(bucket: "previews" | "masters", ext: string) {
  await guard();
  const admin = createAdminClient();
  const prefix = bucket === "masters" ? "master" : "preview";
  const safeExt = (ext || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { path: data.path, token: data.token };
}

/** Files are uploaded client-side via signed URLs; this only stores the paths. */
export async function saveBeat(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  const id = (formData.get("id") as string) || "";
  const title = (formData.get("title") as string)?.trim() || "Untitled";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {
    title,
    type: (formData.get("type") as string) || "instrumental",
    genre: (formData.get("genre") as string) || null,
    mood: ((formData.get("mood") as string) || "").trim() || null,
    collection: ((formData.get("collection") as string) || "").trim() || null,
    bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
    music_key: (formData.get("music_key") as string) || null,
    status: (formData.get("status") as string) || "draft",
    brand: (formData.get("brand") as string) || "lisiere",
    featured: formData.get("featured") === "on",
    sort_order: Number(formData.get("sort_order") || 0),
    cover_url: (formData.get("cover_url") as string) || null,
    download_url: ((formData.get("download_url") as string) || "").trim() || null,
    description: (formData.get("description") as string) || null,
    base_price_cents: Math.round(Number(formData.get("base_price") || 29) * 100),
    tags: ((formData.get("tags") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
  };

  // per-tier price overrides (JSON: tierId -> cents)
  try { const p = JSON.parse((formData.get("prices") as string) || "{}"); row.prices = p && typeof p === "object" ? p : {}; } catch { row.prices = {}; }
  const previewPath = (formData.get("preview_path") as string) || "";
  const downloadPath = (formData.get("download_path") as string) || "";
  if (previewPath) row.preview_path = previewPath;
  if (downloadPath) row.download_path = downloadPath;

  if (id) {
    await admin.from("products").update(row).eq("id", id);
  } else {
    row.slug = slugify(title);
    await admin.from("products").insert(row);
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBeat(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  await admin.from("products").delete().eq("id", formData.get("id") as string);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}

/** Collections (folders): upsert cover / description / order by slug. */
export async function saveCollection(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return;
  const slug = collSlug(name);
  const row = {
    name, slug,
    description: ((formData.get("description") as string) || "").trim() || null,
    cover_url: ((formData.get("cover_url") as string) || "").trim() || null,
    sort_order: Number(formData.get("sort_order") || 0),
  };
  await admin.from("collections").upsert(row, { onConflict: "slug" });
  revalidatePath("/"); revalidatePath("/admin"); revalidatePath(`/collection/${slug}`);
}

export async function deleteCollection(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  await admin.from("collections").delete().eq("id", formData.get("id") as string);
  revalidatePath("/"); revalidatePath("/admin");
}

/** License tiers: edit name / price / files / rights / order / active. */
export async function saveTier(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const priceStr = ((formData.get("price") as string) || "").trim();
  const price_cents = priceStr === "" ? null : Math.round(parseFloat(priceStr.replace(",", ".")) * 100);
  const row = {
    name: ((formData.get("name") as string) || "Licence").trim(),
    price_cents,
    files: (formData.get("files") as string) || "",
    rights: (formData.get("rights") as string) || "",
    sort_order: Number(formData.get("sort_order") || 0),
    active: formData.get("active") === "on",
  };
  await admin.from("license_tiers").update(row).eq("id", id);
  revalidatePath("/"); revalidatePath("/admin");
}

/** Persist a new beat order (index -> sort_order). */
export async function reorderBeats(ids: string[]) {
  await guard();
  const admin = createAdminClient();
  await Promise.all(ids.map((id, i) => admin.from("products").update({ sort_order: i }).eq("id", id)));
  revalidatePath("/"); revalidatePath("/admin");
}

/** Persist a new collection order; creates rows that don't exist yet. */
export async function reorderCollections(items: { name: string; slug: string }[]) {
  await guard();
  const admin = createAdminClient();
  const { data: existing } = await admin.from("collections").select("slug");
  const have = new Set(((existing ?? []) as { slug: string }[]).map((r) => r.slug));
  await Promise.all(items.map((it, i) =>
    have.has(it.slug)
      ? admin.from("collections").update({ sort_order: i }).eq("slug", it.slug)
      : admin.from("collections").insert({ name: it.name, slug: it.slug, sort_order: i })
  ));
  revalidatePath("/"); revalidatePath("/admin");
}

/** Génère un lien de téléchargement sécurisé (14 j) pour envoyer un beat/pack
 *  sans achat (collab, promo, gratuit). Envoie un email via Resend si RESEND_API_KEY est défini. */
export async function createSendLink(beatId: string, email?: string): Promise<{ url: string; emailed: boolean }> {
  await guard();
  const admin = createAdminClient();
  const expires = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await admin.from("download_grants")
    .insert({ product_id: beatId, order_item_id: null, expires_at: expires })
    .select("token").single();
  if (error) throw new Error(error.message);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/download/${data.token}`;

  let emailed = false;
  const key = process.env.RESEND_API_KEY;
  const clean = (email || "").trim();
  if (clean && key) {
    const { data: prod } = await admin.from("products").select("title").eq("id", beatId).single();
    const title = (prod?.title as string) || "ton son";
    const from = process.env.RESEND_FROM || "Lisière <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: [clean], subject: `Ton téléchargement — ${title}`,
          html: `<div style="font-family:sans-serif;line-height:1.6"><p>Salut,</p><p>Voici ton lien de téléchargement pour <b>${title}</b> :</p><p><a href="${url}">${url}</a></p><p style="color:#888;font-size:13px">Lien valable 14 jours.</p><p>— Lisière</p></div>`,
        }),
      });
      emailed = res.ok;
    } catch { emailed = false; }
  }
  return { url, emailed };
}

/** Crée un lien d'écoute partagé (style untitled/vvault) regroupant plusieurs beats. */
export async function createShare(
  beatIds: string[],
  opts: { title?: string; fullQuality?: boolean; allowDownload?: boolean }
): Promise<{ url: string }> {
  await guard();
  const admin = createAdminClient();
  const ids = Array.from(new Set(beatIds)).filter(Boolean);
  if (!ids.length) throw new Error("Aucun beat sélectionné");
  const { data, error } = await admin.from("shares").insert({
    title: (opts.title || "").trim() || null,
    beat_ids: ids,
    full_quality: !!opts.fullQuality,
    allow_download: opts.allowDownload !== false,
  }).select("token").single();
  if (error) throw new Error(error.message);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  return { url: `${base}/listen/${data.token}` };
}
