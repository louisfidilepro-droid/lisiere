"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr("");
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(error.message); setLoading(false); }
    else { router.push("/admin"); router.refresh(); }
  };
  return (
    <main className="page" style={{maxWidth:380,textAlign:"center"}}>
      <h1 className="display" style={{fontSize:"2.6rem",marginBottom:8}}>Studio access</h1>
      <p style={{color:"var(--tx-dim)",marginBottom:24,fontSize:".9rem"}}>Private. Sign in with your admin account.</p>
      <form onSubmit={submit} style={{textAlign:"left"}}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div className="field"><label>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} required /></div>
        {err && <p style={{color:"#ff8a8a",fontSize:".82rem",marginBottom:12}}>{err}</p>}
        <button className="btn btn-primary" style={{width:"100%"}} disabled={loading}>{loading?"…":"Enter"}</button>
      </form>
    </main>
  );
}
