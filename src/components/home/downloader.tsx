"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Link2,
  Loader2,
  Download,
  Copy,
  Sparkles,
  Image as ImageIcon,
  Film,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { downloadFileToDevice } from "@/lib/download-file";
import type { PinResult } from "@/lib/pinterest";

export function Downloader({ className }: { className?: string }) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PinResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const fetchPin = useCallback(
    async (pinUrl: string) => {
      setLoading(true);
      setProgress(10);
      setResult(null);
      const interval = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 200);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: pinUrl, saveHistory: true }),
          signal: controller.signal,
        });
        const data = await res.json();
        clearInterval(interval);
        if (!res.ok) throw new Error(data.error ?? t("errors.generic"));
        if (!data.pin?.items?.length) throw new Error(t("errors.noMedia"));
        setProgress(100);
        setResult(data.pin);
        toast.success(t("preview.ready"));
      } catch (e) {
        clearInterval(interval);
        if (e instanceof Error && e.name === "AbortError") {
          toast.error(t("errors.generic"));
        } else {
          toast.error(e instanceof Error ? e.message : t("errors.generic"));
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    },
    [t]
  );

  const saveItem = async (itemUrl: string, filename: string, index: number) => {
    setSavingIndex(index);
    try {
      await downloadFileToDevice(
        `/api/proxy?url=${encodeURIComponent(itemUrl)}&filename=${encodeURIComponent(filename)}`,
        filename
      );
      toast.success(t("preview.save"));
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setSavingIndex(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error(t("errors.invalidUrl"));
      return;
    }
    fetchPin(trimmed);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.getData("text") || e.dataTransfer.getData("text/plain");
    if (dropped) {
      setUrl(dropped);
      fetchPin(dropped);
    }
  };

  const previewLabel = (type: string) => {
    const map: Record<string, string> = {
      video: t("preview.video"),
      image: t("preview.image"),
      gif: t("preview.gif"),
      carousel: t("preview.carousel"),
    };
    return map[type] ?? t("preview.image");
  };

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn("rounded-2xl ring-2 transition", dragOver ? "ring-rose-400/50" : "ring-transparent")}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("hero.placeholder")}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="shine min-w-[140px]">
            {loading ? <Loader2 className="animate-spin" /> : <Download />}
            {t("hero.download")}
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-zinc-500">{t("hero.dropHint")}</p>
      </div>

      {loading && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-zinc-400">{t("preview.processing")}</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {result && !loading && (
        <Card className="mt-8">
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4">
              {result.thumbnail && (
                <img src={result.thumbnail} alt="" className="h-24 w-24 rounded-xl object-cover" />
              )}
              <div>
                <span className="text-xs uppercase tracking-wider text-rose-400">
                  {previewLabel(result.mediaType)}
                </span>
                <h3 className="line-clamp-2 font-semibold">{result.title}</h3>
                {result.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{result.description}</p>
                )}
              </div>
            </div>
            {result.items.map((item, i) => (
              <div
                key={item.url}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <span className="text-sm text-zinc-300">
                  {item.quality ?? item.type}
                  {item.format && ` · ${item.format}`}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                      toast.success(t("preview.copy"));
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={savingIndex === i}
                    onClick={() =>
                      saveItem(
                        item.url,
                        `pindown-${result.id}-${i + 1}.${item.format ?? "mp4"}`,
                        i
                      )
                    }
                  >
                    {savingIndex === i ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {t("preview.save")}
                  </Button>
                </div>
              </div>
            ))}
            {session?.user.plan !== "FREE" && (
              <Button variant="outline" className="w-full" onClick={async () => {
                const res = await fetch("/api/ai/caption", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: result.title,
                    description: result.description,
                    mediaType: result.mediaType,
                  }),
                });
                const data = await res.json();
                if (res.ok) toast.success(data.caption, { description: data.tags?.join(", ") });
                else toast.error(data.error ?? t("errors.generic"));
              }}>
                <Sparkles />
                {t("preview.ai")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
