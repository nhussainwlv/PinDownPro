import type { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<
  Plan,
  { downloadsPerDay: number; aiCaptions: boolean; hd4k: boolean }
> = {
  FREE: { downloadsPerDay: 15, aiCaptions: false, hd4k: false },
  PRO: { downloadsPerDay: 500, aiCaptions: true, hd4k: true },
  ENTERPRISE: { downloadsPerDay: 10000, aiCaptions: true, hd4k: true },
};

export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    plan: "PRO" as Plan,
    features: [
      "500 downloads / day",
      "4K & HD quality",
      "AI captions & tags",
      "Priority processing",
      "No ads",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
    plan: "ENTERPRISE" as Plan,
    features: [
      "Unlimited-scale downloads",
      "Team dashboard",
      "Admin API access",
      "Dedicated support",
      "Custom branding",
    ],
  },
};
