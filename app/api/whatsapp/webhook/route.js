/**
 * Meta WhatsApp Cloud API Webhook
 *
 * GET  — Hub verification challenge (Meta calls this once when you register the webhook URL)
 * POST — Incoming status updates + inbound messages from guests
 *
 * Setup in Meta App Dashboard:
 *   Webhook URL:   https://your-domain.com/api/whatsapp/webhook
 *   Verify Token:  same value as WHATSAPP_WEBHOOK_VERIFY_TOKEN env var
 *   Subscribe to:  messages
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  // Meta requires a 200 response within 20 seconds.
  // Parse and log events; extend this to handle delivery receipts or replies.
  try {
    const body = await request.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (changes?.statuses) {
      // Delivery / read receipts
      for (const s of changes.statuses) {
        console.log(`WhatsApp status [${s.id}]: ${s.status} → ${s.recipient_id}`);
      }
    }

    if (changes?.messages) {
      // Inbound messages from guests
      for (const m of changes.messages) {
        console.log(`WhatsApp inbound from ${m.from}: ${m.text?.body ?? m.type}`);
      }
    }
  } catch (err) {
    console.error("WhatsApp webhook parse error:", err.message);
  }

  return Response.json({ ok: true });
}
