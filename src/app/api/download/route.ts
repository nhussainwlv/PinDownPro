import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fetchPinterestPin, isPinterestUrl } from "@/lib/pinterest";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import type { MediaType } from "@prisma/client";

const schema = z.object({
  url: z.string().url(),
  saveHistory: z.boolean().optional(),
});

function toMediaType(type: string): MediaType {
  const map: Record<string, MediaType> = {
    video: "VIDEO",
    image: "IMAGE",
    gif: "GIF",
    carousel: "CAROUSEL",
    audio: "AUDIO",
  };
  return map[type] ?? "IMAGE";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`download:${ip}`, 30, 60_000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "X-RateLimit-Remaining": String(limit.remaining) } }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { url, saveHistory } = parsed.data;
    if (!isPinterestUrl(url)) {
      return NextResponse.json({ error: "Invalid Pinterest URL" }, { status: 400 });
    }

    const session = await auth();
    const plan = session?.user?.plan ?? "FREE";
    const limits = PLAN_LIMITS[plan];

    if (session?.user?.id) {
      try {
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        const count = await prisma.download.count({
          where: { userId: session.user.id, createdAt: { gte: since } },
        });
        if (count >= limits.downloadsPerDay) {
          return NextResponse.json(
            { error: "Daily download limit reached. Upgrade to Pro for more." },
            { status: 403 }
          );
        }
      } catch {
        /* DB unavailable — allow download without quota check */
      }
    }

    const pin = await fetchPinterestPin(url);

    if (!pin.items.length) {
      return NextResponse.json(
        { error: "No downloadable media found for this pin." },
        { status: 422 }
      );
    }

    try {
      if (saveHistory !== false) {
        await prisma.download.create({
          data: {
            userId: session?.user?.id ?? null,
            pinUrl: url,
            title: pin.title,
            description: pin.description,
            mediaType: toMediaType(pin.mediaType),
            thumbnail: pin.thumbnail,
            mediaUrls: pin.items,
          },
        });
      }

      await prisma.analyticsEvent.create({
        data: {
          event: "download",
          metadata: { mediaType: pin.mediaType, itemCount: pin.items.length },
          userId: session?.user?.id,
          ipHash: Buffer.from(ip).toString("base64").slice(0, 16),
        },
      });
    } catch (dbError) {
      console.warn("[download] SQLite history skipped:", dbError);
    }

    return NextResponse.json({ pin });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
