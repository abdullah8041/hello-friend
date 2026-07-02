import { createFileRoute } from "@tanstack/react-router";

function safeFilename(name: string, fallbackExt: string): string {
  const cleaned = (name || "snapfetch").replace(/[\\/:*?"<>|\r\n]+/g, "_").slice(0, 120);
  if (/\.[a-z0-9]{2,5}$/i.test(cleaned)) return cleaned;
  return `${cleaned}.${(fallbackExt || "mp4").replace(/^\./, "")}`;
}

export const Route = createFileRoute("/api/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const target = params.get("url");
        const filenameParam = params.get("filename") || "snapfetch";
        const ext = params.get("ext") || "mp4";

        if (!target || !/^https?:\/\//i.test(target)) {
          return new Response("Missing or invalid url", { status: 400 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(target, {
            headers: {
              // Some CDNs (Instagram/Facebook) require a browser-like UA and referer.
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              accept: "*/*",
            },
            redirect: "follow",
          });
        } catch (error: any) {
          return new Response(`Upstream fetch failed: ${error?.message || error}`, { status: 502 });
        }

        if (!upstream.ok || !upstream.body) {
          return new Response(`Upstream error ${upstream.status}`, { status: 502 });
        }

        const filename = safeFilename(filenameParam, ext);
        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const contentLength = upstream.headers.get("content-length");

        const headers = new Headers({
          "content-type": contentType,
          "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "cache-control": "no-store",
        });
        if (contentLength) headers.set("content-length", contentLength);

        return new Response(upstream.body, { status: 200, headers });
      },
    },
  },
});
