import { getCached } from "./cache";

export type MediaItem = {
  url: string;
  quality?: string;
  width?: number;
  height?: number;
  type: "video" | "image" | "gif" | "audio";
  format?: string;
};

export type PinResult = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaType: "video" | "image" | "gif" | "carousel" | "audio";
  items: MediaItem[];
  author?: string;
  sourceUrl: string;
};

const PINTEREST_PATTERNS = [
  /^https?:\/\/(www\.)?pinterest\.[a-z.]+\/pin\/[\w-]+/i,
  /^https?:\/\/pin\.it\/[\w]+/i,
  /^https?:\/\/(www\.)?pinterest\.[a-z.]+\/pin\/\d+/i,
];

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function isPinterestUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return PINTEREST_PATTERNS.some((p) => p.test(parsed.href));
  } catch {
    return false;
  }
}

export function detectUrlType(url: string): "pinterest" | "invalid" {
  return isPinterestUrl(url) ? "pinterest" : "invalid";
}

async function resolveUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  let resolved = trimmed;

  if (trimmed.includes("pin.it") || !/\/pin\/\d+/.test(trimmed)) {
    const res = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    resolved = res.url;
  }

  const pinId = resolved.match(/\/pin\/(\d+)/)?.[1];
  if (pinId) {
    return `https://www.pinterest.com/pin/${pinId}/`;
  }
  return resolved;
}

function extractJsonFromHtml(html: string): unknown[] {
  const results: unknown[] = [];
  const patterns = [
    /<script[^>]*id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]*id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]*type="application\/json"[^>]*data-test-id="resource-response-data"[^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.global) {
      const matches = html.matchAll(pattern);
      for (const m of matches) {
        try {
          if (m[1]) results.push(JSON.parse(m[1]));
        } catch {
          /* skip */
        }
      }
    } else {
      const m = html.match(pattern);
      if (m?.[1]) {
        try {
          results.push(JSON.parse(m[1]));
        } catch {
          /* skip */
        }
      }
    }
  }
  return results;
}

function findPinData(obj: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 12 || !obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  if (record.videos || record.images || record.story_pin_data || record.images_orig) {
    return record;
  }
  if (record.entity_id && (record.grid_title || record.title || record.description)) {
    return record;
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findPinData(item, depth + 1);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findPinData(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function pickBestUrl(urls: Record<string, { url?: string; width?: number }> | undefined): string | null {
  if (!urls) return null;
  const entries = Object.values(urls).filter((v) => v?.url);
  if (!entries.length) return null;
  entries.sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return entries[0]?.url ?? null;
}

function parsePin(pin: Record<string, unknown>, sourceUrl: string): PinResult {
  const id = String(pin.id ?? pin.entity_id ?? "unknown");
  const title = String(pin.grid_title ?? pin.title ?? "Pinterest Pin");
  const description = String(pin.description ?? pin.seo_description ?? "");
  const items: MediaItem[] = [];

  const videos = pin.videos as Record<string, { url?: string; width?: number; height?: number }> | undefined;
  if (videos) {
    const list = Object.entries(videos);
    list.sort(([, a], [, b]) => (b?.width ?? 0) - (a?.width ?? 0));
    for (const [quality, v] of list) {
      if (v?.url) {
        items.push({
          url: v.url,
          quality,
          width: v.width,
          height: v.height,
          type: "video",
          format: "mp4",
        });
      }
    }
  }

  const images = pin.images as Record<string, { url?: string; width?: number; height?: number }> | undefined;
  const orig = images?.orig ?? images?.["736x"] ?? images?.["564x"];
  if (orig?.url && items.length === 0) {
    const isGif = orig.url.includes(".gif") || String(pin.type).toLowerCase().includes("gif");
    items.push({
      url: orig.url,
      width: orig.width,
      height: orig.height,
      type: isGif ? "gif" : "image",
      format: isGif ? "gif" : "jpg",
    });
  }

  type StoryBlock = {
    video?: { video_list?: Record<string, { url?: string }> };
    image?: { images?: Record<string, { url?: string }> };
  };
  const story = pin.story_pin_data as
    | { pages?: Array<{ blocks?: StoryBlock[] }> }
    | undefined;
  if (story?.pages) {
    for (const page of story.pages) {
      for (const block of page.blocks ?? []) {
        const vList = block.video?.video_list;
        const vUrl = pickBestUrl(vList as Record<string, { url?: string; width?: number }>);
        if (vUrl) items.push({ url: vUrl, type: "video", format: "mp4" });
        const imgUrl = pickBestUrl(block.image?.images);
        if (imgUrl) items.push({ url: imgUrl, type: "image", format: "jpg" });
      }
    }
  }

  const carousel = pin.carousel_data as
    | { carousel_slots?: Array<{ images?: Record<string, { url?: string }> }> }
    | undefined;
  if (carousel?.carousel_slots) {
    for (const slot of carousel.carousel_slots) {
      const url = pickBestUrl(slot.images);
      if (url) items.push({ url, type: "image", format: "jpg" });
    }
  }

  const att = pin.attribution as { author_name?: string } | undefined;
  const thumbnail =
    pickBestUrl(images) ??
    items[0]?.url ??
    "";

  let mediaType: PinResult["mediaType"] = "image";
  if (items.some((i) => i.type === "video")) mediaType = items.length > 1 ? "carousel" : "video";
  else if (items.some((i) => i.type === "gif")) mediaType = "gif";
  else if (items.length > 1) mediaType = "carousel";

  if (items.length === 0) {
    const ogImage = pin.image_large_url as string | undefined;
    if (ogImage) items.push({ url: ogImage, type: "image", format: "jpg" });
  }

  return {
    id,
    title,
    description,
    thumbnail,
    mediaType,
    items: dedupeItems(items),
    author: att?.author_name,
    sourceUrl,
  };
}

function dedupeItems(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}

/** Pinterest's newer closeup pages embed pin data in Relay (v3GetPinQueryv2) scripts. */
function extractV3PinFromHtml(html: string): Record<string, unknown> | null {
  const marker = '"v3GetPinQueryv2"';
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const dataMarker = '"data":';
  const dataStart = html.indexOf(dataMarker, start);
  if (dataStart === -1) return null;

  let i = dataStart + dataMarker.length;
  while (i < html.length && html[i] !== "{") i++;
  if (html[i] !== "{") return null;

  let depth = 0;
  const begin = i;
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(begin, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

type V3Image = { url?: string; width?: number; height?: number };
type V3Video = { url?: string; width?: number; height?: number; thumbnail?: string };

function qualityFromVideoUrl(url: string, label?: string): string {
  if (label) {
    const fromLabel = label.match(/(\d+)P/i);
    if (fromLabel) return `${fromLabel[1]}p`;
  }
  const fromPath = url.match(/_(\d+)w\.mp4/i);
  if (fromPath) return `${fromPath[1]}p`;
  if (url.includes("1080")) return "1080p";
  if (url.includes("720")) return "720p";
  return label ?? "hd";
}

function addVideoItem(
  items: MediaItem[],
  url: string,
  meta: { quality?: string; width?: number; height?: number }
) {
  if (!url || url.includes(".m3u8")) return;
  items.push({
    url,
    quality: qualityFromVideoUrl(url, meta.quality),
    width: meta.width,
    height: meta.height,
    type: "video",
    format: "mp4",
  });
}

function extractFromVideoListContainer(
  container: unknown,
  items: MediaItem[],
  defaultQuality?: string
) {
  if (!container || typeof container !== "object") return;
  for (const [key, entry] of Object.entries(container as Record<string, V3Video>)) {
    const v = entry as V3Video;
    if (v?.url) addVideoItem(items, v.url, { quality: key || defaultQuality, width: v.width, height: v.height });
  }
}

function extractFromVideoDataV2(videoDataV2: Record<string, unknown>, items: MediaItem[]) {
  const listKeys = [
    "videoList720P",
    "videoList1080P",
    "videoListEXP7",
    "videoListEXP6",
    "videoListEXP5",
    "videoListEXP4",
    "videoListEXP3",
    "videoList",
    "videoListMobile",
    "v_hlsv4_video_list",
  ];
  for (const key of listKeys) {
    extractFromVideoListContainer(videoDataV2[key], items, key.replace("videoList", ""));
  }
}

function collectStoryPinVideos(pin: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const story = (pin.storyPinData ?? pin.story_pin_data) as
    | { pages?: Array<{ blocks?: Record<string, unknown>[] }> }
    | undefined;

  if (!story?.pages) return items;

  for (const page of story.pages) {
    for (const block of page.blocks ?? []) {
      if (block.videoDataV2 && typeof block.videoDataV2 === "object") {
        extractFromVideoDataV2(block.videoDataV2 as Record<string, unknown>, items);
      }

      const legacy = block.video as
        | { video_list?: Record<string, V3Video> }
        | undefined;
      if (legacy?.video_list) {
        for (const [quality, v] of Object.entries(legacy.video_list)) {
          if (v?.url) addVideoItem(items, v.url, { quality, width: v.width, height: v.height });
        }
      }
    }
  }

  return items;
}

function collectV3Videos(pin: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];

  const videos = pin.videos as Record<string, V3Video> | null | undefined;
  if (videos && typeof videos === "object") {
    for (const [quality, v] of Object.entries(videos)) {
      if (v?.url) addVideoItem(items, v.url, { quality, width: v.width, height: v.height });
    }
  }

  items.push(...collectStoryPinVideos(pin));

  const sorted = dedupeItems(items).sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const byQuality = new Map<string, MediaItem>();
  for (const item of sorted) {
    const key = item.quality ?? item.url;
    if (!byQuality.has(key)) byQuality.set(key, item);
  }
  return [...byQuality.values()];
}

function collectV3Images(pin: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const sizeKeys = [
    "images_orig",
    "images_1200x",
    "images_736x",
    "images_564x",
    "images_474x",
    "images_236x",
  ];

  for (const key of sizeKeys) {
    const img = pin[key] as V3Image | undefined;
    if (!img?.url) continue;
    const quality = key.replace("images_", "");
    const isGif = img.url.includes(".gif");
    items.push({
      url: img.url,
      width: img.width,
      height: img.height,
      quality,
      type: isGif ? "gif" : "image",
      format: isGif ? "gif" : img.url.includes(".png") ? "png" : "jpg",
    });
  }

  return dedupeItems(items);
}

function pickV3Thumbnail(pin: Record<string, unknown>, items: MediaItem[]): string {
  const story = (pin.storyPinData ?? pin.story_pin_data) as
    | { pages?: Array<{ blocks?: Record<string, unknown>[] }> }
    | undefined;

  for (const page of story?.pages ?? []) {
    for (const block of page.blocks ?? []) {
      const v2 = block.videoDataV2 as Record<string, unknown> | undefined;
      if (!v2) continue;
      for (const list of Object.values(v2)) {
        if (!list || typeof list !== "object") continue;
        for (const entry of Object.values(list as Record<string, V3Video>)) {
          if (entry?.thumbnail) return entry.thumbnail;
        }
      }
    }
  }

  return (
    (pin.images_736x as V3Image | undefined)?.url ??
    (pin.images_236x as V3Image | undefined)?.url ??
    items.find((i) => i.type === "image")?.url ??
    items[0]?.url ??
    ""
  );
}

function parseV3Pin(pin: Record<string, unknown>, sourceUrl: string): PinResult | null {
  const videos = collectV3Videos(pin);
  const images = collectV3Images(pin);
  const items = videos.length > 0 ? videos : images;
  if (!items.length) return null;

  const title = String(
    pin.gridTitle ?? pin.title ?? pin.seoTitle ?? pin.grid_title ?? "Pinterest Pin"
  ).trim();
  const description = String(pin.description ?? pin.gridDescription ?? pin.seo_description ?? "").trim();
  const thumbnail = pickV3Thumbnail(pin, images);

  let mediaType: PinResult["mediaType"] = "image";
  if (videos.length > 0) {
    mediaType = videos.length > 1 || (storyHasMultipleVideos(pin) && videos.length > 0) ? "carousel" : "video";
  } else if (items.some((i) => i.type === "gif")) mediaType = "gif";
  else if (items.length > 1) mediaType = "carousel";

  const id = String(pin.entityId ?? pin.id ?? sourceUrl.match(/\/pin\/(\d+)/)?.[1] ?? "unknown");

  return {
    id,
    title: title || "Pinterest Pin",
    description,
    thumbnail,
    mediaType: videos.length === 1 ? "video" : mediaType,
    items,
    author: undefined,
    sourceUrl,
  };
}

function storyHasMultipleVideos(pin: Record<string, unknown>): boolean {
  const story = (pin.storyPinData ?? pin.story_pin_data) as
    | { pages?: Array<{ blocks?: Record<string, unknown>[] }> }
    | undefined;
  let count = 0;
  for (const page of story?.pages ?? []) {
    for (const block of page.blocks ?? []) {
      if (block.videoDataV2 || block.video) count++;
    }
  }
  return count > 1;
}

function extractVideoFallback(html: string, sourceUrl: string): PinResult | null {
  const mp4s = [
    ...new Set(
      html.match(/https:\/\/v\d*\.pinimg\.com\/videos\/[^"'\\\s]+\.mp4/gi) ?? []
    ),
  ];
  if (!mp4s.length) return null;

  const items: MediaItem[] = mp4s.map((url) => ({
    url,
    type: "video" as const,
    format: "mp4",
    quality: qualityFromVideoUrl(url),
  }));
  items.sort((a, b) => parseInt(b.quality ?? "0", 10) - parseInt(a.quality ?? "0", 10));

  const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
  const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
  const thumbMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);

  return {
    id: sourceUrl.match(/\/pin\/(\d+)/)?.[1] ?? "pin",
    title: titleMatch?.[1] ?? "Pinterest Pin",
    description: descMatch?.[1] ?? "",
    thumbnail: thumbMatch?.[1] ?? "",
    mediaType: items.length > 1 ? "carousel" : "video",
    items: dedupeItems(items),
    sourceUrl,
  };
}

function extractPinimgFallback(html: string, sourceUrl: string): PinResult | null {
  const urls = [
    ...new Set(
      (html.match(/https:\/\/i\.pinimg\.com\/(?:originals|\d+x)\/[^\s"'\\]+\.(?:jpg|jpeg|png|gif|webp)/gi) ??
        [])
    ),
  ];
  if (!urls.length) return null;

  const score = (u: string) => {
    if (u.includes("/originals/")) return 10_000;
    const m = u.match(/\/(\d+)x\//);
    return m ? Number(m[1]) : 0;
  };
  urls.sort((a, b) => score(b) - score(a));

  const items: MediaItem[] = urls.slice(0, 3).map((url) => ({
    url,
    type: url.includes(".gif") ? ("gif" as const) : ("image" as const),
    format: url.split(".").pop()?.split("?")[0] ?? "jpg",
    quality: url.includes("/originals/") ? "original" : undefined,
  }));

  return {
    id: sourceUrl.match(/\/pin\/(\d+)/)?.[1] ?? "pin",
    title: "Pinterest Pin",
    description: "",
    thumbnail: items[0]?.url ?? "",
    mediaType: items.length > 1 ? "carousel" : "image",
    items: dedupeItems(items),
    sourceUrl,
  };
}

function parseOgFallback(html: string, sourceUrl: string): PinResult | null {
  const og = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)`, "i"));
    return m?.[1] ?? null;
  };
  const video = og("video");
  const image = og("image");
  const title = og("title") ?? "Pinterest Pin";
  const description = og("description") ?? "";

  const items: MediaItem[] = [];
  if (video) items.push({ url: video, type: "video", format: "mp4" });
  else if (image) items.push({ url: image, type: image.includes(".gif") ? "gif" : "image" });

  if (!items.length) return null;

  return {
    id: sourceUrl.split("/").pop() ?? "pin",
    title,
    description,
    thumbnail: image ?? video ?? "",
    mediaType: video ? "video" : "image",
    items,
    sourceUrl,
  };
}

export async function fetchPinterestPin(url: string): Promise<PinResult> {
  if (!isPinterestUrl(url)) {
    throw new Error("Invalid Pinterest URL. Use a pin link or pin.it short URL.");
  }

  return getCached(`pin:${url}`, 1000 * 60 * 10, async () => {
    const resolved = await resolveUrl(url);
    const res = await fetch(resolved, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Could not fetch pin (${res.status}). Try again in a moment.`);

    const html = await res.text();

    const v3Pin = extractV3PinFromHtml(html);
    if (v3Pin) {
      const parsed = parseV3Pin(v3Pin, resolved);
      if (parsed?.items.length) {
        const hasVideo = parsed.items.some((i) => i.type === "video");
        if (!hasVideo && /\.pinimg\.com\/videos\/.*\.mp4/i.test(html)) {
          const videoParsed = extractVideoFallback(html, resolved);
          if (videoParsed) return videoParsed;
        }
        return parsed;
      }
    }

    const jsonBlobs = extractJsonFromHtml(html);

    for (const blob of jsonBlobs) {
      const pin = findPinData(blob);
      if (
        pin &&
        (pin.videos ||
          pin.images ||
          pin.story_pin_data ||
          pin.carousel_data ||
          pin.images_orig)
      ) {
        const v3Parsed = parseV3Pin(pin, resolved);
        if (v3Parsed?.items.length) return v3Parsed;
        return parsePin(pin, resolved);
      }
    }

    const videoFallback = extractVideoFallback(html, resolved);
    if (videoFallback) return videoFallback;

    const pinimgFallback = extractPinimgFallback(html, resolved);
    if (pinimgFallback) return pinimgFallback;

    const fallback = parseOgFallback(html, resolved);
    if (fallback?.items.length) return fallback;

    throw new Error("Could not extract media from this pin. It may be private or restricted.");
  });
}
