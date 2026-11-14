// Shareable simulation links: the spec travels in the URL (base64url JSON), so an experiment
// built by the agent (in the app or over MCP) opens at /lab/s?d=… with no database. The page
// runs checkSpec on whatever arrives, like any other untrusted spec.

import type { SimSpec } from "@/lib/sim/spec";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeSpec(spec: SimSpec): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(spec)));
}

/** Returns the parsed JSON, or null if the string isn't valid base64url JSON. Not yet checked. */
export function decodeSpec(d: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(d)));
  } catch {
    return null;
  }
}

export const MAX_SHARE_LENGTH = 12_000;

export function shareUrl(spec: SimSpec, base = "http://localhost:3000"): string {
  return `${base.replace(/\/$/, "")}/lab/s?d=${encodeSpec(spec)}`;
}
