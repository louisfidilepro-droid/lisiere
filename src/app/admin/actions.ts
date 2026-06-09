"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
    music_key: (formData.get("music_key") as string) || null,
    status: (formData.get("status") as string) || "draft",
    featured: formData.get("featured") === "on",
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
