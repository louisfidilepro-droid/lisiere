"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface VaultTrack {
  id: string; title: string; bpm: number | null; musicKey: string | null; genre: string | null;
  cover: string | null; stream: string | null; download: string | null; buy: string;
}

function fmt(s: number) { if (!isFinite(s) || s < 0) s = 0; return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"); }

export default function VaultPlayer({ title, fullQuality, tracks }: { title: string | null; fullQuality: boolean; tracks: VaultTrack[] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [idx, setIdx] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const cur_t = idx >= 0 ? tracks[idx] : null;

  useEffect(() => {
    const a = audio.current; if (!a || !cur_t?.stream) return;
    if (a.src !== cur_t.stream) a.src = cur_t.stream;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [idx, playing, cur_t]);

  const select = (i: number) => { if (i === idx) { setPlaying(p => !p); } else { setIdx(i); setPlaying(true); } };
  const next = () => { if (idx < tracks.length - 1) { setIdx(idx + 1); setPlaying(true); } else setPlaying(false); };
  const prev = () => { if (idx > 0) { setIdx(idx - 1); setPlaying(true); } };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => { const a = audio.current; if (a && dur) { a.currentTime = (+e.target.value / 100) * dur; } };

  return (
    <div className="vault">
      <audio ref={audio}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onEnded={next} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

      <header className="vault-head">
        <span className="vault-mark">LISIÈRE</span>
        <h1 className="vault-title">{title || "Sélection privée"}</h1>
        <p className="vault-sub">{tracks.length} morceau{tracks.length > 1 ? "x" : ""} · écoute privée{fullQuality ? " · qualité complète" : ""}</p>
      </header>

      <ol className="vault-list">
        {tracks.map((t, i) => (
          <li key={t.id} className={`vault-row ${i === idx ? "on" : ""}`}>
            <button className="vault-play" onClick={() => select(i)} aria-label="Lire">
              {i === idx && playing
                ? <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <div className="vault-cover" style={{ background: t.cover ? `url('${t.cover}') center/cover` : "linear-gradient(135deg,#222,#0c0c0c)" }} />
            <div className="vault-info">
              <span className="vault-name">{t.title}</span>
              <span className="vault-meta">{[t.bpm ? t.bpm + " BPM" : null, t.musicKey, t.genre].filter(Boolean).join(" · ")}</span>
            </div>
            <div className="vault-actions">
              {t.download && <a className="vault-btn" href={t.download} title="Télécharger">↓</a>}
              <Link className="vault-btn buy" href={t.buy}>Acheter</Link>
            </div>
          </li>
        ))}
      </ol>

      <footer className="vault-foot">Envoyé via Lisière — <Link href="/">lisière.com</Link></footer>

      {cur_t && (
        <div className="vault-bar">
          <div className="vault-bar-cover" style={{ background: cur_t.cover ? `url('${cur_t.cover}') center/cover` : "linear-gradient(135deg,#222,#0c0c0c)" }} />
          <div className="vault-bar-info"><b>{cur_t.title}</b><span>{[cur_t.bpm ? cur_t.bpm + " BPM" : null, cur_t.musicKey].filter(Boolean).join(" · ")}</span></div>
          <button className="vault-ctrl" onClick={prev} aria-label="Précédent"><svg viewBox="0 0 24 24"><path d="M7 6h2v12H7zM19 6l-9 6 9 6z" /></svg></button>
          <button className="vault-ctrl big" onClick={() => setPlaying(p => !p)} aria-label="Play/Pause">
            {playing ? <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
          </button>
          <button className="vault-ctrl" onClick={next} aria-label="Suivant"><svg viewBox="0 0 24 24"><path d="M15 6h2v12h-2zM5 6l9 6-9 6z" /></svg></button>
          <span className="vault-time">{fmt(cur)}</span>
          <input className="vault-seek" type="range" min={0} max={100} value={dur ? (cur / dur) * 100 : 0} onChange={seek} />
          <span className="vault-time">{fmt(dur)}</span>
        </div>
      )}
    </div>
  );
}
