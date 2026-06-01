"use client";
import Link from "next/link";
import { useRef } from "react";
import { useStore } from "@/app/store";
import { euro } from "@/lib/format";
import type { Beat, LicenseTier } from "@/lib/types";

type ClientBeat = Beat & { previewUrl: string|null; coverUrl: string|null };

export default function BeatCard({ beat, fromCents, delay }: { beat: ClientBeat; fromCents: number; delay: number }) {
  const { play } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const sold = beat.status === "sold";

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el || window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const r = el.getBoundingClientRect(); const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
    el.style.transform = `translateY(-8px) rotateX(${(.5-py)*12}deg) rotateY(${(px-.5)*12}deg)`;
    const g = el.querySelector(".glare") as HTMLElement|null;
    if (g){ g.style.setProperty("--gx",px*100+"%"); g.style.setProperty("--gy",py*100+"%"); }
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };

  const cover = beat.coverUrl ? `url('${beat.coverUrl}') center/cover` : `radial-gradient(circle at 30% 25%, var(--v-vivid)55, transparent 55%), linear-gradient(150deg, var(--v-deep), var(--bg-0))`;

  return (
    <div className="card reveal" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transitionDelay:`${delay}s` }}>
      <div className="card-art">
        {sold ? <span className="badge sold">Exclusive · sold</span> : beat.featured ? <span className="badge">Featured</span> : null}
        <div className="cover" style={{ background: cover }} />
        {!sold && beat.previewUrl &&
          <div className="play" onClick={()=>play({ id:beat.id, title:beat.title, meta:`${beat.bpm??""} BPM · ${beat.music_key??""} · ${beat.genre??""}`, coverUrl:beat.coverUrl, previewUrl:beat.previewUrl })}>
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>}
        <div className="glare" />
      </div>
      <Link href={`/product/${beat.slug}`} style={{ textDecoration:"none", color:"inherit" }}>
        <div className="card-body">
          <div className="card-title">{beat.title}</div>
          <div className="card-meta"><span>{beat.bpm} BPM</span><span>{beat.music_key}</span><span>{beat.genre}</span></div>
          <div className="card-foot">
            {sold ? <span className="price" style={{color:"var(--tx-faint)"}}>No longer available</span>
                  : <span className="price">from <b>{euro(fromCents)}</b></span>}
          </div>
        </div>
      </Link>
    </div>
  );
}
