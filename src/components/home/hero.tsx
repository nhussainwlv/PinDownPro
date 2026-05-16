"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Shield } from "lucide-react";
import { Downloader } from "./downloader";

export function Hero() {
  const t = useTranslations("hero");

  const features = [
    { icon: Sparkles, label: t("features.hd") },
    { icon: Zap, label: t("features.fast") },
    { icon: Shield, label: t("features.secure") },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-rose-500/20 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-sm text-rose-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge")}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-tight"
        >
          {t("title")}{" "}
          <span className="gradient-text">{t("titleHighlight")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <Downloader />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-zinc-400"
            >
              <Icon className="h-4 w-4 text-rose-400" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
