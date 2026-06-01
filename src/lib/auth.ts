import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
export function isAdmin(email: string | null | undefined) {
  const allowed = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  return !!email && email.toLowerCase().trim() === allowed;
}
