import type { Beat, LicenseTier } from "@/lib/types";

/** Effective price for a tier on a given beat: per-beat override (if set) else the tier's default.
 *  Returns null when the tier is "on request" (no price). */
export function tierPrice(
  prices: Beat["prices"] | undefined | null,
  tier: Pick<LicenseTier, "id" | "price_cents">
): number | null {
  const o = prices ? prices[tier.id] : undefined;
  return typeof o === "number" ? o : tier.price_cents;
}
