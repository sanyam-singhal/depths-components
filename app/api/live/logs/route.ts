// app/api/live/logs/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";                 // long-lived connection on Node runtime
export const dynamic = "force-dynamic";          // opt out of caching for streaming
export const revalidate = 0;

function rand<T>(xs: T[]) { return xs[Math.floor(Math.random() * xs.length)]; }

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      // Initial comment & keepalive line so proxies don’t idle-timeout.
      controller.enqueue(encoder.encode(`: connected\n\n`));
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(`: ka\n\n`)), 15000);

      const services = ["web", "api", "auth", "billing", "search", "queue", "worker"];
      const severities = ["trace", "debug", "info", "warn", "error"];
      const messages = [
        "processing request",
        "completed job",
        "cache miss",
        "db query slow",
        "retry scheduled",
        "user authenticated",
        "payment captured",
      ];

      const tick = setInterval(() => {
        const row = {
          ts: Date.now(),
          severity: rand(severities),
          service: rand(services),
          body: rand(messages),
        };
        send(row);
      }, 600);

      // Close handling
      const close = () => {
        clearInterval(tick);
        clearInterval(keepAlive);
        try { controller.close(); } catch {}
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // Helps disable proxy buffering (e.g., Nginx) for SSE:
      "X-Accel-Buffering": "no",
    },
  });
}
