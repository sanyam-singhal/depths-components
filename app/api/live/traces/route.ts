// app/api/live/traces/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const enc = new TextEncoder();
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, "0")).join("");

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      controller.enqueue(enc.encode(`: connected\n\n`));
      const keepAlive = setInterval(() => controller.enqueue(enc.encode(`: ka\n\n`)), 15000);

      const services = ["web", "api", "auth", "billing", "search", "queue", "worker"];
      const names = ["GET /orders", "POST /checkout", "SELECT products", "PUT /profile", "Job: index-catalog"];
      const statuses = ["OK", "ERROR", "UNSET"];

      const tick = setInterval(() => {
        const dur = Math.max(5, Math.round(Math.random() * 1200));
        const row = {
          trace_id: hex(16),
          span_id: hex(8),
          name: names[Math.floor(Math.random() * names.length)],
          dur_ms: dur,
          status: dur > 900 ? "ERROR" : statuses[Math.floor(Math.random() * statuses.length)],
          ts: Date.now(),
          service: services[Math.floor(Math.random() * services.length)],
          attributes: { region: ["us-east-1", "eu-west-1", "ap-south-1"][Math.floor(Math.random() * 3)] },
        };
        send(row);
      }, 750);

      const close = () => { clearInterval(tick); clearInterval(keepAlive); try { controller.close(); } catch {} };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
