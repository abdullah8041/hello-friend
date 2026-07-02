import { createServerFn } from "@tanstack/react-start";

export type DownloadMedia = {
  url: string;
  quality: string;
  extension: string;
  type: string; // "video" | "audio" | "image"
  size?: string;
};

export type DownloadResult = {
  title: string;
  thumbnail: string;
  source: string;
  duration?: string;
  medias: DownloadMedia[];
};

const RAPIDAPI_HOST = "fastsaver-instagram-tiktok-pinterest-media-downloader.p.rapidapi.com";
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

function looksLikeMediaUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function extensionFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    return match?.[1]?.toLowerCase();
  } catch {
    const match = url.match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i);
    return match?.[1]?.toLowerCase();
  }
}

function mediaTypeFrom(url: string, record: Record<string, any>, urlKey: string): string {
  const descriptor = `${record.type || ""} ${record.mime || ""} ${record.format || ""} ${urlKey} ${url}`;
  if (/audio|mp3|m4a|aac|opus/i.test(descriptor)) return "audio";
  if (/image|photo|jpg|jpeg|png|webp/i.test(descriptor)) return "image";
  return "video";
}

function findStringByKeys(value: unknown, keys: string[], depth = 0): string | undefined {
  if (!value || depth > 8) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKeys(item, keys, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  for (const child of Object.values(record)) {
    const found = findStringByKeys(child, keys, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function collectMediaCandidates(value: unknown, originalUrl: string, depth = 0): DownloadMedia[] {
  if (!value || depth > 10) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMediaCandidates(item, originalUrl, depth + 1));
  }
  if (typeof value !== "object") return [];
  const record = value as Record<string, any>;
  const urlKeys = [
    "url", "link", "href", "download", "download_url", "downloadUrl", "downloadLink",
    "video", "videoUrl", "video_url", "play", "play_url", "audio", "audioUrl", "audio_url", "src",
  ];

  const directCandidates: DownloadMedia[] = urlKeys.flatMap((key) => {
    const candidate = record[key];
    if (!looksLikeMediaUrl(candidate) || candidate.trim() === originalUrl) return [];
    const mediaUrl = candidate.trim();
    const type = mediaTypeFrom(mediaUrl, record, key);
    const extension = (
      record.extension || record.ext || record.format ||
      record.mime?.split?.("/")?.[1] ||
      extensionFromUrl(mediaUrl) ||
      (type === "audio" ? "mp3" : type === "image" ? "jpg" : "mp4")
    ).toString().replace(/^\./, "").toLowerCase();

    return [{
      url: mediaUrl,
      quality:
        record.quality || record.label || record.resolution ||
        (record.height ? `${record.height}p` : undefined) ||
        record.name || (type === "audio" ? "Audio" : "Original"),
      extension,
      type,
      size: record.formattedSize || record.size || record.filesize || record.fileSize || undefined,
    }];
  });

  const nestedCandidates = Object.entries(record)
    .filter(([key]) => !urlKeys.includes(key))
    .flatMap(([, child]) => collectMediaCandidates(child, originalUrl, depth + 1));

  return [...directCandidates, ...nestedCandidates];
}

function normalizeDownloadResult(json: any, originalUrl: string): DownloadResult {
  const payload = json?.data || json?.result || json?.response || json;
  const title =
    findStringByKeys(payload, ["title", "name", "caption", "description", "text"]) || "Untitled video";
  const thumbnail =
    findStringByKeys(payload, ["thumbnail", "thumb", "cover", "poster", "image", "picture", "preview"]) || "";
  const source = findStringByKeys(payload, ["source", "platform"]) || originalUrl;
  const duration = findStringByKeys(payload, ["duration", "length"]);

  const medias = collectMediaCandidates(payload, originalUrl)
    .filter((m, i, list) => !!m.url && list.findIndex((x) => x.url === m.url) === i);

  if (medias.length === 0) {
    throw new Error("No downloadable media found for that link. It may be private or unsupported.");
  }

  return { title, thumbnail, source, duration, medias };
}

export const fetchVideo = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string" || !input.url.trim()) {
      throw new Error("A video URL is required.");
    }
    return { url: input.url.trim() };
  })
  .handler(async ({ data }): Promise<DownloadResult> => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) throw new Error("Server is missing RAPIDAPI_KEY.");

    const endpoint = `${RAPIDAPI_BASE_URL}/fetch?url=${encodeURIComponent(data.url)}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[SnapFetch] FastSaver API error", { status: res.status, body: text.slice(0, 1000) });
      if (res.status === 429) throw new Error("Rate limit reached. Please try again later.");
      throw new Error(`Downloader API error (${res.status}). ${text.slice(0, 140)}`);
    }

    const json: any = await res.json().catch(() => ({}));
    console.log("[SnapFetch] FastSaver API response", JSON.stringify(json, null, 2));

    return normalizeDownloadResult(json, data.url);
  });
