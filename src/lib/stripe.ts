import Stripe from "stripe";
import { prisma } from "./prisma";
import type { Plan } from "@prisma/client";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  plan: Plan
) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let customerId = user?.stripeId;

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeId: customerId } });
  }

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancel`,
    metadata: { userId, plan },
  });
}

export async function createPortalSession(customerId: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}
