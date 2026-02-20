/**
 * Meta WhatsApp Cloud API helpers — pure fetch, no SDK.
 *
 * Required env vars:
 *   WHATSAPP_ACCESS_TOKEN      – Permanent access token from Meta Business Suite
 *   WHATSAPP_PHONE_NUMBER_ID   – Phone Number ID (from Meta → WhatsApp → API Setup)
 *
 * Optional env var (for webhook verification):
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN – Any secret string you set in Meta app dashboard
 *
 * Message types:
 *   sendWhatsApp()         – Free-form text (works in test mode; production requires
 *                            an open 24-hour customer-service window OR approved templates)
 *   sendWhatsAppTemplate() – Template message (business-initiated, no 24h limit)
 *                            Templates must be approved by Meta before use.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

const GRAPH_VERSION = "v21.0";

function apiUrl() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID is not set");
  return `https://graph.facebook.com/${GRAPH_VERSION}/${id}/messages`;
}

function authHeaders() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN is not set");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Normalise phone to E.164 digits without leading + (Meta format). */
function toMetaPhone(phone) {
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

async function postToMeta(payload) {
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `WhatsApp API error ${res.status}`);
  }
  return await res.json();
}

/**
 * Send a free-form WhatsApp text message.
 *
 * ⚠️  Production note: Meta only allows free-form messages within an open
 * 24-hour customer-service window (i.e. the guest messaged you first).
 * For business-initiated outbound (reminders / thank-yous), use
 * sendWhatsAppTemplate() with a Meta-approved template instead.
 *
 * During development, Meta's test phone number accepts free-form messages
 * to any number added as a test recipient in the Meta dashboard.
 *
 * @param {{ to: string, body: string }} opts
 */
export async function sendWhatsApp({ to, body }) {
  return postToMeta({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toMetaPhone(to),
    type: "text",
    text: { preview_url: false, body },
  });
}

/**
 * Send a WhatsApp template message (business-initiated, no 24h restriction).
 *
 * Templates must be created + approved in Meta Business Suite before use.
 * Example reminder template body: "Hi {{1}}, just a reminder that {{2}} is on {{3}}!"
 *
 * @param {{
 *   to: string,
 *   templateName: string,
 *   languageCode?: string,
 *   components?: object[]
 * }} opts
 *
 * Example usage:
 *   await sendWhatsAppTemplate({
 *     to: "+919876543210",
 *     templateName: "event_reminder",
 *     languageCode: "en_US",
 *     components: [{
 *       type: "body",
 *       parameters: [
 *         { type: "text", text: "Priya" },
 *         { type: "text", text: "Chander's Birthday Party" },
 *         { type: "text", text: "Feb 21 at 7 PM" },
 *       ]
 *     }]
 *   });
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "en_US",
  components = [],
}) {
  return postToMeta({
    messaging_product: "whatsapp",
    to: toMetaPhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}
