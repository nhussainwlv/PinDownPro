import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { download: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

const toggleSchema = z.object({ downloadId: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { downloadId } = parsed.data;
  const existing = await prisma.favorite.findUnique({
    where: { userId_downloadId: { userId: session.user.id, downloadId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, downloadId },
  });
  return NextResponse.json({ favorited: true });
}
