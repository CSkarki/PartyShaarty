import he from "he";

/**
 * Escape HTML special characters in a plain-text string.
 * Must be called before embedding any user input into HTML.
 */
export function escapeHtml(text) {
  return he.escape(String(text ?? ""));
}

/**
 * Convert bare http/https URLs in an already-escaped string into anchor tags.
 * MUST be called AFTER escapeHtml() so user content is already sanitised.
 */
export function linkify(escapedText) {
  return escapedText.replace(
    /(https?:\/\/[^\s<&]+)/g,
    (url) => `<a href="${url}" style="color:#c4a45a;">${url}</a>`
  );
}

/**
 * Full pipeline for user-provided message text going into email HTML:
 *   escape → linkify → newlines to <br>
 */
export function formatMessageHtml(text) {
  return linkify(escapeHtml(String(text ?? "").trim())).replace(/\n/g, "<br>");
}
