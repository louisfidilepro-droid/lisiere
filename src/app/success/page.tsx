import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let grants: { token: string; title: string }[] = [];
  let email = "";
  if (session_id) {
    const admin = createAdminClient();
    const { data: order } = await admin.from("orders").select("id, customer_email").eq("stripe_session_id", session_id).single();
    if (order) {
      email = order.customer_email ?? "";
      const { data: items } = await admin.from("order_items").select("id, product_id, products(title)").eq("order_id", order.id);
      for (const it of (items ?? []) as any[]) {
        const { data: g } = await admin.from("download_grants").select("token").eq("order_item_id", it.id).single();
        if (g) grants.push({ token: g.token, title: it.products?.title ?? "Beat" });
      }
    }
  }
  return (
    <main className="page" style={{textAlign:"center",maxWidth:680}}>
      <h1 className="display" style={{fontSize:"3.4rem",marginBottom:14}}>Thank you.</h1>
      <p style={{color:"var(--tx-dim)",marginBottom:30}}>
        Your order is confirmed{email?` — a copy was sent to ${email}`:""}. Your files are ready below
        (links expire in 7 days; create them again from your email if needed).
      </p>
      {grants.length>0 ? (
        <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:420,margin:"0 auto"}}>
          {grants.map(g=>(
            <div key={g.token} style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
              <a className="btn btn-primary" style={{flex:1,minWidth:200}} href={`/api/download/${g.token}`}>Download — {g.title}</a>
              <a className="btn btn-ghost" href={`/api/contract/${g.token}`} target="_blank">Licence (PDF)</a>
            </div>
          ))}
        </div>
      ) : (
        <p style={{color:"var(--tx-faint)"}}>Processing your order… refresh in a few seconds if links don't appear.</p>
      )}
      <div style={{marginTop:40}}><Link href="/" className="a-act">← Back to the store</Link></div>
    </main>
  );
}
