export type ProductType = 'instrumental' | 'drumkit' | 'loopkit' | 'preset';
export type ProductStatus = 'draft' | 'published' | 'hidden' | 'sold';

export interface Beat {
  id: string;
  title: string;
  slug: string;
  type: ProductType;
  genre: string | null;
  bpm: number | null;
  music_key: string | null;
  status: ProductStatus;
  featured: boolean;
  tags: string[] | null;
  description: string | null;
  preview_path: string | null;
  cover_url: string | null;
  base_price_cents: number;
  prices: Record<string, number> | null;  // per-tier override: tierId -> cents
  created_at: string;
}

export interface LicenseTier {
  id: string;
  name: string;
  multiplier: number;
  price_cents: number | null;   // fixed price; null = "on request" (exclusive)
  files: string;
  rights: string;               // " · " separated bullet points
  is_exclusive: boolean;
  sort_order: number;
  active: boolean;
}

export interface PromoCode { id: string; code: string; percent_off: number; active: boolean; }

export interface CartItem {
  beatId: string; slug: string; title: string; coverUrl: string | null;
  tierId: string; tierName: string; isExclusive: boolean; priceCents: number;
}
