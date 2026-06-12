// ════════════════════════════════════════════════════════════════════
//  AROM — données de la page /beats  (édite CE fichier, rien d'autre)
//
//  AJOUTER UN BEAT (≈30 s) : copie un bloc { … } dans `aromBeats`,
//  remplis-le, sauvegarde. Le plus récent en HAUT de la liste.
//
//  Champs d'un beat :
//   • title   : nom du beat en majuscules         → "GARDAV"
//   • bpm     : tempo (nombre)                     → 145
//   • youtube : lien YouTube (bouton « Écouter »)  → "https://youtu.be/XXXXXXXXXXX"
//   • buy     : lien BeatStars de la prod          → "https://www.beatstars.com/beat/XXXXXXX"
//   • cover   : (optionnel) URL d'image. Si absent, la miniature
//               YouTube est utilisée automatiquement.
// ════════════════════════════════════════════════════════════════════

export interface AromBeat {
  title: string;
  bpm: number;
  youtube: string;
  buy: string;
  cover?: string;
}

export const aromBeats: AromBeat[] = [
  {
    title: "GARDAV",
    bpm: 145,
    youtube: "https://youtu.be/PLACEHOLDER01",
    buy: "https://www.beatstars.com/beat/PLACEHOLDER01",
    // cover: "https://exemple.com/gardav.jpg",
  },

  // ── copie ce bloc pour ajouter un beat (à mettre tout en haut) ──
  // {
  //   title: "",
  //   bpm: 0,
  //   youtube: "",
  //   buy: "",
  // },
];

// URL d'embed du store BeatStars (optionnel).
// Sur BeatStars : ton store → bouton « Embed/Partager » → copie l'adresse
// de l'iframe (src) et colle-la ici. Laisse "" pour masquer la section.
export const beatstarsEmbedUrl = "";

// Image de partage (Open Graph) — idéalement 1200×630 px. "" = aucune image.
export const aromOgImage = "";

// Contact (réutilise l'email du site ; remplace l'Instagram par ton vrai compte).
export const aromContact = {
  email: "lisiere.audio@gmail.com",
  instagram: "https://instagram.com/arom.prod",
  instagramHandle: "@arom.prod",
};
