"use client";

import { motion } from "framer-motion";
import { Download, Image, Film, Layers, Globe, Lock } from "lucide-react";

const items = [
  {
    icon: Film,
    title: "HD Video Downloads",
    desc: "Save Pinterest videos up to 4K with multiple quality options.",
  },
  {
    icon: Image,
    title: "Images & GIFs",
    desc: "Download pins as JPG, PNG, WebP, or animated GIF in full resolution.",
  },
  {
    icon: Layers,
    title: "Carousel Support",
    desc: "Extract every slide from multi-image pins in one go.",
  },
  {
    icon: Globe,
    title: "Smart URL Detection",
    desc: "Works with pin.it short links and all Pinterest regional domains.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    desc: "No login required. We never store your downloaded files.",
  },
  {
    icon: Download,
    title: "Instant Preview",
    desc: "See your media before downloading with our live preview panel.",
  },
];

export function Features() {
  return (
    <section className="border-t border-white/5 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">
          Everything you need, <span className="text-rose-400">nothing you don&apos;t</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 transition hover:border-rose-500/20"
            >
              <item.icon className="mb-4 h-8 w-8 text-rose-400" />
              <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
