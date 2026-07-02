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

  const primaryPath = `/api/${service}/download`;
  const fallbackPaths =
    service === "twitter"
      ? ["/api/x/download", "/api/twitter/download"]
      : [primaryPath];

  return [...new Set(fallbackPaths)].map((path) => ({ path, query: { url } }));
}

function buildUrl(request: ApiRequest): string {
  const apiUrl = new URL(request.path, `https://${RAPIDAPI_HOST}`);
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

function normalizeDownloadResult(json: any, originalUrl: string): DownloadResult {
  const payload = json?.data || json?.result || json?.response || json;
  const title: string =
    payload?.title || payload?.name || payload?.caption || json?.title || "Untitled video";
  const thumbnail: string =
    payload?.thumbnail ||
    payload?.thumb ||
    payload?.cover ||
    payload?.image ||
    payload?.picture ||
    json?.thumbnail ||
    "";
  const source: string = payload?.source || payload?.platform || json?.source || originalUrl;
  const duration: string | undefined = payload?.duration || payload?.length || json?.duration;

  const rawMedias: any[] = [
    ...asArray(payload?.medias),
    ...asArray(payload?.links),
    ...asArray(payload?.formats),
    ...asArray(payload?.download),
    ...asArray(payload?.downloads),
    ...asArray(payload?.urls),
    ...asArray(json?.medias),
    ...asArray(json?.links),
    ...asArray(json?.formats),
  ];

  const directUrl =
    payload?.url || payload?.download_url || payload?.downloadUrl || payload?.video || payload?.videoUrl;
  if (typeof directUrl === "string") {
    rawMedias.push({ url: directUrl, quality: payload?.quality || "Original", type: "video" });
  }

  const audioUrl = payload?.audio || payload?.audioUrl || payload?.music;
  if (typeof audioUrl === "string") {
    rawMedias.push({ url: audioUrl, quality: "Audio", type: "audio", extension: "mp3" });
  }

  const medias: DownloadMedia[] = rawMedias
    .map((m: any) => {
      const mediaUrl = m?.url || m?.link || m?.download_url || m?.downloadUrl || m?.href || "";
      const extension = (m?.extension || m?.ext || m?.format || m?.mime?.split("/")?.[1] || "mp4")
        .toString()
        .replace(/^\./, "");
      const inferredType = /mp3|m4a|audio/i.test(`${m?.type || ""} ${extension}`) ? "audio" : "video";

      return {
        url: mediaUrl,
        quality: m?.quality || m?.label || m?.resolution || m?.name || m?.type || "Original",
        extension,
        type: (m?.type || inferredType).toString().toLowerCase(),
        size: m?.formattedSize || m?.size || m?.filesize || undefined,
      };
    })
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
    let lastError = "";

    for (const request of requests) {
      const res = await fetch(buildUrl(request), {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });

      if (res.ok) {
        const json: any = await res.json().catch(() => ({}));
        return normalizeDownloadResult(json, data.url);
      }

      const text = await res.text().catch(() => "");
      lastError = `Downloader API error (${res.status}). ${text.slice(0, 140)}`;

      if (res.status !== 404) break;
    }

    throw new Error(
      lastError.includes("429") ? "Rate limit reached. Please try again later." : lastError,
    );
  });
