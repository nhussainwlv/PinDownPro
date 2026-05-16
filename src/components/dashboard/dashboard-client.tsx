"use client";

import { motion } from "framer-motion";
import { Heart, ExternalLink, Download } from "lucide-react";
import { downloadFileToDevice } from "@/lib/download-file";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Plan } from "@prisma/client";

type DownloadItem = {
  id: string;
  title: string;
  pinUrl: string;
  mediaType: string;
  thumbnail: string | null;
  createdAt: string;
  mediaUrls: { url: string; type: string }[];
};

type Props = {
  downloads: DownloadItem[];
  favorites: { id: string; title: string; pinUrl: string; thumbnail: string | null }[];
  plan: Plan;
  planLimits: { downloadsPerDay: number; aiCaptions: boolean; hd4k: boolean };
  labels: Record<string, string>;
};

export function DashboardClient({ downloads, favorites, plan, planLimits, labels }: Props) {
  const toggleFavorite = async (downloadId: string) => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadId }),
    });
    const data = await res.json();
    if (res.ok) toast.success(data.favorited ? "Added to favorites" : "Removed from favorites");
    else toast.error(data.error);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        {labels.title}
      </motion.h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{labels.plan}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-rose-400">{plan}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {planLimits.downloadsPerDay} downloads per day
            {planLimits.aiCaptions && " · AI captions"}
            {planLimits.hd4k && " · 4K HD"}
          </p>
        </CardContent>
      </Card>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">{labels.history}</h2>
          {downloads.length === 0 ? (
            <p className="text-zinc-500">{labels.empty}</p>
          ) : (
            <div className="space-y-3">
              {downloads.map((d) => (
                <Card key={d.id} className="overflow-hidden">
                  <CardContent className="flex gap-3 p-4">
                    {d.thumbnail && (
                      <img src={d.thumbnail} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.title}</p>
                      <p className="text-xs text-zinc-500">
                        {d.mediaType} · {formatDate(d.createdAt)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <a href={d.pinUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleFavorite(d.id)}>
                          <Heart className="h-3.5 w-3.5" />
                        </Button>
                        {d.mediaUrls[0] && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              downloadFileToDevice(
                                `/api/proxy?url=${encodeURIComponent(d.mediaUrls[0].url)}&filename=${encodeURIComponent(`pindown-${d.id}.jpg`)}`,
                                `pindown-${d.id}.jpg`
                              ).catch(() => toast.error("Download failed"))
                            }
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">{labels.favorites}</h2>
          {favorites.length === 0 ? (
            <p className="text-zinc-500">No favorites yet.</p>
          ) : (
            <div className="space-y-3">
              {favorites.map((f) => (
                <Card key={f.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    {f.thumbnail && (
                      <img src={f.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                    )}
                    <span className="truncate text-sm">{f.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
