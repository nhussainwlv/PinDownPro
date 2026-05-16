"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AtSign } from "lucide-react";

const INSTAGRAM_URL = "https://instagram.com/adrian_ash";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} Pin Down Pro. {t("rights")}
        </p>
        <p className="flex items-center gap-1.5">
          {t("builtBy")}{" "}
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-rose-400 transition hover:text-rose-300"
          >
            <AtSign className="h-4 w-4" />
            @Adrian
          </Link>
        </p>
      </div>
    </footer>
  );
}
