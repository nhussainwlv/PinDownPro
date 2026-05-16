"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, TrendingUp, BarChart3 } from "lucide-react";

type Analytics = {
  totalUsers: number;
  totalDownloads: number;
  downloadsLast7Days: number;
  recentEvents: { event: string; _count: { event: number } }[];
  planBreakdown: { plan: string; _count: { plan: number } }[];
};

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load analytics"));
  }, []);

  if (error) {
    return (
      <section className="px-4 py-20 text-center text-zinc-400">
        {error}
      </section>
    );
  }

  if (!data) {
    return (
      <section className="px-4 py-20 text-center text-zinc-500">
        Loading analytics…
      </section>
    );
  }

  const stats = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Total downloads", value: data.totalDownloads, icon: Download },
    { label: "Downloads (7d)", value: data.downloadsLast7Days, icon: TrendingUp },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-bold text-white"
      >
        Admin Analytics
      </motion.h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Events (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentEvents.map((e) => (
              <div key={e.event} className="flex justify-between text-sm">
                <span className="text-zinc-400">{e.event}</span>
                <span className="font-medium">{e._count.event}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.planBreakdown.map((p) => (
              <div key={p.plan} className="flex justify-between text-sm">
                <span className="text-zinc-400">{p.plan}</span>
                <span className="font-medium">{p._count.plan}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
