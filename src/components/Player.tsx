"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "@/app/store";

function fmt(s: number){ if(!isFinite(s)||s<0)s=0; return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"); }

export default function Player() {
  const { now, isPlaying, togglePlay } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cur, setCur] = useState(0); const [dur, setDur] = useState(0);
  const waveRef = useRef<number[]>([]);

  // build a deterministic decorative waveform per track
  useEffect(() => {
    if (!now) return;
    let s = (now.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0) || 7) * 9301;
    const a: number[] = []; for (let i=0;i<120;i++){ s=(s*9301+49297)%233280; a.push(.18+(s/233280)*.82); }
    waveRef.current = a;
  }, [now]);

  // load + control audio
  useEffect(() => {
    const au = audioRef.current; if (!au || !now) return;
    if (now.previewUrl && au.src !== now.previewUrl) { au.src = now.previewUrl; }
  }, [now]);
  useEffect(() => {
    const au = audioRef.current; if (!au) return;
    if (isPlaying) au.play().catch(()=>{}); else au.pause();
  }, [isPlaying, now]);

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const r = c.getBoundingClientRect(); c.width = r.width*devicePixelRatio; c.height = r.height*devicePixelRatio;
    const w = c.width, h = c.height, wave = waveRef.current, n = wave.length || 1, bw = w/n;
    const prog = dur ? cur/dur : 0;
    ctx.clearRect(0,0,w,h);
    for (let i=0;i<n;i++){ const bh=wave[i]*h*.86, x=i*bw, y=(h-bh)/2;
      ctx.fillStyle = (i/n)<prog ? "#9d6bff" : "rgba(168,160,189,.32)"; ctx.fillRect(x,y,bw*.62,bh); }
  }, [cur, dur]);
  useEffect(() => { draw(); }, [draw, now]);

  const seek = (e: React.MouseEvent) => {
    const au = audioRef.current; const c = canvasRef.current; if (!au||!c||!dur) return;
    const r = c.getBoundingClientRect(); au.currentTime = ((e.clientX-r.left)/r.width)*dur;
  };

  return (
    <div className={`player ${now ? "up" : ""}`}>
      <audio ref={audioRef}
        onLoadedMetadata={e => setDur(e.currentTarget.duration)}
        onTimeUpdate={e => setCur(e.currentTarget.currentTime)}
        onEnded={() => togglePlay()} />
      <div className="player-in">
        <div className="pp-cover" style={{ background: now?.coverUrl ? `url('${now.coverUrl}') center/cover` : "linear-gradient(135deg,var(--v-deep),var(--bg-3))" }} />
        <div className="pp-info"><div className="t">{now?.title ?? "—"}</div><div className="m">{now?.meta ?? "—"}</div></div>
        <button className="pp-play" onClick={togglePlay} aria-label="Play/Pause">
          {isPlaying
            ? <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
            : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <div className="wave" onClick={seek}><canvas ref={canvasRef} /></div>
        <div className="pp-time">{fmt(cur)} / {fmt(dur)}</div>
      </div>
    </div>
  );
}
