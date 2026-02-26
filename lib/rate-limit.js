import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Module-level cache — avoids creating a new Redis connection on every request
let limiters = null;

function getLimiters() {
  if (limiters) return limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. " +
        "Rate limiting is DISABLED. Set these vars in production."
    );
    return null;
  }

  const redis = new Redis({ url, token });

  limiters = {
    // Public RSVP submissions: 10 per minute per IP
    rsvp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "rl:rsvp",
      analytics: false,
    }),
    // Gallery OTP sends: 5 per 10 minutes per IP
    galleryVerify: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "rl:gallery-verify",
      analytics: false,
    }),
  };

  return limiters;
}

/**
 * Check rate limit for the given key and identifier.
 * @param {"rsvp" | "galleryVerify"} key
 * @param {string} identifier  IP address or other unique identifier
 * @returns {{ limited: false } | { limited: true, retryAfter: number }}
 */
export async function checkRateLimit(key, identifier) {
  const l = getLimiters();
  if (!l) return { limited: false }; // graceful degradation when unconfigured

  const { success, reset } = await l[key].limit(identifier);
  if (success) return { limited: false };

  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return { limited: true, retryAfter };
}
