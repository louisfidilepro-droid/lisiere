# 🚀 Mettre Lisière en ligne — guide pas-à-pas

Tu ne codes pas : suis les étapes dans l'ordre, copie-colle quand c'est indiqué.
Compte à prévoir (tous gratuits au départ) : **GitHub**, **Supabase**, **Stripe**, **Vercel**.

Durée : ~1 à 2 h la première fois.

---

## Étape 1 — Mettre le code sur GitHub

1. Crée un compte sur github.com si tu n'en as pas.
2. Crée un dépôt vide (bouton **New repository**), nomme-le `lisiere`, laisse-le **Private**.
3. Envoie le dossier `webapp/` dedans. Le plus simple sans ligne de commande :
   - Sur la page du dépôt → **uploading an existing file** → glisse tout le contenu de `webapp/`
     **sauf** les dossiers `node_modules` et `.next` (ils se régénèrent tout seuls).
   - Ou installe **GitHub Desktop** (interface graphique) et fais *Add local repository* → *Publish*.

---

## Étape 2 — Base de données Supabase

1. Va sur supabase.com → **New project**. Choisis une région proche (ex. Europe / Paris). Note bien le **mot de passe** de la base.
2. Quand le projet est prêt : menu **SQL Editor** → **New query**.
3. Ouvre le fichier `webapp/supabase/migrations/001_init.sql`, copie tout, colle dans l'éditeur, clique **Run**.
4. Nouvelle query : copie le contenu de `webapp/supabase/seed.sql`, **Run** (ça crée les 5 licences + 2 codes promo).
5. **Storage** (menu de gauche) → crée **deux buckets** :
   - `previews` → coche **Public bucket** (les extraits audio sont écoutables par tous).
   - `masters` → laisse **privé** (les fichiers complets, livrés seulement après paiement).
6. **Authentication** → **Users** → **Add user** → mets **ton** email + un mot de passe. C'est ton compte admin.
7. **Project Settings → API** : note ces 3 valeurs (tu les colleras dans Vercel) :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secrète — ne la partage jamais)

---

## Étape 3 — Paiement Stripe

1. Crée/connecte ton compte sur stripe.com.
2. **Developers → API keys** : note la **Secret key** (`sk_…`) → `STRIPE_SECRET_KEY`
   et la **Publishable key** (`pk_…`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. **Settings → Payments → Payment methods** : active **Cartes** et **PayPal** (et ce que tu veux).
   Le checkout proposera automatiquement les moyens activés.
4. Le webhook se configure à l'étape 5 (il faut l'URL du site déployé d'abord).

> ⚠️ **TVA / taxes :** Stripe n'est PAS un « merchant of record ». C'est **toi** qui es responsable de
> déclarer la TVA. Quand tu es prêt, active **Stripe Tax** (Settings → Tax) puis passe
> `automatic_tax` à `true` dans `src/app/api/checkout/route.ts`. Au lancement, à toi de voir selon ton statut.

---

## Étape 4 — Déployer sur Vercel

1. Va sur vercel.com → **Add New → Project** → connecte ton GitHub → importe le dépôt `lisiere`.
   - Si `webapp` est un sous-dossier du dépôt, règle **Root Directory** = `webapp`.
2. Avant de déployer, ouvre **Environment Variables** et ajoute (copie depuis `.env.example`) :

   | Nom | Valeur |
   |-----|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Supabase, étape 2.7) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (Supabase, secret) |
   | `STRIPE_SECRET_KEY` | (Stripe) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (Stripe) |
   | `STRIPE_WEBHOOK_SECRET` | mets `whsec_temp` pour l'instant (corrigé étape 5) |
   | `NEXT_PUBLIC_SITE_URL` | l'URL Vercel (ex. `https://lisiere.vercel.app`) |
   | `ADMIN_EMAIL` | l'email admin créé à l'étape 2.6 |

3. Clique **Deploy**. Attends quelques minutes. Tu obtiens une URL `https://…vercel.app`.
4. Si tu n'avais pas encore l'URL pour `NEXT_PUBLIC_SITE_URL`, remets-la maintenant
   (Settings → Environment Variables) puis **Redeploy**.

---

## Étape 5 — Brancher le webhook Stripe

1. Sur Stripe → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL** : `https://TON-URL.vercel.app/api/webhook`
3. **Events to send** : sélectionne `checkout.session.completed`.
4. Crée l'endpoint → Stripe affiche un **Signing secret** (`whsec_…`).
5. Copie-le dans Vercel → `STRIPE_WEBHOOK_SECRET` → **Redeploy**.

Sans ça, les paiements aboutissent mais les fichiers ne se débloquent pas. C'est l'étape la plus oubliée — ne la saute pas.

---

## Étape 6 — Mettre tes beats en ligne

1. Va sur `https://TON-URL.vercel.app/admin` → connecte-toi (email + mot de passe de l'étape 2.6).
2. **Add a beat** : titre, genre, BPM, tonalité, prix de base (= prix de la licence Basic ; les autres se calculent par multiplicateur), upload de l'**extrait MP3** (preview) et du **fichier livrable** (zip/wav), statut **Published**.
3. Sauvegarde → le beat apparaît sur la boutique. Achète-en un en **mode test Stripe** pour tout vérifier (carte test `4242 4242 4242 4242`).

---

## Étape 7 — Ton nom de domaine (optionnel)

Vercel → projet → **Settings → Domains** → ajoute ton domaine et suis les instructions DNS.
Pense à mettre `NEXT_PUBLIC_SITE_URL` sur le domaine final puis redeploy.

---

## Passer en réel

Quand tout marche en test : bascule Stripe en mode **Live**, remplace les clés `sk_…`/`pk_…` par les clés live,
recrée le webhook en live, mets à jour les variables Vercel, redeploy. Et voilà. 🟣

## Dépannage rapide
- **Page blanche / 500 au build** : une variable d'env manque dans Vercel.
- **Paiement OK mais pas de fichier** : webhook mal branché (étape 5) ou bucket `masters` introuvable.
- **Impossible de se connecter à l'admin** : `ADMIN_EMAIL` doit être exactement l'email du user Supabase.
