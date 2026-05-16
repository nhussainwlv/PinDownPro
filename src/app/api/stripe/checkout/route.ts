import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { STRIPE_PLANS } from "@/lib/plans";

const schema = z.object({
  plan: z.enum(["pro", "enterprise"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planConfig = STRIPE_PLANS[parsed.data.plan];
  if (!planConfig.priceId) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const checkout = await createCheckoutSession(
    session.user.id,
    session.user.email,
    planConfig.priceId,
    planConfig.plan
  );

  return NextResponse.json({ url: checkout.url });
}
