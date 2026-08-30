import { NextResponse } from "next/server";

type RateLimitEntry = { count: number; resetAt: number };

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  const key = `${bucket}:${getClientIp(req)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": retryAfter.toString() } },
    );
  }

  current.count += 1;
  return null;
}

export function rejectCrossSiteRequest(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).host === new URL(req.url).host) return null;
  } catch {
    // Invalid origins are rejected below.
  }

  return NextResponse.json(
    { success: false, error: "Cross-site request rejected" },
    { status: 403 },
  );
}

export function rejectLargeRequest(req: Request, maxBytes: number): NextResponse | null {
  const rawLength = req.headers.get("content-length");
  if (rawLength && Number(rawLength) > maxBytes) {
    return NextResponse.json(
      { success: false, error: "Request body is too large" },
      { status: 413 },
    );
  }
  return null;
}

export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return null;
  return cleaned;
}

export function cleanOptionalText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") return "";
  return cleanText(value, maxLength);
}

export function isHttpUrl(value: string, allowDataImage = false): boolean {
  if (allowDataImage && /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

