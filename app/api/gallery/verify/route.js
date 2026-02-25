import { createGuestSession } from "../../../../lib/guest-auth";
import { sendEmail } from "../../../../lib/mailer";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { createHash, randomFillSync } from "crypto";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateOTP() {
  const bytes = Buffer.alloc(4);
  randomFillSync(bytes);
  return String(bytes.readUInt32BE(0) % 1000000).padStart(6, "0");
}

function hashOTP(code) {
  return createHash("sha256").update(String(code)).digest("hex");
}

/**
 * POST { email, eventSlug }           → send OTP
 * POST { email, eventSlug, code }     → verify OTP, issue guest session cookie
 * Also accepts hostSlug for legacy backward compat.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, code } = body;
  // Accept eventSlug (new) or hostSlug (legacy)
  const eventSlug = body.eventSlug || body.hostSlug;

  if (!email || typeof email !== "string" || !email.trim()) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }
  if (!eventSlug || typeof eventSlug !== "string") {
    return Response.json({ error: "Event not specified" }, { status: 400 });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();

  // Resolve event from slug
  const { data: event } = await admin
    .from("events")
    .select("id, host_id")
    .eq("slug", eventSlug)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  // Check email exists in this event's RSVP list with attending = yes
  const { data: rsvp } = await admin
    .from("invite_rsvps")
    .select("email")
    .eq("event_id", event.id)
    .ilike("email", trimmedEmail)
    .ilike("attending", "yes")
    .single();

  if (!rsvp) {
    return Response.json(
      { error: "Email not found. Only guests who RSVP'd Yes can view photos." },
      { status: 403 }
    );
  }

  // ---- Step 2: Verify OTP ----
  if (code) {
    const { data: otpRecord } = await admin
      .from("otp_codes")
      .select("*")
      .eq("event_id", event.id)
      .ilike("email", trimmedEmail)
      .single();

    if (!otpRecord) {
      return Response.json({ error: "No code sent. Request a new one." }, { status: 400 });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await admin.from("otp_codes").delete().eq("id", otpRecord.id);
      return Response.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await admin.from("otp_codes").delete().eq("id", otpRecord.id);
      return Response.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    const submittedHash = hashOTP(String(code).trim());
    if (submittedHash !== otpRecord.code_hash) {
      await admin
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remaining = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return Response.json(
        { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    // Valid — delete OTP and issue guest session
    await admin.from("otp_codes").delete().eq("id", otpRecord.id);

    const session = createGuestSession(trimmedEmail, eventSlug);
    return new Response(JSON.stringify({ ok: true, verified: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${session.name}=${session.value}; ${session.options}`,
      },
    });
  }

  // ---- Step 1: Generate and send OTP ----
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  // Delete any existing OTP for this event+email, then insert fresh one.
  await admin
    .from("otp_codes")
    .delete()
    .eq("event_id", event.id)
    .ilike("email", trimmedEmail);

  const { error: insertErr } = await admin.from("otp_codes").insert({
    host_id: event.host_id,
    event_id: event.id,
    email: trimmedEmail,
    code_hash: hashOTP(otp),
    expires_at: expiresAt,
    attempts: 0,
  });

  if (insertErr) {
    console.error("OTP insert error:", insertErr.message);
    return Response.json({ error: "Failed to generate code." }, { status: 500 });
  }

  try {
    await sendEmail({
      to: trimmedEmail,
      subject: "Your Gallery Access Code",
      html: `<div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:400px;margin:0 auto;padding:20px;text-align:center;">
        <h2 style="margin-bottom:8px;">Gallery Access Code</h2>
        <p style="color:#666;margin-bottom:24px;">Use this code to view event photos</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:24px;">${otp}</div>
        <p style="font-size:14px;color:#999;">This code expires in 10 minutes.</p>
      </div>`,
    });
  } catch (err) {
    console.error("Failed to send OTP:", err.message);
    // Clean up the OTP we just inserted
    await admin.from("otp_codes").delete().eq("event_id", event.id).ilike("email", trimmedEmail);
    return Response.json({ error: "Failed to send verification code." }, { status: 500 });
  }

  return Response.json({ ok: true, codeSent: true });
}
