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

type Result = {
  platform: Platform;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
};

function Index() {
  const [dark, setDark] = useState(true);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const detected = useMemo(() => detectPlatform(url), [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setError("Clipboard access blocked. Paste manually.");
    }
  };

  const handleFetch = () => {
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError("Please paste a video link first.");
      return;
    }
    const platform = detectPlatform(url);
    if (!platform) {
      setError("Unsupported link. Try YouTube, Instagram, TikTok, Facebook or X.");
      return;
    }
    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      setResult({
        platform,
        title:
          platform === "youtube"
            ? "How I Built a Startup in 30 Days — The Full Journey"
            : platform === "tiktok"
            ? "This trick will change your morning ☀️"
            : platform === "instagram"
            ? "Reel: Golden hour in Lisbon"
            : platform === "facebook"
            ? "Watch: Highlights from the weekend"
            : "Thread video — must watch",
        channel:
          platform === "youtube"
            ? "Indie Makers"
            : platform === "tiktok"
            ? "@dailyhabits"
            : platform === "instagram"
            ? "@travel.frames"
            : platform === "facebook"
            ? "Global News"
            : "@techdaily",
        duration:
          platform === "tiktok" || platform === "instagram" ? "0:32" : "8:42",
        thumbnail: `https://images.unsplash.com/photo-${
          platform === "youtube"
            ? "1611162617213-7d7a39e9b1d7"
            : platform === "tiktok"
            ? "1611605698335-8b1569810432"
            : platform === "instagram"
            ? "1519681393784-d120267933ba"
            : platform === "facebook"
            ? "1524504388940-b1c1722653e1"
            : "1611162616305-c69b3fa7fbe0"
        }?w=800&q=80&auto=format&fit=crop`,
      });
      setLoading(false);
    }, 1600);
  };

  const platformMeta = result
    ? PLATFORMS.find((p) => p.id === result.platform)!
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

function ResultCard({
  result,
  platformMeta,
}: {
  result: Result;
  platformMeta: (typeof PLATFORMS)[number];
}) {
  const qualities = [
    { label: "1080p MP4", size: "48 MB", icon: Video, primary: true },
    { label: "720p MP4", size: "26 MB", icon: Video },
    { label: "480p MP4", size: "14 MB", icon: Video },
    { label: "MP3 Audio", size: "6 MB", icon: Music2 },
  ];
  const { Icon } = platformMeta;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
      <div className="grid gap-4 p-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:p-5">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          <img
            src={result.thumbnail}
            alt={result.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${platformMeta.color} px-2 py-0.5 text-[10px] font-bold text-white shadow-lg`}
          >
            <Icon className="h-3 w-3" /> {platformMeta.name}
          </span>
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {result.duration}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold sm:text-xl">{result.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{result.channel}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {qualities.map((q) => (
              <button
                key={q.label}
                className={`group inline-flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  q.primary
                    ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-violet-500/40"
                    : "border-border bg-background/60 hover:bg-accent"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <q.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{q.label}</span>
                </span>
                <span
                  className={`text-xs font-medium ${
                    q.primary ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {q.size}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
