// Agent log: a small in-memory record of what each agent did, per session. The teacher studio
// reads it, so humans can inspect the AI's reasoning steps. Per server instance; capped.

export type LogEntry = {
  at: number;
  session: string;
  agent: "guard" | "designer" | "verifier" | "coach" | "teacher";
  event: string;
  detail?: string;
};

const MAX = 500;
const entries: LogEntry[] = [];

export function log(e: Omit<LogEntry, "at">) {
  entries.push({ ...e, at: Date.now() });
  if (entries.length > MAX) entries.splice(0, entries.length - MAX);
}

export function recentLogs(limit = 100): LogEntry[] {
  return entries.slice(-limit).reverse();
}

/** Session ids come from the browser (one per tab); anything odd becomes "anonymous". */
export function sessionOf(headers: Headers): string {
  const s = headers.get("x-mosaic-session") ?? "";
  return /^[a-z0-9-]{8,40}$/i.test(s) ? s : "anonymous";
}
