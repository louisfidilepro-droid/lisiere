"use client";
import { useMemo, useState } from "react";

type Lang = "EN" | "FR";
type Kind = "Sample" | "Instru" | "Son complet";

const GENRES = ["Hip-Hop", "Trap", "Drill", "R&B", "Soul", "Jazz", "Funk", "Gospel", "Lo-Fi", "Cinématique", "Afrobeat", "Ambient"];
const SUBGENRES: Record<string, string[]> = {
  "Hip-Hop": ["Boom bap", "Jazz-rap", "Cloud", "East coast", "West coast"],
  "Trap": ["Mélodique", "Dark", "Orchestral", "Plugg", "Rage"],
  "Drill": ["UK drill", "NY drill", "Bronx", "Sample drill"],
  "R&B": ["Alt R&B", "Neo-soul", "90s R&B", "PBR&B"],
  "Soul": ["Classic soul", "Psych soul", "Northern soul"],
  "Jazz": ["Modal", "Bebop", "Spiritual", "Fusion", "Nu-jazz"],
  "Funk": ["P-funk", "Jazz-funk", "Disco-funk"],
  "Gospel": ["Choir", "Hammond gospel", "Contemporary"],
  "Lo-Fi": ["Tape loops", "Chillhop", "Dusty"],
  "Cinématique": ["Score", "Dark ambient score", "Neo-classical"],
  "Afrobeat": ["Afro highlife", "Afro-soul", "Amapiano-tinged"],
  "Ambient": ["Drone", "Textural", "Dark ambient"],
};
const MOODS = ["Mélancolique", "Chaud", "Sombre", "Euphorique", "Nostalgique", "Mystérieux", "Rêveur", "Dramatique", "Groovy", "Éthéré", "Tendu", "Apaisant", "Agressif", "Introspectif", "Triomphant", "Paranoïaque"];
const ERAS = ["60s", "70s", "80s", "90s", "00s", "2010s", "Intemporel"];
const INSTR = ["Rhodes", "Wurlitzer", "Hammond B3", "Piano acoustique", "Piano upright", "Clavinet", "Cordes", "Flûte", "Saxophone", "Trompette muted", "Vibraphone", "Guitare clean", "Guitare wah", "Guitare acoustique", "Basse funk", "Contrebasse", "Harpe", "Mellotron", "Moog", "Celesta", "Marimba", "Koto", "Sitar", "808 slide", "808 sub", "Pad sombre", "Pad éthéré", "Bells", "Choir pad", "Orgue", "Glockenspiel", "Xylophone", "French horn", "Hautbois", "Clarinette"];
const EXCL = ["Pas de drums", "Pas de voix", "Pas de basse", "Pas de synthé", "Pas de guitare", "Pas de piano"];
const STRUCT = ["Boucle propre", "Choppable", "One-shots isolés", "Progression riche"];
const KEYS = ["—", "C min", "C# min", "D min", "D# min", "E min", "F min", "F# min", "G min", "G# min", "A min", "A# min", "B min", "C maj", "D maj", "E maj", "F maj", "G maj", "A maj"];

// EN translations for prompt output
const TR: Record<string, string> = {
  "Sample": "sample", "Instru": "instrumental", "Son complet": "full track",
  "Cinématique": "cinematic", "Mélancolique": "melancholic", "Chaud": "warm", "Sombre": "dark", "Euphorique": "euphoric",
  "Nostalgique": "nostalgic", "Mystérieux": "mysterious", "Rêveur": "dreamy", "Dramatique": "dramatic", "Groovy": "groovy",
  "Éthéré": "ethereal", "Tendu": "tense", "Apaisant": "soothing", "Agressif": "aggressive", "Introspectif": "introspective",
  "Triomphant": "triumphant", "Paranoïaque": "paranoid", "Intemporel": "timeless",
  "Rhodes": "Rhodes", "Wurlitzer": "Wurlitzer", "Hammond B3": "Hammond B3 organ", "Piano acoustique": "grand piano",
  "Piano upright": "upright piano", "Clavinet": "clavinet", "Cordes": "string section", "Flûte": "flute", "Saxophone": "saxophone",
  "Trompette muted": "muted trumpet", "Vibraphone": "vibraphone", "Guitare clean": "clean electric guitar", "Guitare wah": "wah guitar",
  "Guitare acoustique": "acoustic guitar", "Basse funk": "funky bass", "Contrebasse": "upright bass", "Harpe": "harp",
  "Mellotron": "mellotron", "Moog": "Moog synth", "Celesta": "celesta", "Marimba": "marimba", "Koto": "koto", "Sitar": "sitar",
  "808 slide": "sliding 808", "808 sub": "sub 808", "Pad sombre": "dark pad", "Pad éthéré": "ethereal pad", "Bells": "bells",
  "Choir pad": "choir pad", "Orgue": "organ", "Glockenspiel": "glockenspiel", "Xylophone": "xylophone", "French horn": "french horn",
  "Hautbois": "oboe", "Clarinette": "clarinet",
  "Pas de drums": "drums", "Pas de voix": "vocals", "Pas de basse": "bass", "Pas de synthé": "synths", "Pas de guitare": "guitar", "Pas de piano": "piano",
  "Boucle propre": "loopable clean structure", "Choppable": "chop-friendly arrangement", "One-shots isolés": "isolated one-shot hits", "Progression riche": "rich evolving progression",
};
const en = (s: string) => TR[s] || s.toLowerCase();

function scaleWord(v: number, lo: string, mid: string, hi: string) { return v < 34 ? lo : v < 67 ? mid : hi; }

export default function PromptTool() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("EN");
  const [kind, setKind] = useState<Kind>("Sample");
  const [genre, setGenre] = useState<string>("");
  const [sub, setSub] = useState<string>("");
  const [moods, setMoods] = useState<string[]>([]);
  const [era, setEra] = useState<string>("Intemporel");
  const [instr, setInstr] = useState<string[]>([]);
  const [excl, setExcl] = useState<string[]>([]);
  const [struct, setStruct] = useState<string[]>([]);
  const [musicKey, setMusicKey] = useState<string>("—");
  const [bpm, setBpm] = useState(85);
  const [warmth, setWarmth] = useState(70);
  const [vinyl, setVinyl] = useState(55);
  const [harm, setHarm] = useState(55);
  const [reverb, setReverb] = useState(45);
  const [copied, setCopied] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string, max = 99) => {
    if (arr.includes(v)) set(arr.filter((a) => a !== v));
    else if (arr.length < max) set([...arr, v]);
  };

  const prompt = useMemo(() => {
    const g = genre ? (lang === "EN" ? en(genre) : genre.toLowerCase()) : (lang === "EN" ? "beat" : "instru");
    const sg = sub ? (lang === "EN" ? sub.toLowerCase() : sub.toLowerCase()) : "";
    const k = lang === "EN" ? en(kind) : kind.toLowerCase();
    const mood = moods.map((m) => (lang === "EN" ? en(m) : m.toLowerCase())).join(lang === "EN" ? " and " : " et ");
    const insts = instr.map((i) => (lang === "EN" ? en(i) : i.toLowerCase()));
    const exc = excl.map((e) => (lang === "EN" ? en(e) : e.replace(/^Pas de /, "").toLowerCase()));
    const st = struct.map((s) => (lang === "EN" ? en(s) : s.toLowerCase()));
    const eraTxt = era && era !== "Intemporel" ? (lang === "EN" ? `${era} ` : `${era} `) : (lang === "EN" ? "timeless " : "intemporel ");

    const warmW = lang === "EN" ? scaleWord(warmth, "crisp, clean tone", "warm analog tone", "deep saturated, tape-driven warmth")
      : scaleWord(warmth, "son net et clair", "chaleur analogique", "saturation profonde, chaleur de bande");
    const vinW = lang === "EN" ? scaleWord(vinyl, "barely-there surface noise", "subtle vinyl crackle and hiss", "heavy dusty vinyl texture, crackle and wow-flutter")
      : scaleWord(vinyl, "souffle de surface discret", "léger craquement de vinyle", "grosse texture vinyle poussiéreuse, craquements");
    const harmW = lang === "EN" ? scaleWord(harm, "simple diatonic harmony", "soulful extended chords", "lush jazz harmony with tensions and smooth voice-leading")
      : scaleWord(harm, "harmonie diatonique simple", "accords étendus soul", "harmonie jazz riche, tensions et conduite de voix");
    const revW = lang === "EN" ? scaleWord(reverb, "dry, intimate, up-close", "natural room space", "wide cavernous reverb with long ambient tails")
      : scaleWord(reverb, "sec, intime, proche", "espace de pièce naturel", "réverbe large et caverneuse, longues traînées");

    if (lang === "EN") {
      let p = `A ${eraTxt}${g}${sg ? " (" + sg + ")" : ""} ${k}, ${mood || "moody"} and cinematic. `;
      if (insts.length) p += `Built around ${insts.join(", ")}. `;
      p += `${warmW}; ${vinW}; ${harmW}; ${revW}. `;
      p += `Tempo around ${bpm} BPM${musicKey !== "—" ? `, in ${musicKey}` : ""}. `;
      if (st.length) p += `${st.join(", ")}. `;
      p += `Dark, melancholic, slightly cosmic atmosphere — emotional, spacious and detailed, sample-ready with a clean low end and dynamic movement. `;
      if (exc.length) p += `Strictly no ${exc.join(", no ")}.`;
      return p.trim();
    } else {
      let p = `Un ${k} ${g}${sg ? " (" + sg + ")" : ""}, ambiance ${eraTxt}— ${mood || "atmosphérique"} et cinématique. `;
      if (insts.length) p += `Construit autour de : ${insts.join(", ")}. `;
      p += `${warmW} ; ${vinW} ; ${harmW} ; ${revW}. `;
      p += `Tempo autour de ${bpm} BPM${musicKey !== "—" ? `, en ${musicKey}` : ""}. `;
      if (st.length) p += `${st.join(", ")}. `;
      p += `Atmosphère sombre, mélancolique, légèrement cosmique — émotionnelle, spacieuse et détaillée, prête à sampler, bas du spectre propre et mouvement dynamique. `;
      if (exc.length) p += `Surtout pas de ${exc.join(", pas de ")}.`;
      return p.trim();
    }
  }, [lang, kind, genre, sub, moods, era, instr, excl, struct, musicKey, bpm, warmth, vinyl, harm, reverb]);

  const copy = async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };

  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`gchip ${on ? "on" : ""}`}>{children}</button>
  );
  const Slider = ({ label, v, set, min = 0, max = 100, suffix = "%" }: { label: string; v: number; set: (n: number) => void; min?: number; max?: number; suffix?: string }) => (
    <div className="gslider"><div className="gslider-h"><span>{label}</span><b>{v}{suffix}</b></div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(+e.target.value)} /></div>
  );

  return (
    <>
      <button className="gen-launch" onClick={() => setOpen(true)} aria-label="Générateur de prompts Suno">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l2.2 6.6L21 9l-5.5 4 2 7-5.5-4.2L6.5 20l2-7L3 9l6.8-.4z" fill="currentColor"/></svg>
        Prompt Suno
      </button>

      {open && (
        <div className="gen-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="gen-panel">
            <div className="gen-top">
              <div><div className="eyebrow">Outil beatmaker</div><h2 className="display" style={{ fontSize: "1.9rem" }}>Générateur de prompts <em className="text-violet">Suno</em></h2></div>
              <button className="x" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="gen-body">
              <div className="gen-left">
                <div className="gsec"><div className="label">Type</div><div className="grow">
                  {(["Sample", "Instru", "Son complet"] as Kind[]).map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{k}</Chip>)}
                </div></div>

                <div className="gsec"><div className="label">Genre</div><div className="grow">
                  {GENRES.map((g) => <Chip key={g} on={genre === g} onClick={() => { setGenre(g); setSub(""); }}>{g}</Chip>)}
                </div></div>

                {genre && SUBGENRES[genre] && <div className="gsec"><div className="label">Sous-genre / influence</div><div className="grow">
                  {SUBGENRES[genre].map((s) => <Chip key={s} on={sub === s} onClick={() => setSub(sub === s ? "" : s)}>{s}</Chip>)}
                </div></div>}

                <div className="gsec"><div className="label">Mood <span style={{ color: "var(--tx-faint)" }}>(max 2)</span></div><div className="grow">
                  {MOODS.map((m) => <Chip key={m} on={moods.includes(m)} onClick={() => toggle(moods, setMoods, m, 2)}>{m}</Chip>)}
                </div></div>

                <div className="gsec"><div className="label">Époque</div><div className="grow">
                  {ERAS.map((e) => <Chip key={e} on={era === e} onClick={() => setEra(e)}>{e}</Chip>)}
                </div></div>

                <div className="gsec"><div className="label">Instruments</div><div className="grow">
                  {INSTR.map((i) => <Chip key={i} on={instr.includes(i)} onClick={() => toggle(instr, setInstr, i)}>{i}</Chip>)}
                </div></div>

                <div className="gtwo">
                  <div className="gsec"><div className="label">Exclusions</div><div className="grow">
                    {EXCL.map((e) => <Chip key={e} on={excl.includes(e)} onClick={() => toggle(excl, setExcl, e)}>{e}</Chip>)}
                  </div></div>
                  <div className="gsec"><div className="label">Structure</div><div className="grow">
                    {STRUCT.map((s) => <Chip key={s} on={struct.includes(s)} onClick={() => toggle(struct, setStruct, s)}>{s}</Chip>)}
                  </div></div>
                </div>

                <div className="gsec"><div className="label">Paramètres sonores</div>
                  <Slider label="Chaleur / Warmth" v={warmth} set={setWarmth} />
                  <Slider label="Texture vinyle" v={vinyl} set={setVinyl} />
                  <Slider label="Complexité harmonique" v={harm} set={setHarm} />
                  <Slider label="Reverb / Espace" v={reverb} set={setReverb} />
                  <Slider label="BPM" v={bpm} set={setBpm} min={60} max={180} suffix="" />
                  <div className="gslider"><div className="gslider-h"><span>Tonalité</span></div>
                    <select value={musicKey} onChange={(e) => setMusicKey(e.target.value)}>{KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
                </div>
              </div>

              <div className="gen-right">
                <div className="gen-out-head">
                  <span className="label">Prompt généré</span>
                  <div className="glang">
                    {(["EN", "FR"] as Lang[]).map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l}</button>)}
                  </div>
                </div>
                <textarea className="gen-out" readOnly value={prompt} />
                <div className="gen-out-foot">
                  <span style={{ color: "var(--tx-faint)", fontSize: ".78rem" }}>{prompt.length} caractères</span>
                  <button className="btn btn-primary" onClick={copy}>{copied ? "Copié ✓" : "Copier le prompt"}</button>
                </div>
                <p style={{ color: "var(--tx-faint)", fontSize: ".76rem", marginTop: 12, lineHeight: 1.5 }}>
                  Colle-le dans Suno (champ « Style of Music » / prompt). Ajuste les curseurs pour affiner la matière.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
