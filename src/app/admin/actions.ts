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
  s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || ("beat-"+Date.now());

async function uploadFile(bucket: string, file: File, prefix: string): Promise<string|null> {
  if (!file || file.size === 0) return null;
  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${prefix}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucket).upload(path, buf, { contentType: file.type || undefined, upsert: true });
  if (error) throw new Error(`Upload (${bucket}): ${error.message}`);
  return path;
}

export async function saveBeat(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  const id = (formData.get("id") as string) || "";
  const title = (formData.get("title") as string)?.trim() || "Untitled";

  const row: any = {
    title,
    type: (formData.get("type") as string) || "instrumental",
    genre: (formData.get("genre") as string) || null,
    bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
    music_key: (formData.get("music_key") as string) || null,
    status: (formData.get("status") as string) || "draft",
    featured: formData.get("featured") === "on",
    cover_url: (formData.get("cover_url") as string) || null,
    description: (formData.get("description") as string) || null,
    base_price_cents: Math.round(Number(formData.get("base_price") || 29) * 100),
    tags: ((formData.get("tags") as string) || "").split(",").map(s=>s.trim()).filter(Boolean),
  };

  const preview = formData.get("preview_file") as File | null;
  const master  = formData.get("master_file") as File | null;
  if (preview && preview.size) row.preview_path = await uploadFile("previews", preview, "preview");
  if (master && master.size)  row.download_path = await uploadFile("masters", master, "master");

  if (id) {
    await admin.from("products").update(row).eq("id", id);
  } else {
    row.slug = slugify(title);
    await admin.from("products").insert(row);
  }
  revalidatePath("/admin"); revalidatePath("/");
  redirect("/admin");
}

export async function deleteBeat(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  await admin.from("products").delete().eq("id", formData.get("id") as string);
  revalidatePath("/admin"); revalidatePath("/");
}

export async function setStatus(formData: FormData) {
  await guard();
  const admin = createAdminClient();
  await admin.from("products").update({ status: formData.get("status") }).eq("id", formData.get("id"));
  revalidatePath("/admin"); revalidatePath("/");
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}
