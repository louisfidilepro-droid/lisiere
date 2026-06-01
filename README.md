# Lisière — boutique d'instrumentales

Boutique de beats : Next.js (App Router) · Supabase (DB/Auth/Storage) · Stripe (paiement) · TypeScript.

DA sombre/mélancolique, violet en accent rare, player waveform persistant, explorateur de licences,
panier + codes promo, admin sécurisé, livraison de fichiers par lien signé temporaire.

## Mise en ligne
👉 Voir **DEPLOY.md** (guide pas-à-pas, sans coder).

## Développement local (optionnel)
```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm run dev                  # http://localhost:3000
```
Pour tester les webhooks Stripe en local : `stripe listen --forward-to localhost:3000/api/webhook`.

## Structure
- `src/app` — pages (accueil, /product/[slug], /success, /admin) + routes API (/api/checkout, /api/webhook, /api/download, /api/promo)
- `src/components` — Hero, BeatCard, Player, Cart, LicenseExplorer, BeatForm, Nav, Chrome
- `src/lib` — clients Supabase (server/browser/admin), Stripe, types, helpers
- `supabase/` — migration SQL + seed
