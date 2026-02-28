import { NextResponse } from "next/server";
import { downloadPhotoByPath } from "../../../lib/supabase";

// Allowed storage path patterns (event-photos bucket):
// - hostId/albumSlug/filename (3 segments)
// - covers/hostId/cover.ext (3 segments)
// - covers/events/eventId/cover.ext (4 segments)
const SEGMENT = /^[a-zA-Z0-9_.-]+$/;

function isValidPath(path) {
  if (!path || typeof path !== "string") return false;
  const decoded = decodeURIComponent(path).trim();
  if (decoded.includes("..") || decoded.startsWith("/")) return false;
  const segments = decoded.split("/").filter(Boolean);
  if (segments.length < 2 || segments.length > 4) return false;
  return segments.every((s) => SEGMENT.test(s));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("p") ?? searchParams.get("path");
  if (!isValidPath(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const decoded = decodeURIComponent(path).trim();
  const result = await downloadPhotoByPath(decoded);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(result.data, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
