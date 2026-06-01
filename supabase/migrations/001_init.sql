-- ════════════════════════════════════════════════════════
-- LISIÈRE — schéma initial (à exécuter dans Supabase > SQL Editor)
-- ════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

-- ── Produits (instrumentales + futurs kits via `type`) ──
create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text unique not null,
  type             text not null default 'instrumental',
  genre            text,
  bpm              integer,
  music_key        text,
  status           text not null default 'draft'
                     check (status in ('draft','published','hidden','sold')),
  featured         boolean not null default false,
  tags             text[],
  description      text,
  preview_path     text,            -- chemin Storage du preview (bucket public 'previews')
  cover_url        text,
  base_price_cents integer not null default 2900,
  download_path    text,            -- chemin Storage du fichier livrable (bucket privé 'masters')
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Paliers de licence (globaux, prix = base * multiplier) ──
create table if not exists license_tiers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  multiplier    numeric not null default 1,
  files         text not null default 'MP3',
  rights        text not null default '',
  is_exclusive  boolean not null default false,
  sort_order    integer not null default 0,
  active        boolean not null default true
);

-- ── Codes promo ──
create table if not exists promo_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  percent_off integer not null,
  active      boolean not null default true
);

-- ── Commandes ──
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  customer_email   text,
  total_cents      integer not null default 0,
  stripe_session_id text unique,
  status           text not null default 'pending'
                     check (status in ('pending','paid','failed','refunded')),
  created_at       timestamptz not null default now()
);

create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid not null references products(id),
  license_tier_id uuid not null references license_tiers(id),
  price_cents     integer not null
);

-- ── Droits de téléchargement (liens signés temporaires) ──
create table if not exists download_grants (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  product_id    uuid not null references products(id),
  token         text unique not null default replace(gen_random_uuid()::text,'-',''),
  expires_at    timestamptz not null default now() + interval '7 days',
  downloaded_at timestamptz,
  created_at    timestamptz not null default now()
);

-- ── updated_at auto ──
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- ════════════════════ Row Level Security ════════════════════
alter table products       enable row level security;
alter table license_tiers  enable row level security;
alter table promo_codes    enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table download_grants enable row level security;

-- Lecture publique : produits publiés ou vendus (vitrine)
drop policy if exists "public read products" on products;
create policy "public read products" on products for select
  using (status in ('published','sold'));

-- Lecture publique : licences & promos actives
drop policy if exists "public read tiers" on license_tiers;
create policy "public read tiers" on license_tiers for select using (active = true);
drop policy if exists "public read promos" on promo_codes;
create policy "public read promos" on promo_codes for select using (active = true);

-- Les écritures (admin, commandes, grants) passent par la clé service_role
-- côté serveur (route handlers / server actions), qui bypass RLS.
