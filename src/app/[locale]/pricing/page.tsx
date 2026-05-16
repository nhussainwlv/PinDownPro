"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { STRIPE_PLANS } from "@/lib/plans";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const { data: session } = useSession();

  const plans = [
    {
      id: "free",
      name: t("free"),
      price: "$0",
      features: ["15 downloads / day", "HD quality", "Basic preview"],
      cta: t("current"),
      highlight: false,
    },
    {
      id: "pro",
      name: t("pro"),
      price: "$9",
      features: STRIPE_PLANS.pro.features,
      cta: t("upgrade"),
      highlight: true,
      stripePlan: "pro" as const,
    },
    {
      id: "enterprise",
      name: t("enterprise"),
      price: "$29",
      features: STRIPE_PLANS.enterprise.features,
      cta: t("upgrade"),
      highlight: false,
      stripePlan: "enterprise" as const,
    },
  ];

  const checkout = async (plan: "pro" | "enterprise") => {
    if (!session) {
      toast.error("Please sign in first");
      return;
    }
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast.error(data.error ?? "Checkout failed");
  };

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white"
        >
          {t("title")}
        </motion.h1>
        <p className="mt-4 text-zinc-400">{t("subtitle")}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={
                  plan.highlight
                    ? "border-rose-500/40 ring-1 ring-rose-500/30"
                    : undefined
                }
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.id !== "free" && (
                      <span className="text-zinc-500">{t("perMonth")}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-left text-sm text-zinc-400">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-rose-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "secondary"}
                    disabled={plan.id === "free"}
                    onClick={() =>
                      plan.stripePlan && checkout(plan.stripePlan)
                    }
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
