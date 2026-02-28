import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";
import { getCoverImageUrl } from "../../../lib/supabase";
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
  const { eventSlug } = params;
  const admin = createSupabaseAdminClient();

  const { data: event } = await admin
    .rpc("get_event_by_slug", { p_slug: eventSlug })
    .single();

  if (!event) notFound();

  // Only redirect to invite if the event is clearly in the future.
  // Past events, no-date events, and unparseable dates all show the memory page.
  if (isEventInFuture(event.event_date)) {
    redirect(`/${eventSlug}/invite`);
  }

  // Fetch cover image signed URL (small, safe to embed server-side)
  const coverUrl = await getCoverImageUrl(event.event_image_path);

  // Photos are fetched client-side via /api/slideshow/[eventSlug]
  // (same proven mechanism used by the slideshow page)
  return (
    <MemoryPage
      event={event}
      coverUrl={coverUrl}
      eventSlug={eventSlug}
    />
  );
}
