import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook misconfigured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = (session.metadata?.plan as Plan) ?? "PRO";
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { plan } });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const user = await prisma.user.findFirst({ where: { stripeId: customerId } });
    if (user) {
      const status = sub.status;
      const plan: Plan = status === "active" ? "PRO" : "FREE";
      await prisma.user.update({ where: { id: user.id }, data: { plan } });
    }
  }

  return NextResponse.json({ received: true });
}
