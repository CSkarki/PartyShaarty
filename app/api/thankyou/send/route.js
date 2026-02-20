import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { sendEmail } from "../../../../lib/mailer";
import { sendWhatsApp } from "../../../../lib/messenger";

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#c4a45a;">${url}</a>`
  );
}

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  let user, profile;
  try {
    ({ user, profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { recipients, subject, message, imageUrls, uploadedImages, channel = "email" } =
    await request.json();

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return Response.json({ error: "No recipients selected" }, { status: 400 });
  }
  if (!message || !message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }
  if (channel === "email" && (!subject || !subject.trim())) {
    return Response.json({ error: "Subject is required for email" }, { status: 400 });
  }
  if (!["email", "whatsapp"].includes(channel)) {
    return Response.json({ error: "Invalid channel" }, { status: 400 });
  }

  // Build image HTML (email only)
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  const urlImagesHtml = urls
    .map(
      (url) =>
        `<img src="${url}" alt="Party photo" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;display:block;" />`
    )
    .join("");

  const uploads = Array.isArray(uploadedImages) ? uploadedImages : [];
  const attachments = uploads.map((img, i) => {
    const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const ext = (img.name || "photo.jpg").split(".").pop() || "jpg";
    const filename = `photo-${i + 1}.${ext}`;
    return {
      filename,
      content: Buffer.from(base64, "base64"),
      cid: `upload-${i}`,
    };
  });
  const uploadImagesHtml = attachments
    .map(
      (att) =>
        `<img src="cid:${att.cid}" alt="Party photo" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;display:block;" />`
    )
    .join("");
  const allImagesHtml =
    urlImagesHtml || uploadImagesHtml
      ? `<div style="margin:24px 0;">${urlImagesHtml}${uploadImagesHtml}</div>`
      : "";

  const results = [];

  for (const { name, email, phone } of recipients) {
    const firstName = (name || "").split(" ")[0] || "Guest";

    if (channel === "email") {
      try {
        await sendEmail({
          to: email,
          subject: subject.trim(),
          replyTo: user.email,
          html: `<div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
            <p style="font-size:16px;">Hi ${firstName},</p>
            <p style="font-size:16px;">${linkify(message.trim()).replace(/\n/g, "<br>")}</p>
            ${allImagesHtml}
          </div>`,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        results.push({ email, status: "sent" });
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err.message);
        results.push({ email, status: "failed", error: err.message });
      }
    } else if (channel === "whatsapp") {
      if (!phone) {
        results.push({ email, status: "skipped", error: "No phone number" });
        continue;
      }
      try {
        await sendWhatsApp({ to: phone, body: `Hi ${firstName}, ${message.trim()}` });
        results.push({ email, phone, status: "sent" });
      } catch (err) {
        console.error(`Failed to send WhatsApp to ${phone}:`, err.message);
        results.push({ email, phone, status: "failed", error: err.message });
      }
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return Response.json({ sent, failed, skipped, results });
}
