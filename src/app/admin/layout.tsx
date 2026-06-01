import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // /admin/login is handled by its own page; this layout wraps it too, so allow when no user.
  const user = await getUser();
  // If logged in but not the admin email, block.
  if (user && !isAdmin(user.email)) {
    return <main className="page" style={{textAlign:"center"}}>
      <h1 className="display" style={{fontSize:"2rem"}}>Not authorised</h1>
      <p style={{color:"var(--tx-dim)"}}>This account is not the store admin.</p>
    </main>;
  }
  return <>{children}</>;
}
