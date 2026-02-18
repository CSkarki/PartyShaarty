import { requireHost } from "../../../../lib/auth";
import { sendEmail } from "../../../../lib/mailer";

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#c4a45a;">${url}</a>`
  );
}

export async function POST(request) {
  const auth = requireHost(request);
  if (!auth.ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipients, subject, message, imageUrls, uploadedImages } =
    await request.json();

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return Response.json({ error: "No recipients selected" }, { status: 400 });
  }
  if (!subject || !subject.trim()) {
    return Response.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!message || !message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  // URL-based images
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  const urlImagesHtml = urls
    .map(
      (url) =>
        `<img src="${url}" alt="Party photo" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;display:block;" />`
    )
    .join("");

  // File-uploaded images → Nodemailer attachments with CID
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
  for (const { name, email } of recipients) {
    const firstName = (name || "").split(" ")[0] || "Guest";
    try {
      await sendEmail({
        to: email,
        subject: subject.trim(),
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <p style="font-size:16px;">Hi ${firstName},</p>
          <p style="font-size:16px;">${linkify(message.trim()).replace(/\n/g, "<br>")}</p>
          ${allImagesHtml}
        </div>`,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      results.push({ email, status: "sent" });
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err.message);
      results.push({ email, status: "failed", error: err.message });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return Response.json({ sent, failed, results });
}
