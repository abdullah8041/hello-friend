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

    const host = "all-media-downloader4.p.rapidapi.com";
    const res = await fetch(`https://${host}/video`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
      },
      body: JSON.stringify({ url: data.url }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        res.status === 429
          ? "Rate limit reached. Please try again later."
          : `Downloader API error (${res.status}). ${text.slice(0, 140)}`,
      );
    }

    const json: any = await res.json().catch(() => ({}));

    // Normalize across possible response shapes returned by the provider.
    const title: string =
      json.title || json.data?.title || json.result?.title || "Untitled video";
    const thumbnail: string =
      json.thumbnail ||
      json.picture ||
      json.data?.thumbnail ||
      json.data?.picture ||
      json.result?.thumbnail ||
      "";
    const source: string =
      json.source || json.data?.source || json.result?.source || "";
    const duration: string | undefined =
      json.duration || json.data?.duration || json.result?.duration;

    const rawMedias: any[] =
      json.medias ||
      json.data?.medias ||
      json.result?.medias ||
      json.links ||
      json.data?.links ||
      [];

    const medias: DownloadMedia[] = rawMedias
      .map((m: any) => ({
        url: m.url || m.link || "",
        quality:
          m.quality || m.label || m.resolution || m.type || "Original",
        extension: m.extension || m.ext || m.format || "mp4",
        type: (m.type || (m.audio ? "audio" : "video")).toString().toLowerCase(),
        size: m.formattedSize || m.size || undefined,
      }))
      .filter((m: DownloadMedia) => !!m.url);

    if (medias.length === 0) {
      throw new Error(
        "No downloadable media found for that link. It may be private, region-locked, or unsupported.",
      );
    }

    return { title, thumbnail, source, duration, medias };
  });
