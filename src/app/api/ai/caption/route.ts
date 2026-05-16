import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateCaptionAndTags } from "@/lib/ai";
import { PLAN_LIMITS } from "@/lib/plans";

const schema = z.object({
  title: z.string(),
  description: z.string().optional(),
  mediaType: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limits = PLAN_LIMITS[session.user.plan];
  if (!limits.aiCaptions) {
    return NextResponse.json({ error: "Upgrade to Pro for AI captions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateCaptionAndTags({
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    mediaType: parsed.data.mediaType,
  });

  return NextResponse.json(result);
}
