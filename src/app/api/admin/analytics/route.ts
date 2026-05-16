import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalUsers, totalDownloads, recentEvents, planBreakdown] = await Promise.all([
    prisma.user.count(),
    prisma.download.count(),
    prisma.analyticsEvent.groupBy({
      by: ["event"],
      _count: { event: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
  ]);

  const downloadsLast7Days = await prisma.download.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({
    totalUsers,
    totalDownloads,
    downloadsLast7Days,
    recentEvents,
    planBreakdown,
  });
}
