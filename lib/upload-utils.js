import sharp from "sharp";

const MAX_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "10", 10);
const MAX_BYTES = MAX_MB * 1024 * 1024;

/**
 * Check declared file size BEFORE reading into memory.
 * Returns { ok: true } or { ok: false, error, status }.
 */
export function validateFileSize(file) {
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `File exceeds ${MAX_MB} MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      status: 413,
    };
  }
  return { ok: true };
}

/**
 * Confirm buffer is a real image by asking sharp to decode its header.
 * Catches files with a spoofed MIME type or extension.
 * Returns { ok: true, metadata } or { ok: false, error, status }.
 */
export async function validateImageBuffer(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      return { ok: false, error: "Unrecognised image format", status: 415 };
    }
    return { ok: true, metadata };
  } catch {
    return { ok: false, error: "File is not a valid image", status: 415 };
  }
}

/**
 * Re-encode buffer through sharp, stripping all EXIF metadata
 * (GPS, device model, timestamps) while preserving image orientation.
 * Sharp strips metadata by default — no .withMetadata() needed.
 * Returns a new Buffer safe to upload.
 */
export async function stripExifAndReencode(buffer, format) {
  const supportedFormats = ["jpeg", "png", "webp", "gif", "avif"];
  const outputFormat = supportedFormats.includes(format) ? format : "jpeg";
  return sharp(buffer)
    .rotate() // auto-orient from EXIF Orientation tag, then discard EXIF
    .toFormat(outputFormat)
    .toBuffer(); // no .withMetadata() → all EXIF stripped by default
}
