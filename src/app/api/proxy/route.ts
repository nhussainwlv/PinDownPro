import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "pinimg.com",
  "i.pinimg.com",
  "v.pinimg.com",
  "s.pinimg.com",
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") ?? "download";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h))) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: "https://www.pinterest.com/",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  const blob = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
