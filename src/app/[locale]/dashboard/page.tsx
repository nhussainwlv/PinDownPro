import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PLAN_LIMITS } from "@/lib/plans";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale === "en" ? "" : locale + "/"}auth/signin`.replace("//", "/"));
  }

  const t = await getTranslations("dashboard");
  const [downloads, favorites] = await Promise.all([
    prisma.download.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { download: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const limits = PLAN_LIMITS[session.user.plan];

  return (
    <DashboardClient
      downloads={downloads.map((d) => ({
        id: d.id,
        title: d.title ?? "Untitled",
        pinUrl: d.pinUrl,
        mediaType: d.mediaType,
        thumbnail: d.thumbnail,
        createdAt: d.createdAt.toISOString(),
        mediaUrls: d.mediaUrls as { url: string; type: string }[],
      }))}
      favorites={favorites.map((f) => ({
        id: f.download.id,
        title: f.download.title ?? "Untitled",
        pinUrl: f.download.pinUrl,
        thumbnail: f.download.thumbnail,
      }))}
      plan={session.user.plan}
      planLimits={limits}
      labels={{
        title: t("title"),
        history: t("history"),
        favorites: t("favorites"),
        empty: t("empty"),
        plan: t("plan"),
      }}
    />
  );
}
