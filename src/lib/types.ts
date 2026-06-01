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
  preview_path: string | null;   // Supabase Storage path (public preview)
  cover_url: string | null;
  base_price_cents: number;       // price of the Basic tier; others scale by multiplier
  created_at: string;
}

export interface LicenseTier {
  id: string;
  name: string;
  multiplier: number;     // price = base_price_cents * multiplier
  files: string;          // human-readable list of delivered files
  rights: string;         // " · " separated bullet points
  is_exclusive: boolean;
  sort_order: number;
  active: boolean;
}

export interface PromoCode { id: string; code: string; percent_off: number; active: boolean; }

export interface CartItem {
  beatId: string; slug: string; title: string; coverUrl: string | null;
  tierId: string; tierName: string; isExclusive: boolean; priceCents: number;
}
