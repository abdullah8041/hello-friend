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

type SupportedService = "youtube" | "instagram" | "tiktok" | "facebook" | "twitter";

type ApiRequest = {
  path: string;
  query: Record<string, string>;
};

const RAPIDAPI_HOST = "all-media-downloader4.p.rapidapi.com";
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

function detectService(url: string): SupportedService | null {
  if (/youtu\.be|youtube\.com|music\.youtube\.com/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  return null;
}

function extractYoutubeId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) return watchId;

    const [first, second] = parsed.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(first || "") && second) return second;
  } catch {
    const match = rawUrl.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{6,})/i);
    return match?.[1] || null;
  }

  return null;
}

function buildApiRequests(url: string): ApiRequest[] {
  const service = detectService(url);
  if (!service) {
    throw new Error("Unsupported link. Try YouTube, Instagram, TikTok, Facebook or X.");
  }

  if (service === "youtube") {
    const id = extractYoutubeId(url);
    if (!id) throw new Error("Could not read the YouTube video ID from that link.");
    return [{ path: "/api/youtube/download", query: { id } }];
  }

  if (service === "instagram") {
    return [
      { path: "/api/instagram/v1/download", query: { url } },
      { path: "/api/instagram/download", query: { url } },
      { path: "/api/instagram", query: { url } },
    ];
  }

  const endpointMap: Record<Exclude<SupportedService, "youtube" | "instagram">, string[]> = {
    tiktok: ["/api/tiktok/download"],
    facebook: ["/api/facebook/download"],
    twitter: ["/api/twitter/download", "/api/x/download"],
  };

  return endpointMap[service].map((path) => ({ path, query: { url } }));
}

function buildUrl(request: ApiRequest): string {
  const apiUrl = new URL(request.path, RAPIDAPI_BASE_URL);
  for (const [key, value] of Object.entries(request.query)) {
    apiUrl.searchParams.set(key, value);
  }
  return apiUrl.toString();
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
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

function collectMediaCandidates(value: unknown, originalUrl: string, depth = 0): DownloadMedia[] {
  if (!value || depth > 10) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMediaCandidates(item, originalUrl, depth + 1));
  }

  if (typeof value !== "object") return [];

  const record = value as Record<string, any>;
  const urlKeys = [
    "url",
    "link",
    "href",
    "download",
    "download_url",
    "downloadUrl",
    "downloadLink",
    "video",
    "videoUrl",
    "video_url",
    "play",
    "play_url",
    "audio",
    "audioUrl",
    "audio_url",
    "src",
  ];

  const directCandidates = urlKeys.flatMap((key) => {
    const candidate = record[key];
    if (!looksLikeMediaUrl(candidate) || candidate.trim() === originalUrl) return [];

    const mediaUrl = candidate.trim();
    const extension = (
      record.extension ||
      record.ext ||
      record.format ||
      record.mime?.split("/")?.[1] ||
      extensionFromUrl(mediaUrl) ||
      (mediaTypeFrom(mediaUrl, record, key) === "audio" ? "mp3" : "mp4")
    )
      .toString()
      .replace(/^\./, "")
      .toLowerCase();

    return [
      {
        url: mediaUrl,
        quality:
          record.quality ||
          record.label ||
          record.resolution ||
          record.height ||
          record.name ||
          (mediaTypeFrom(mediaUrl, record, key) === "audio" ? "Audio" : "Original"),
        extension,
        type: mediaTypeFrom(mediaUrl, record, key),
        size: record.formattedSize || record.size || record.filesize || record.fileSize || undefined,
      },
    ];
  });

  const nestedCandidates = Object.entries(record)
    .filter(([key]) => !urlKeys.includes(key))
    .flatMap(([, child]) => collectMediaCandidates(child, originalUrl, depth + 1));

  return [...directCandidates, ...nestedCandidates];
}

function normalizeDownloadResult(json: any, originalUrl: string): DownloadResult {
  const payload = json?.data || json?.result || json?.response || json;
  const title: string =
    findStringByKeys(payload, ["title", "name", "caption", "description"]) ||
    findStringByKeys(json, ["title", "name", "caption", "description"]) ||
    "Untitled video";
  const thumbnail: string =
    findStringByKeys(payload, ["thumbnail", "thumb", "cover", "poster", "image", "picture"]) ||
    findStringByKeys(json, ["thumbnail", "thumb", "cover", "poster", "image", "picture"]) ||
    "";
  const source: string = findStringByKeys(payload, ["source", "platform"]) || originalUrl;
  const duration: string | undefined = findStringByKeys(payload, ["duration", "length"]);

  const medias: DownloadMedia[] = [
    ...collectMediaCandidates(asArray(payload?.medias), originalUrl),
    ...collectMediaCandidates(asArray(payload?.links), originalUrl),
    ...collectMediaCandidates(asArray(payload?.formats), originalUrl),
    ...collectMediaCandidates(asArray(payload?.downloads), originalUrl),
    ...collectMediaCandidates(asArray(payload?.items), originalUrl),
    ...collectMediaCandidates(asArray(payload?.resources), originalUrl),
    ...collectMediaCandidates(payload, originalUrl),
    ...collectMediaCandidates(json, originalUrl),
  ]
    .filter((m: DownloadMedia, index: number, list: DownloadMedia[]) => {
      return !!m.url && list.findIndex((item) => item.url === m.url) === index;
    });

  if (medias.length === 0) {
    throw new Error(
      "No downloadable media found for that link. It may be private, region-locked, or unsupported.",
    );
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

    const requests = buildApiRequests(data.url);
    let lastError = "Downloader API did not return a usable response.";
    let lastStatus = 0;

    for (const request of requests) {
      const requestUrl = buildUrl(request);
      const res = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });

      if (res.ok) {
        const json: any = await res.json().catch(() => ({}));
        console.log(
          "[SnapFetch] RapidAPI downloader response",
          JSON.stringify({ endpoint: request.path, requestUrl, response: json }, null, 2),
        );

        try {
          return normalizeDownloadResult(json, data.url);
        } catch (error: any) {
          lastError = error?.message || "No downloadable media found in the API response.";
          if (request !== requests[requests.length - 1]) continue;
          throw error;
        }
      }

      const text = await res.text().catch(() => "");
      lastStatus = res.status;
      lastError = `Downloader API error (${res.status}). ${text.slice(0, 140)}`;
      console.warn(
        "[SnapFetch] RapidAPI downloader request failed",
        JSON.stringify({ endpoint: request.path, requestUrl, status: res.status, response: text.slice(0, 1000) }),
      );

      if (![404, 422].includes(res.status) || request === requests[requests.length - 1]) break;
    }

    throw new Error(lastStatus === 429 ? "Rate limit reached. Please try again later." : lastError);
  });
