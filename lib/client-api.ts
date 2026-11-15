"use client";

// Browser side of the API contract: a per-tab session id on every request, and a reader for the
// server-sent event streams the AI routes return.

const KEY = "mosaic-session-id";

/** One id per browser tab, so the agent log can group a student's requests without knowing who they are. */
export function sessionId(): string {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = `s-${crypto.randomUUID().slice(0, 18)}`;
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "content-type": "application/json", "x-mosaic-session": sessionId(), ...extra };
}

/** Reads a server-sent event stream, calling onEvent for each event/data pair. */
export async function readSSE(res: Response, onEvent: (event: string, data: unknown) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = chunk.match(/^event: (.*)$/m)?.[1] ?? "message";
      const data = chunk.match(/^data: (.*)$/m)?.[1];
      if (data !== undefined) onEvent(event, JSON.parse(data));
    }
  }
}
