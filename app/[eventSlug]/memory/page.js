import { notFound, redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";
import { listPhotosInAlbum } from "../../../lib/supabase";
import { listAlbumsByEvent } from "../../../lib/gallery-store";
import MemoryPage from "./MemoryPage";

// Always render fresh — photos and event details may update
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { eventSlug } = params;
  const admin = createSupabaseAdminClient();
  const { data: event } = await admin
    .rpc("get_event_by_slug", { p_slug: eventSlug })
    .single();
  if (!event) return { title: "Event Memories" };
  return {
    title: `${event.event_name || "Event"} — Memories · Utsavé`,
    description: `Relive the beautiful moments from ${event.event_name || "this celebration"}.`,
  };
}

/**
 * Parse a free-text event_date string robustly.
 * Handles IST/timezone suffixes and ordinal numbers (21st, 22nd etc.)
 */
function parseEventDate(dateStr) {
  if (!dateStr) return null;
  // Strip common Indian/English timezone suffixes and ordinal suffixes
  const cleaned = dateStr
    .replace(/\b(IST|EST|PST|CST|GMT|UTC|[A-Z]{2,4})\b/g, "")
    .replace(/(\d+)(st|nd|rd|th)\b/g, "$1")
    .trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;
  // Fall back to original string
  const d2 = new Date(dateStr);
  return isNaN(d2.getTime()) ? null : d2;
}

/** Returns true if the event date is clearly in the future (more than 2 hours away). */
function isEventInFuture(eventDate) {
  const d = parseEventDate(eventDate);
  if (!d) return false;
  return d.getTime() - Date.now() > 2 * 60 * 60 * 1000;
}

export default async function MemoryPageRoute({ params }) {
  unstable_noStore(); // ensure no cache — DB updates (event_name, event_message, display_name) show immediately
  const { eventSlug } = params;
  const admin = createSupabaseAdminClient();

  const { data: event } = await admin
    .rpc("get_event_by_slug", { p_slug: eventSlug })
    .single();

  if (!event) notFound();

  if (process.env.NODE_ENV === "development") {
    console.log("[memory/page] event from DB:", {
      event_name: event.event_name,
      event_message: event.event_message?.slice(0, 50) + (event.event_message?.length > 50 ? "…" : ""),
      display_name: event.display_name,
    });
  }

  // Only redirect to invite if the event is clearly in the future.
  // Past events, no-date events, and unparseable dates all show the memory page.
  if (isEventInFuture(event.event_date)) {
    redirect(`/${eventSlug}/invite`);
  }

  // Cover and photos via image proxy (same-origin, no CORS)
  const coverUrl = event.event_image_path
    ? `/api/image?p=${encodeURIComponent(event.event_image_path)}`
    : null;

  let photos = [];
  try {
    const albums = await listAlbumsByEvent(event.id);
    for (const album of albums) {
      const files = await listPhotosInAlbum(event.host_id, album.slug);
      for (const f of files) {
        photos.push({
          url: `/api/image?p=${encodeURIComponent(f.path)}`,
          albumName: album.name,
          albumId: album.id,
        });
      }
    }
  } catch (err) {
    console.error("[memory/page] photo fetch error:", err.message);
  }

  return (
    <MemoryPage
      event={event}
      coverUrl={coverUrl}
      eventSlug={eventSlug}
      initialPhotos={photos}
    />
  );
}
