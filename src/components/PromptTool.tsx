"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/app/store";

type Lang = "EN" | "FR";
type Mode = "Style" | "Détaillé";
type Kind = "Sample" | "Instru" | "Son complet";

const KINDS: Kind[] = ["Sample", "Instru", "Son complet"];
const GENRES = ["Hip-Hop", "Trap", "Drill", "R&B", "Soul", "Jazz", "Funk", "Gospel", "Lo-Fi", "Cinématique", "Afrobeat", "Ambient", "Phonk", "Boom bap"];
const SUBGENRES: Record<string, string[]> = {
  "Hip-Hop": ["Boom bap", "Jazz-rap", "Cloud", "East coast", "West coast", "Abstract"],
  "Trap": ["Mélodique", "Dark", "Orchestral", "Plugg", "Rage", "Ambient trap"],
  "Drill": ["UK drill", "NY drill", "Bronx", "Sample drill", "Jersey"],
  "R&B": ["Alt R&B", "Neo-soul", "90s R&B", "PBR&B", "Trap soul"],
  "Soul": ["Classic soul", "Psych soul", "Northern soul", "Southern soul"],
  "Jazz": ["Modal", "Bebop", "Spiritual", "Fusion", "Nu-jazz"],
  "Funk": ["P-funk", "Jazz-funk", "Disco-funk", "Boogie"],
  "Gospel": ["Choir", "Hammond gospel", "Contemporary"],
  "Lo-Fi": ["Tape loops", "Chillhop", "Dusty", "Jazzhop"],
  "Cinématique": ["Score", "Dark ambient score", "Neo-classical", "Trailer"],
  "Afrobeat": ["Afro highlife", "Afro-soul", "Amapiano-tinged"],
  "Ambient": ["Drone", "Textural", "Dark ambient"],
  "Phonk": ["Drift phonk", "Memphis", "House phonk"],
  "Boom bap": ["Dusty", "Jazzy", "Hardcore", "Lo-fi"],
};
const MOODS = ["Mélancolique", "Chaud", "Sombre", "Euphorique", "Nostalgique", "Mystérieux", "Rêveur", "Dramatique", "Groovy", "Éthéré", "Tendu", "Apaisant", "Agressif", "Introspectif", "Triomphant", "Paranoïaque", "Hypnotique", "Cosmique"];
const ERAS = ["60s", "70s", "80s", "90s", "00s", "2010s", "Intemporel"];
const FEELS = ["Normal", "Half-time", "Double-time", "Triolet / shuffle", "Swing"];
const INSTR = ["Rhodes", "Wurlitzer", "Hammond B3", "Piano acoustique", "Piano upright", "Clavinet", "Cordes", "Flûte", "Saxophone", "Trompette muted", "Vibraphone", "Guitare clean", "Guitare wah", "Guitare acoustique", "Basse funk", "Contrebasse", "Harpe", "Mellotron", "Moog", "Celesta", "Marimba", "Koto", "Sitar", "808 slide", "808 sub", "Pad sombre", "Pad éthéré", "Bells", "Choir pad", "Orgue", "Glockenspiel", "Xylophone", "French horn", "Hautbois", "Clarinette", "Synthé analogique", "Arp"];
const VOCALS = ["Aucune", "Chops soul", "Lead féminin", "Lead masculin", "Chœur / Gospel", "Ad-libs", "Spoken / parlé", "Vocoder / texture", "Humming"];
const DRUMS = ["Dusty / swung", "Boom bap punchy", "Hard trap", "Live / organique", "Programmées serrées", "Lo-fi cassées", "Minimales", "Breakbeat"];
const EXCL = ["Pas de drums", "Pas de voix", "Pas de basse", "Pas de synthé", "Pas de guitare", "Pas de piano", "Pas de cuivres"];
const STRUCT = ["Boucle propre", "Choppable", "One-shots isolés", "Progression riche", "Intro + montée + drop", "Breakdown / pont"];
const DURS = ["Boucle 8 mesures", "30 s", "1 min", "2 min", "Morceau complet"];
const KEYS = ["—", "C min", "C# min", "D min", "D# min", "E min", "F min", "F# min", "G min", "G# min", "A min", "A# min", "B min", "C maj", "D maj", "E maj", "F maj", "G maj", "A maj"];

// EN translations for prompt output
const TR: Record<string, string> = {
  "Sample": "sample", "Instru": "instrumental", "Son complet": "full track",
  "Cinématique": "cinematic", "Boom bap": "boom bap", "Phonk": "phonk",
  "Mélancolique": "melancholic", "Chaud": "warm", "Sombre": "dark", "Euphorique": "euphoric",
  "Nostalgique": "nostalgic", "Mystérieux": "mysterious", "Rêveur": "dreamy", "Dramatique": "dramatic", "Groovy": "groovy",
  "Éthéré": "ethereal", "Tendu": "tense", "Apaisant": "soothing", "Agressif": "aggressive", "Introspectif": "introspective",
  "Triomphant": "triumphant", "Paranoïaque": "paranoid", "Hypnotique": "hypnotic", "Cosmique": "cosmic", "Intemporel": "timeless",
  "Normal": "", "Half-time": "half-time feel", "Double-time": "double-time feel", "Triolet / shuffle": "triplet shuffle groove", "Swing": "swung groove",
  "Rhodes": "Rhodes", "Wurlitzer": "Wurlitzer", "Hammond B3": "Hammond B3 organ", "Piano acoustique": "grand piano",
  "Piano upright": "upright piano", "Clavinet": "clavinet", "Cordes": "string section", "Flûte": "flute", "Saxophone": "saxophone",
  "Trompette muted": "muted trumpet", "Vibraphone": "vibraphone", "Guitare clean": "clean electric guitar", "Guitare wah": "wah guitar",
  "Guitare acoustique": "acoustic guitar", "Basse funk": "funky bass", "Contrebasse": "upright bass", "Harpe": "harp",
  "Mellotron": "mellotron", "Moog": "Moog synth", "Celesta": "celesta", "Marimba": "marimba", "Koto": "koto", "Sitar": "sitar",
  "808 slide": "sliding 808", "808 sub": "sub 808", "Pad sombre": "dark pad", "Pad éthéré": "ethereal pad", "Bells": "bells",
  "Choir pad": "choir pad", "Orgue": "organ", "Glockenspiel": "glockenspiel", "Xylophone": "xylophone", "French horn": "french horn",
  "Hautbois": "oboe", "Clarinette": "clarinet", "Synthé analogique": "analog synth", "Arp": "arpeggiated synth",
  "Aucune": "", "Chops soul": "chopped soul vocal samples", "Lead féminin": "female lead vocal", "Lead masculin": "male lead vocal",
  "Chœur / Gospel": "gospel choir", "Ad-libs": "vocal ad-libs", "Spoken / parlé": "spoken word", "Vocoder / texture": "vocoder vocal texture", "Humming": "soft humming",
  "Dusty / swung": "dusty swung drums", "Boom bap punchy": "punchy boom bap drums", "Hard trap": "hard-hitting trap drums",
  "Live / organique": "live organic drums", "Programmées serrées": "tight programmed drums", "Lo-fi cassées": "broken lo-fi drums",
  "Minimales": "minimal drums", "Breakbeat": "breakbeat drums",
  "Pas de drums": "drums", "Pas de voix": "vocals", "Pas de basse": "bass", "Pas de synthé": "synths", "Pas de guitare": "guitar", "Pas de piano": "piano", "Pas de cuivres": "brass",
  "Boucle propre": "loopable clean structure", "Choppable": "chop-friendly arrangement", "One-shots isolés": "isolated one-shot hits",
  "Progression riche": "rich evolving progression", "Intro + montée + drop": "intro, build-up and drop", "Breakdown / pont": "breakdown and bridge",
  "Boucle 8 mesures": "8-bar loop", "30 s": "around 30 seconds", "1 min": "around 1 minute", "2 min": "around 2 minutes", "Morceau complet": "full-length arrangement",
};
const en = (s: string) => (TR[s] !== undefined ? TR[s] : s.toLowerCase());
const lc = (s: string) => s.toLowerCase();

// ── Presets (signatures) : load a full coherent config in one click ──
interface Cfg {
  kind: Kind; genre: string; sub: string; moods: string[]; era: string; feel: string;
  instr: string[]; vocals: string; drums: string; excl: string[]; struct: string[];
  dur: string; musicKey: string; bpm: number;
  warmth: number; vinyl: number; harm: number; reverb: number; bright: number; weight: number;
}
const PRESETS: { n: string; c: Partial<Cfg> }[] = [
  { n: "Boom bap poussiéreux", c: { kind: "Sample", genre: "Boom bap", sub: "Dusty", moods: ["Mélancolique", "Nostalgique"], era: "90s", feel: "Swing", instr: ["Rhodes", "Saxophone", "Contrebasse"], vocals: "Chops soul", drums: "Dusty / swung", struct: ["Choppable"], dur: "Boucle 8 mesures", bpm: 88, warmth: 84, vinyl: 80, harm: 60, reverb: 46, bright: 38, weight: 56 } },
  { n: "Trap mélodique sombre", c: { kind: "Instru", genre: "Trap", sub: "Mélodique", moods: ["Sombre", "Mélancolique"], era: "Intemporel", feel: "Half-time", instr: ["Pad sombre", "Bells", "808 slide", "Piano upright"], vocals: "Aucune", drums: "Hard trap", struct: ["Intro + montée + drop"], dur: "2 min", bpm: 140, warmth: 52, vinyl: 30, harm: 50, reverb: 60, bright: 55, weight: 78 } },
  { n: "Neo-soul chaleureux", c: { kind: "Instru", genre: "R&B", sub: "Neo-soul", moods: ["Chaud", "Rêveur"], era: "00s", feel: "Swing", instr: ["Rhodes", "Basse funk", "Guitare clean", "Cordes"], vocals: "Humming", drums: "Live / organique", struct: ["Progression riche"], dur: "Morceau complet", bpm: 78, warmth: 80, vinyl: 40, harm: 82, reverb: 50, bright: 58, weight: 60 } },
  { n: "Score cinématique cosmique", c: { kind: "Son complet", genre: "Cinématique", sub: "Dark ambient score", moods: ["Cosmique", "Dramatique"], era: "Intemporel", feel: "Normal", instr: ["Cordes", "Pad éthéré", "Piano acoustique", "Choir pad"], vocals: "Chœur / Gospel", drums: "Minimales", excl: [], struct: ["Intro + montée + drop", "Breakdown / pont"], dur: "2 min", bpm: 70, warmth: 58, vinyl: 22, harm: 78, reverb: 82, bright: 50, weight: 64 } },
  { n: "Lo-fi tape nostalgique", c: { kind: "Instru", genre: "Lo-Fi", sub: "Tape loops", moods: ["Nostalgique", "Apaisant"], era: "Intemporel", feel: "Swing", instr: ["Piano upright", "Vibraphone", "Contrebasse"], vocals: "Aucune", drums: "Lo-fi cassées", struct: ["Boucle propre"], dur: "1 min", bpm: 72, warmth: 88, vinyl: 90, harm: 56, reverb: 52, bright: 30, weight: 48 } },
  { n: "UK Drill tendu", c: { kind: "Instru", genre: "Drill", sub: "UK drill", moods: ["Sombre", "Tendu"], era: "Intemporel", feel: "Half-time", instr: ["Cordes", "Pad sombre", "808 slide", "Bells"], vocals: "Aucune", drums: "Hard trap", struct: ["Intro + montée + drop"], dur: "2 min", bpm: 142, warmth: 44, vinyl: 24, harm: 46, reverb: 48, bright: 60, weight: 80 } },
  { n: "Spiritual jazz éthéré", c: { kind: "Sample", genre: "Jazz", sub: "Spiritual", moods: ["Éthéré", "Introspectif"], era: "70s", feel: "Triolet / shuffle", instr: ["Piano acoustique", "Saxophone", "Contrebasse", "Harpe"], vocals: "Aucune", drums: "Live / organique", struct: ["Choppable", "Progression riche"], dur: "1 min", bpm: 96, warmth: 76, vinyl: 64, harm: 88, reverb: 58, bright: 48, weight: 52 } },
  { n: "Phonk hypnotique", c: { kind: "Instru", genre: "Phonk", sub: "Drift phonk", moods: ["Hypnotique", "Agressif"], era: "Intemporel", feel: "Half-time", instr: ["Bells", "808 sub", "Orgue"], vocals: "Vocoder / texture", drums: "Hard trap", struct: ["Boucle propre"], dur: "1 min", bpm: 130, warmth: 50, vinyl: 60, harm: 40, reverb: 44, bright: 52, weight: 82 } },
];

const FALLBACK: Cfg = {
  kind: "Sample", genre: "", sub: "", moods: [], era: "Intemporel", feel: "Normal",
  instr: [], vocals: "Aucune", drums: "Dusty / swung", excl: [], struct: [],
  dur: "Boucle 8 mesures", musicKey: "—", bpm: 85,
  warmth: 70, vinyl: 55, harm: 55, reverb: 45, bright: 50, weight: 55,
};

const LS_LAST = "lisiere_suno_last";
const LS_SAVED = "lisiere_suno_presets";

export default function PromptTool() {
  const { genOpen, setGenOpen } = useStore();

  const [lang, setLang] = useState<Lang>("FR");
  const [mode, setMode] = useState<Mode>("Style");
  const [kind, setKind] = useState<Kind>(FALLBACK.kind);
  const [genre, setGenre] = useState(FALLBACK.genre);
  const [sub, setSub] = useState(FALLBACK.sub);
  const [moods, setMoods] = useState<string[]>(FALLBACK.moods);
  const [era, setEra] = useState(FALLBACK.era);
  const [feel, setFeel] = useState(FALLBACK.feel);
  const [instr, setInstr] = useState<string[]>(FALLBACK.instr);
  const [vocals, setVocals] = useState(FALLBACK.vocals);
  const [drums, setDrums] = useState(FALLBACK.drums);
  const [excl, setExcl] = useState<string[]>(FALLBACK.excl);
  const [struct, setStruct] = useState<string[]>(FALLBACK.struct);
  const [dur, setDur] = useState(FALLBACK.dur);
  const [musicKey, setMusicKey] = useState(FALLBACK.musicKey);
  const [bpm, setBpm] = useState(FALLBACK.bpm);
  const [warmth, setWarmth] = useState(FALLBACK.warmth);
  const [vinyl, setVinyl] = useState(FALLBACK.vinyl);
  const [harm, setHarm] = useState(FALLBACK.harm);
  const [reverb, setReverb] = useState(FALLBACK.reverb);
  const [bright, setBright] = useState(FALLBACK.bright);
  const [weight, setWeight] = useState(FALLBACK.weight);

  const [seed, setSeed] = useState(0);
  const [manual, setManual] = useState<string | null>(null); // null = use generated
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<{ n: string; c: Cfg }[]>([]);
  const [saveName, setSaveName] = useState("");
  const restored = useRef(false);

  const noDrums = excl.includes("Pas de drums");
  const noVox = excl.includes("Pas de voix");

  const collect = (): Cfg => ({ kind, genre, sub, moods, era, feel, instr, vocals, drums, excl, struct, dur, musicKey, bpm, warmth, vinyl, harm, reverb, bright, weight });
  const apply = (c: Partial<Cfg>) => {
    const f = { ...FALLBACK, ...c };
    setKind(f.kind); setGenre(f.genre); setSub(f.sub); setMoods(f.moods); setEra(f.era); setFeel(f.feel);
    setInstr(f.instr); setVocals(f.vocals); setDrums(f.drums); setExcl(f.excl); setStruct(f.struct);
    setDur(f.dur); setMusicKey(f.musicKey); setBpm(f.bpm);
    setWarmth(f.warmth); setVinyl(f.vinyl); setHarm(f.harm); setReverb(f.reverb); setBright(f.bright); setWeight(f.weight);
    setManual(null);
  };

  // restore last session + saved presets
  useEffect(() => {
    try { const s = localStorage.getItem(LS_LAST); if (s) apply(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(LS_SAVED); if (s) setSaved(JSON.parse(s)); } catch {}
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist current config
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(LS_LAST, JSON.stringify(collect())); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, genre, sub, moods, era, feel, instr, vocals, drums, excl, struct, dur, musicKey, bpm, warmth, vinyl, harm, reverb, bright, weight]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string, max = 99) => {
    setManual(null);
    if (arr.includes(v)) set(arr.filter((a) => a !== v));
    else if (arr.length < max) set([...arr, v]);
  };
  // wrap setters so any change drops a manual edit (keeps output in sync)
  const w = <T,>(set: (v: T) => void) => (v: T) => { setManual(null); set(v); };

  const auto = useMemo(() => {
    const pick = <T,>(a: T[]) => a[(seed + a.length) % a.length];
    const T2 = (s: string) => (lang === "EN" ? en(s) : lc(s));

    const g = genre ? T2(genre) : (lang === "EN" ? "beat" : "instru");
    const sg = sub ? lc(sub) : "";
    const k = T2(kind);
    const eraTxt = era && era !== "Intemporel" ? `${era}` : (lang === "EN" ? "timeless" : "intemporel");
    const feelTxt = feel && feel !== "Normal" ? T2(feel) : "";
    const moodTxt = moods.map(T2).filter(Boolean);
    const insts = instr.map(T2).filter(Boolean);
    const vox = !noVox && vocals !== "Aucune" ? T2(vocals) : "";
    const dr = !noDrums ? T2(drums) : "";
    const st = struct.map(T2).filter(Boolean);
    const exc = excl.map(T2).filter(Boolean);
    const durTxt = T2(dur);
    const keyTxt = musicKey !== "—" ? musicKey : "";

    // slider descriptors (skip the neutral mid value to stay concise & precise)
    const warmW = warmth < 34 ? (lang === "EN" ? "crisp clean tone" : "son net et clair") : warmth > 66 ? (lang === "EN" ? "deep tape-saturated warmth" : "chaleur de bande saturée") : "";
    const vinW = vinyl < 25 ? (lang === "EN" ? "pristine" : "propre") : vinyl > 60 ? (lang === "EN" ? "dusty vinyl crackle" : "vinyle poussiéreux") : "";
    const harmW = harm > 66 ? (lang === "EN" ? "lush jazz harmony" : "harmonie jazz riche") : harm < 34 ? (lang === "EN" ? "simple harmony" : "harmonie simple") : "";
    const revW = reverb > 66 ? (lang === "EN" ? "wide cavernous reverb" : "réverbe large et caverneuse") : reverb < 25 ? (lang === "EN" ? "dry and intimate" : "sec et intime") : "";
    const briW = bright > 66 ? (lang === "EN" ? "bright airy highs" : "aigus aériens") : bright < 34 ? (lang === "EN" ? "muffled dark tone" : "tonalité feutrée") : "";
    const wgtW = weight > 66 ? (lang === "EN" ? "heavy low-end" : "bas du spectre lourd") : weight < 34 ? (lang === "EN" ? "light low-end" : "bas léger") : "";
    const sliderWords = [warmW, vinW, harmW, revW, briW, wgtW].filter(Boolean);

    const signature = lang === "EN"
      ? pick(["dark, melancholic, faintly cosmic", "nocturnal and cinematic", "spacious, emotional and detailed"])
      : pick(["sombre, mélancolique, légèrement cosmique", "nocturne et cinématique", "spacieux, émotionnel et détaillé"]);

    if (mode === "Style") {
      // Compact, comma-separated tag list — ideal for Suno's Style field
      const parts: string[] = [];
      parts.push(`${eraTxt} ${g}${sg ? " " + sg : ""} ${k}`.replace(/\s+/g, " ").trim());
      if (moodTxt.length) parts.push(moodTxt.join(" "));
      if (feelTxt) parts.push(feelTxt);
      if (insts.length) parts.push(insts.join(", "));
      if (vox) parts.push(vox);
      if (dr) parts.push(dr);
      sliderWords.forEach((s) => parts.push(s));
      parts.push(`${bpm} BPM`);
      if (keyTxt) parts.push(keyTxt);
      parts.push(signature);
      if (st.length) parts.push(st.join(", "));
      let out = parts.filter(Boolean).join(", ");
      if (exc.length) out += lang === "EN" ? ` — no ${exc.join(", no ")}` : ` — sans ${exc.join(", sans ")}`;
      return out.replace(/\s+,/g, ",").replace(/,\s*,/g, ", ").trim();
    }

    // Detailed prose
    if (lang === "EN") {
      let p = `A ${eraTxt} ${g}${sg ? " (" + sg + ")" : ""} ${k}, ${moodTxt.join(" and ") || "moody"} and cinematic`;
      p += feelTxt ? `, with a ${feelTxt}. ` : ". ";
      if (insts.length) p += `Built around ${insts.join(", ")}. `;
      if (vox) p += `Featuring ${vox}. `;
      if (dr) p += `${dr.charAt(0).toUpperCase() + dr.slice(1)}. `;
      if (sliderWords.length) p += `${sliderWords.join("; ")}. `;
      p += `Tempo around ${bpm} BPM${keyTxt ? `, in ${keyTxt}` : ""}; ${durTxt}. `;
      if (st.length) p += `${st.join(", ")}. `;
      p += `${signature.charAt(0).toUpperCase() + signature.slice(1)} atmosphere, sample-ready with a clean low end and dynamic movement. `;
      if (exc.length) p += `Strictly no ${exc.join(", no ")}.`;
      return p.replace(/\s+/g, " ").trim();
    } else {
      let p = `Un ${k} ${g}${sg ? " (" + sg + ")" : ""}, ambiance ${eraTxt} — ${moodTxt.join(" et ") || "atmosphérique"} et cinématique`;
      p += feelTxt ? `, en ${feelTxt}. ` : ". ";
      if (insts.length) p += `Construit autour de : ${insts.join(", ")}. `;
      if (vox) p += `Avec ${vox}. `;
      if (dr) p += `${dr.charAt(0).toUpperCase() + dr.slice(1)}. `;
      if (sliderWords.length) p += `${sliderWords.join(" ; ")}. `;
      p += `Tempo autour de ${bpm} BPM${keyTxt ? `, en ${keyTxt}` : ""} ; ${durTxt}. `;
      if (st.length) p += `${st.join(", ")}. `;
      p += `Atmosphère ${signature}, prête à sampler, bas du spectre propre et mouvement dynamique. `;
      if (exc.length) p += `Surtout pas de : ${exc.join(", ")}.`;
      return p.replace(/\s+/g, " ").trim();
    }
  }, [lang, mode, kind, genre, sub, moods, era, feel, instr, vocals, drums, excl, struct, dur, musicKey, bpm, warmth, vinyl, harm, reverb, bright, weight, seed, noDrums, noVox]);

  const output = manual ?? auto;

  const copy = async () => { try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  const reset = () => { apply(FALLBACK); setSeed(0); };
  const variation = () => { setManual(null); setSeed((s) => s + 1); };

  const savePreset = () => {
    const n = saveName.trim(); if (!n) return;
    const next = [...saved.filter((p) => p.n !== n), { n, c: collect() }];
    setSaved(next); setSaveName("");
    try { localStorage.setItem(LS_SAVED, JSON.stringify(next)); } catch {}
  };
  const delPreset = (n: string) => {
    const next = saved.filter((p) => p.n !== n);
    setSaved(next);
    try { localStorage.setItem(LS_SAVED, JSON.stringify(next)); } catch {}
  };

  const close = () => setGenOpen(false);

  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`gchip ${on ? "on" : ""}`}>{children}</button>
  );
  const Slider = ({ label, v, set, min = 0, max = 100, suffix = "%" }: { label: string; v: number; set: (n: number) => void; min?: number; max?: number; suffix?: string }) => (
    <div className="gslider"><div className="gslider-h"><span>{label}</span><b>{v}{suffix}</b></div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(+e.target.value)} /></div>
  );

  if (!genOpen) return null;

  return (
    <div className="gen-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="gen-panel">
        <div className="gen-top">
          <div>
            <div className="eyebrow">Outil beatmaker — Lisière Studio</div>
            <h2 className="display" style={{ fontSize: "1.9rem" }}>Générateur de prompts <em className="text-violet">Suno</em></h2>
          </div>
          <button className="x" onClick={close} aria-label="Fermer">×</button>
        </div>

        <div className="gen-body">
          <div className="gen-left">
            <div className="gsec">
              <div className="label">Signatures <span style={{ color: "var(--tx-faint)" }}>(1 clic = config complète)</span></div>
              <div className="grow">
                {PRESETS.map((p) => <Chip key={p.n} on={false} onClick={() => apply(p.c)}>{p.n}</Chip>)}
              </div>
            </div>

            {saved.length > 0 && (
              <div className="gsec">
                <div className="label">Mes réglages</div>
                <div className="grow">
                  {saved.map((p) => (
                    <span key={p.n} className="gsaved">
                      <button type="button" className="gchip" onClick={() => apply(p.c)}>{p.n}</button>
                      <button type="button" className="gsaved-x" onClick={() => delPreset(p.n)} aria-label="Supprimer">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="gsec"><div className="label">Type</div><div className="grow">
              {KINDS.map((k) => <Chip key={k} on={kind === k} onClick={() => w(setKind)(k)}>{k}</Chip>)}
            </div></div>

            <div className="gsec"><div className="label">Genre</div><div className="grow">
              {GENRES.map((g) => <Chip key={g} on={genre === g} onClick={() => { setManual(null); setGenre(genre === g ? "" : g); setSub(""); }}>{g}</Chip>)}
            </div></div>

            {genre && SUBGENRES[genre] && <div className="gsec"><div className="label">Sous-genre / influence</div><div className="grow">
              {SUBGENRES[genre].map((s) => <Chip key={s} on={sub === s} onClick={() => { setManual(null); setSub(sub === s ? "" : s); }}>{s}</Chip>)}
            </div></div>}

            <div className="gsec"><div className="label">Mood <span style={{ color: "var(--tx-faint)" }}>(max 3)</span></div><div className="grow">
              {MOODS.map((m) => <Chip key={m} on={moods.includes(m)} onClick={() => toggle(moods, setMoods, m, 3)}>{m}</Chip>)}
            </div></div>

            <div className="gtwo">
              <div className="gsec"><div className="label">Époque</div><div className="grow">
                {ERAS.map((e) => <Chip key={e} on={era === e} onClick={() => w(setEra)(e)}>{e}</Chip>)}
              </div></div>
              <div className="gsec"><div className="label">Groove / Feel</div><div className="grow">
                {FEELS.map((f) => <Chip key={f} on={feel === f} onClick={() => w(setFeel)(f)}>{f}</Chip>)}
              </div></div>
            </div>

            <div className="gsec"><div className="label">Instruments</div><div className="grow">
              {INSTR.map((i) => <Chip key={i} on={instr.includes(i)} onClick={() => toggle(instr, setInstr, i)}>{i}</Chip>)}
            </div></div>

            <div className="gtwo">
              <div className="gsec"><div className="label">Voix {noVox && <span style={{ color: "var(--tx-faint)" }}>(exclues)</span>}</div><div className="grow">
                {VOCALS.map((v) => <Chip key={v} on={vocals === v} onClick={() => w(setVocals)(v)}>{v}</Chip>)}
              </div></div>
              <div className="gsec"><div className="label">Batterie {noDrums && <span style={{ color: "var(--tx-faint)" }}>(exclue)</span>}</div><div className="grow">
                {DRUMS.map((d) => <Chip key={d} on={drums === d} onClick={() => w(setDrums)(d)}>{d}</Chip>)}
              </div></div>
            </div>

            <div className="gtwo">
              <div className="gsec"><div className="label">Exclusions</div><div className="grow">
                {EXCL.map((e) => <Chip key={e} on={excl.includes(e)} onClick={() => toggle(excl, setExcl, e)}>{e}</Chip>)}
              </div></div>
              <div className="gsec"><div className="label">Structure</div><div className="grow">
                {STRUCT.map((s) => <Chip key={s} on={struct.includes(s)} onClick={() => toggle(struct, setStruct, s)}>{s}</Chip>)}
              </div></div>
            </div>

            <div className="gsec"><div className="label">Durée visée</div><div className="grow">
              {DURS.map((d) => <Chip key={d} on={dur === d} onClick={() => w(setDur)(d)}>{d}</Chip>)}
            </div></div>

            <div className="gsec"><div className="label">Paramètres sonores</div>
              <div className="gtwo">
                <Slider label="Chaleur" v={warmth} set={w(setWarmth)} />
                <Slider label="Texture vinyle" v={vinyl} set={w(setVinyl)} />
                <Slider label="Complexité harmonique" v={harm} set={w(setHarm)} />
                <Slider label="Reverb / Espace" v={reverb} set={w(setReverb)} />
                <Slider label="Brillance" v={bright} set={w(setBright)} />
                <Slider label="Poids du bas" v={weight} set={w(setWeight)} />
              </div>
              <Slider label="BPM" v={bpm} set={w(setBpm)} min={50} max={200} suffix="" />
              <div className="gslider"><div className="gslider-h"><span>Tonalité</span></div>
                <select value={musicKey} onChange={(e) => w(setMusicKey)(e.target.value)}>{KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
            </div>
          </div>

          <div className="gen-right">
            <div className="gen-out-head">
              <div className="gseg">
                {(["Style", "Détaillé"] as Mode[]).map((m) => <button key={m} className={mode === m ? "on" : ""} onClick={() => { setManual(null); setMode(m); }}>{m}</button>)}
              </div>
              <div className="glang">
                {(["FR", "EN"] as Lang[]).map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => { setManual(null); setLang(l); }}>{l}</button>)}
              </div>
            </div>
            <p className="ghint">{mode === "Style" ? "Compact — à coller dans le champ « Styles » de Suno." : "Description détaillée — pour briefer précisément le morceau."} Tu peux éditer le texte à la main.</p>
            <textarea className="gen-out" value={output} onChange={(e) => setManual(e.target.value)} spellCheck={false} />
            <div className="gen-out-foot">
              <span style={{ color: "var(--tx-faint)", fontSize: ".78rem" }}>{output.length} caractères{manual !== null ? " · édité" : ""}</span>
              <div className="gen-actions">
                <button className="gbtn" onClick={variation} title="Reformuler une variante">↻ Variante</button>
                <button className="gbtn" onClick={reset} title="Tout réinitialiser">Réinitialiser</button>
                <button className="btn btn-primary" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
              </div>
            </div>

            <div className="gsave">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nommer ce réglage…" onKeyDown={(e) => { if (e.key === "Enter") savePreset(); }} />
              <button className="gbtn" onClick={savePreset} disabled={!saveName.trim()}>Sauvegarder</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
