// A small in-memory sliding-window limiter for the AI routes. Per server instance, which is
// enough to stop a stuck client or a casual abuser burning credit during a demo.

export function createLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear(); // keep memory bounded
    return true;
  };
}

/** Best-effort client key from proxy headers; falls back to one shared bucket. */
export function clientKey(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "local";
}
