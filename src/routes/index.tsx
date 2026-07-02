import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { fetchVideo, type DownloadResult } from "@/lib/downloader.functions";
import {
  Clipboard,
  Download,
  Moon,
  Sun,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Video,
  Sparkles,
  HelpCircle,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { AdsterraBanner } from "@/components/AdsterraBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SnapFetch – Download Videos from Any Platform Instantly" },
      {
        name: "description",
        content:
          "SnapFetch is a fast, free all-in-one video downloader for YouTube, Instagram, TikTok, Facebook and X. Paste a link and grab MP4 or MP3 in seconds.",
      },
      { property: "og:title", content: "SnapFetch – All-in-One Video Downloader" },
      {
        property: "og:description",
        content: "Paste any video link. Get MP4 or MP3 in seconds.",
      },
    ],
  }),
  component: Index,
});

type Platform = "youtube" | "instagram" | "tiktok" | "facebook" | "twitter";

const PLATFORMS: {
  id: Platform;
  name: string;
  patterns: RegExp[];
  Icon: typeof Youtube;
  color: string;
}[] = [
  {
    id: "youtube",
    name: "YouTube",
    patterns: [/youtube\.com/i, /youtu\.be/i],
    Icon: Youtube,
    color: "from-red-500 to-rose-600",
  },
  {
    id: "instagram",
    name: "Instagram",
    patterns: [/instagram\.com/i],
    Icon: Instagram,
    color: "from-fuchsia-500 via-pink-500 to-orange-400",
  },
  {
    id: "tiktok",
    name: "TikTok",
    patterns: [/tiktok\.com/i],
    Icon: Music2,
    color: "from-slate-800 to-slate-950",
  },
  {
    id: "facebook",
    name: "Facebook",
    patterns: [/facebook\.com/i, /fb\.watch/i],
    Icon: Facebook,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    patterns: [/twitter\.com/i, /x\.com/i],
    Icon: Twitter,
    color: "from-sky-500 to-indigo-600",
  },
];

function detectPlatform(url: string): Platform | null {
  for (const p of PLATFORMS) if (p.patterns.some((r) => r.test(url))) return p.id;
  return null;
}

function Index() {
  const [dark, setDark] = useState(true);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchVideoFn = useServerFn(fetchVideo);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const detected = useMemo(() => detectPlatform(url), [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setError("Clipboard access blocked. Paste manually.");
    }
  };

  const handleFetch = async () => {
    setError(null);
    setResult(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a video link first.");
      return;
    }
    const p = detectPlatform(trimmed);
    if (!p) {
      setError("Unsupported link. Try YouTube, Instagram, TikTok, Facebook or X.");
      return;
    }
    setLoading(true);
    setPlatform(p);
    try {
      const data = await fetchVideoFn({ data: { url: trimmed } });
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch video. Try another link.");
    } finally {
      setLoading(false);
    }
  };

  const platformMeta = platform
    ? PLATFORMS.find((pp) => pp.id === platform)!
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background text-foreground transition-colors">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/25" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/25" />
        <div className="absolute bottom-0 -left-32 h-[400px] w-[400px] rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-600/20" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <a href="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-black tracking-tight">
              Snap<span className="text-indigo-500 dark:text-indigo-400">Fetch</span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href="#how-to-use"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <HelpCircle className="h-4 w-4" /> How to Use
            </a>
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/50 text-foreground transition-colors hover:bg-accent"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Leaderboard ad */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <AdSlot label="Advertisement" className="h-20 sm:h-24" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> All-in-One Downloader
          </span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Download Videos from{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Any Platform
            </span>{" "}
            Instantly
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
            Paste a link from YouTube, Instagram, TikTok, Facebook or X — grab MP4 or MP3 in seconds. No signup, no watermarks.
          </p>
        </div>

        {/* URL bar */}
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="rounded-2xl border border-border bg-card/70 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl sm:p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:items-center">
              <div className="relative flex min-w-0 items-center">
                <LinkIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  placeholder="Paste video URL here…"
                  className="w-full min-w-0 rounded-xl bg-transparent py-3 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground sm:text-base"
                />
              </div>
              <button
                onClick={handlePaste}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm font-medium transition hover:bg-accent"
              >
                <Clipboard className="h-4 w-4" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
            <button
              onClick={handleFetch}
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-70 sm:text-base"
            >
              {loading ? (
                <>
                  <Spinner /> Fetching…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 transition group-hover:translate-y-0.5" />
                  Fetch Video
                </>
              )}
            </button>
          </div>

          {/* Platform badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {PLATFORMS.map((p) => {
              const active = detected === p.id;
              return (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "scale-105 border-transparent bg-gradient-to-r text-white shadow-lg " +
                        p.color +
                        " shadow-indigo-500/30"
                      : "border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  <p.Icon className="h-3.5 w-3.5" />
                  {p.name}
                  {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Result / loading */}
        <div className="mx-auto mt-8 max-w-3xl">
          {loading && <SkeletonCard />}
          {result && platformMeta && (
            <ResultCard result={result} platformMeta={platformMeta} />
          )}
        </div>

        {/* Square ad below result */}
        <div className="mx-auto mt-8 max-w-md">
          <AdSlot label="Advertisement" className="aspect-square sm:aspect-[4/3]" />
        </div>
      </section>

      {/* How to use */}
      <section id="how-to-use" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">
          How to Use SnapFetch
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Three steps. No account. No hassle.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Copy the link",
              d: "Grab the video URL from YouTube, Instagram, TikTok, Facebook or X.",
            },
            {
              n: "02",
              t: "Paste & fetch",
              d: "Drop it in the box above. We auto-detect the platform.",
            },
            {
              n: "03",
              t: "Download",
              d: "Pick your quality: MP4 up to 1080p or MP3 audio only.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl"
            >
              <div className="text-xs font-black text-indigo-500 dark:text-indigo-400">
                {s.n}
              </div>
              <div className="mt-2 text-lg font-bold">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 px-4 py-8 pb-24 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} SnapFetch. For personal use only. Respect content creators and platform terms.
      </footer>

      {/* Sticky anchor ad */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <AdSlot label="Advertisement" className="h-14 sm:h-16" compact />
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function AdSlot({
  label,
  className = "",
  compact = false,
}: {
  label: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-gradient-to-br from-muted/40 to-muted/10 ${className}`}
    >
      <span className="absolute left-2 top-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </span>
      <span
        className={`font-semibold text-muted-foreground/70 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        Ad space
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="aspect-video w-full rounded-xl bg-muted" />
        <div className="min-w-0 space-y-3">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="flex gap-2 pt-2">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-24 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function isAudioMedia(m: { type: string; extension: string; quality: string }) {
  return (
    m.type === "audio" ||
    /mp3|m4a|aac|ogg|wav/i.test(m.extension) ||
    /audio|mp3/i.test(m.quality)
  );
}

function qualityScore(q: string): number {
  const match = q.match(/(\d{3,4})p/i);
  if (match) return parseInt(match[1], 10);
  if (/hd|high/i.test(q)) return 720;
  if (/sd|medium/i.test(q)) return 480;
  return 0;
}

function sanitizeFilename(name: string): string {
  return (name || "download").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120).trim() || "download";
}

async function triggerDownload(downloadUrl: string, filename: string) {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    window.location.href = downloadUrl;
  }
}

function ResultCard({
  result,
  platformMeta,
}: {
  result: DownloadResult;
  platformMeta: (typeof PLATFORMS)[number];
}) {
  const { Icon } = platformMeta;
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedOther, setSelectedOther] = useState<string>("");

  const audios = result.medias.filter(isAudioMedia);
  const videos = result.medias.filter((m) => !isAudioMedia(m));
  const bestVideo =
    videos.slice().sort((a, b) => qualityScore(b.quality) - qualityScore(a.quality))[0] ||
    result.medias[0];
  const bestAudio = audios[0];
  const others = result.medias.filter((m) => m !== bestVideo && m !== bestAudio);
  const safeTitle = sanitizeFilename(result.title);

  const handleDownload = async (
    m: { url: string; extension: string; quality: string; type: string } | undefined,
    key: string,
  ) => {
    if (!m?.url) return;
    setBusy(key);
    const ext = m.extension || (isAudioMedia(m) ? "mp3" : "mp4");
    await triggerDownload(m.url, `${safeTitle}.${ext}`);
    setBusy(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
      <div className="grid gap-4 p-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:p-5">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {result.thumbnail && (
            <img
              src={result.thumbnail}
              alt={result.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${platformMeta.color} px-2 py-0.5 text-[10px] font-bold text-white shadow-lg`}
          >
            <Icon className="h-3 w-3" /> {platformMeta.name}
          </span>
          {result.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {result.duration}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-bold sm:text-xl">{result.title}</h3>
          {result.source && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{result.source}</p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDownload(bestVideo, "video")}
              disabled={!bestVideo || busy === "video"}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "video" ? (
                <><Spinner /> Preparing…</>
              ) : (
                <><Video className="h-4 w-4" /> Download Video (MP4)</>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDownload(bestAudio, "audio")}
              disabled={!bestAudio || busy === "audio"}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-3 text-sm font-bold transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "audio" ? (
                <><Spinner /> Preparing…</>
              ) : (
                <><Music2 className="h-4 w-4" /> Download Audio (MP3)</>
              )}
            </button>
          </div>

          {others.length > 0 && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Other Formats
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <select
                  value={selectedOther}
                  onChange={(e) => setSelectedOther(e.target.value)}
                  className="min-w-0 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="">Select a format…</option>
                  {others.map((m, i) => (
                    <option key={m.url + i} value={String(i)}>
                      {`${m.quality}${m.extension ? " · " + m.extension.toUpperCase() : ""}${
                        m.size ? " · " + m.size : ""
                      }`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={selectedOther === "" || busy === "other"}
                  onClick={() => {
                    const idx = parseInt(selectedOther, 10);
                    if (!Number.isNaN(idx)) handleDownload(others[idx], "other");
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "other" ? <Spinner /> : <Download className="h-4 w-4" />}
                  Get
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


