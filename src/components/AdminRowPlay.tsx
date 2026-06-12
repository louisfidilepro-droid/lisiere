"use client";
import { useRef, useState } from "react";

export default function AdminRowPlay({ url }: { url: string | null }) {
  const a = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!url) return <span style={{ color: "var(--tx-faint)", fontSize: ".72rem" }}>—</span>;
  const toggle = () => { const el = a.current; if (!el) return; if (playing) el.pause(); else el.play().catch(() => {}); setPlaying(!playing); };
  return (
    <button type="button" className="a-act" onClick={toggle} title="Écouter le preview">
      {playing ? "❚❚" : "▶"}
      <audio ref={a} src={url} onEnded={() => setPlaying(false)} preload="none" />
    </button>
  );
}
