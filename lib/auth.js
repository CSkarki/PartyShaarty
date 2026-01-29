import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "host_session";
const MAX_AGE_SEC = 24 * 60 * 60; // 24h

function getSecret() {
  const s = process.env.HOST_SESSION_SECRET || process.env.HOST_PASSWORD || "change-me";
  return s;
}

function b64urlEncode(str) {
  return Buffer.from(str, "utf8").toString("base64url");
}

function b64urlDecode(str) {
  return Buffer.from(str, "base64url").toString("utf8");
}

export function createSessionCookie() {
  const payload = b64urlEncode(JSON.stringify({ t: Date.now() }));
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const value = `${payload}.${sig}`;
  return {
    name: COOKIE_NAME,
    value,
    options: `Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`,
  };
}

export function verifySession(cookieHeader) {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim();
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  try {
    const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    const data = JSON.parse(b64urlDecode(payload));
    if (data.t && Date.now() - data.t < MAX_AGE_SEC * 1000) return true;
  } catch {
    return false;
  }
  return false;
}

export function getClearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function requireHost(request) {
  const cookie = request.headers.get("cookie") || "";
  if (!verifySession(cookie)) {
    return { ok: false, status: 401 };
  }
  return { ok: true };
}

export function validateHostCredentials(username, password) {
  const u = process.env.HOST_USERNAME;
  const p = process.env.HOST_PASSWORD;
  if (!u || !p) return false;
  if (typeof username !== "string" || typeof password !== "string") return false;
  if (username !== u) return false;
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(p, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
