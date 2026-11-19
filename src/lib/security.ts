import { timingSafeEqual } from "crypto";

export const MAX_JSON_BYTES = 4_096;
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const CREATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 20 };
export const JOIN_LIMIT = { windowMs: 60 * 60 * 1000, max: 60 };

const globalRate = globalThis as typeof globalThis & {
  __planningPokerRate?: Map<string, number[]>;
};

function rateMap() {
  if (!globalRate.__planningPokerRate) {
    globalRate.__planningPokerRate = new Map();
  }
  return globalRate.__planningPokerRate;
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function allowRequest(
  key: string,
  limit: { windowMs: number; max: number },
) {
  const now = Date.now();
  const map = rateMap();
  const recent = (map.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (recent.length >= limit.max) {
    map.set(key, recent);
    return false;
  }
  recent.push(now);
  map.set(key, recent);
  return true;
}

export async function readJsonBody<T>(
  request: Request,
): Promise<{ ok: true; body: T } | { ok: false; error: string }> {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (Number.isFinite(length) && length > MAX_JSON_BYTES) {
      return { ok: false, error: "Request body too large" };
    }
  }

  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) {
    return { ok: false, error: "Request body too large" };
  }
  if (!text) {
    return { ok: true, body: {} as T };
  }
  try {
    return { ok: true, body: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
