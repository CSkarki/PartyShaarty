import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "guest_session";
const MAX_AGE_SEC = 2 * 60 * 60; // 2h

function getSecret() {
  const secret = process.env.GUEST_SESSION_SECRET || process.env.HOST_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "GUEST_SESSION_SECRET env var is not set. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}

function b64urlEncode(str) {
  return Buffer.from(str, "utf8").toString("base64url");
}

function b64urlDecode(str) {
  return Buffer.from(str, "base64url").toString("utf8");
}

/** Create a signed guest session cookie for a verified email + eventSlug. */
export function createGuestSession(email, eventSlug) {
  const payload = b64urlEncode(JSON.stringify({ email, eventSlug, t: Date.now() }));
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const value = `${payload}.${sig}`;
  return {
    name: COOKIE_NAME,
    value,
    options: `Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`,
  };
}

/**
 * Verify guest session cookie.
 * Returns { ok, email, eventSlug } or { ok: false }.
 * If expectedEventSlug is provided, validates the cookie is for that event.
 * Also accepts the legacy hostSlug field for cookies issued before multi-event.
 */
export function verifyGuestSession(cookieHeader, expectedEventSlug) {
  if (!cookieHeader) return { ok: false };
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim();
  if (!raw) return { ok: false };
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return { ok: false };
  try {
    const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (
      expected.length !== sig.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      return { ok: false };
    }
    const data = JSON.parse(b64urlDecode(payload));
    if (!data.t || Date.now() - data.t >= MAX_AGE_SEC * 1000) return { ok: false };
    // Support both new eventSlug and legacy hostSlug cookie fields
    const cookieSlug = data.eventSlug || data.hostSlug;
    if (expectedEventSlug && cookieSlug !== expectedEventSlug) return { ok: false };
    return { ok: true, email: data.email, eventSlug: cookieSlug };
  } catch {
    return { ok: false };
  }
}

/** Middleware helper: require a valid guest session for a specific event. */
export function requireGuest(request, expectedEventSlug) {
  const cookie = request.headers.get("cookie") || "";
  return verifyGuestSession(cookie, expectedEventSlug);
}
