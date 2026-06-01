import Stripe from "stripe";
// Fallback avoids a build-time throw when env is absent; real key is injected at runtime.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
