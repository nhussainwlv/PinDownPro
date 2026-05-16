"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Download, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const base = locale === "en" ? "" : `/${locale}`;
  const links = [
    { href: base || "/", label: t("home") },
    { href: `${base}/pricing`, label: t("pricing") },
  ];

  if (session) {
    links.push({ href: `${base}/dashboard`, label: t("dashboard") });
    if (session.user.role === "ADMIN") {
      links.push({ href: `${base}/admin`, label: t("admin") });
    }
  }

  const switchLocale = (l: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = locales.includes(segments[0] as Locale);
    const rest = hasLocale ? segments.slice(1) : segments;
    const path = l === "en" ? `/${rest.join("/")}` : `/${l}/${rest.join("/")}`;
    router.push(path || "/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={base || "/"} className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30">
            <Download className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">
            Pin Down <span className="text-rose-400">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <select
            value={locale}
            onChange={(e) => switchLocale(e.target.value as Locale)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
            aria-label="Language"
          >
            {locales.map((l) => (
              <option key={l} value={l} className="bg-zinc-900">
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              {t("signOut")}
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href={`${base}/auth/signin`}>
                <Sparkles className="h-3.5 w-3.5" />
                {t("signIn")}
              </Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-white/5 md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-3 p-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-zinc-300"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
