import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";
import InviteForm from "./InviteForm";

// Always render fresh — host can update event details and cover image at any time
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { eventSlug } = params;
  const admin = createSupabaseAdminClient();
  const { data: event } = await admin
    .rpc("get_event_by_slug", { p_slug: eventSlug })
    .single();

  if (!event) return { title: "Invitation" };
  return {
    title: event.event_name || "You're Invited",
    description: event.event_message || "RSVP for this event",
  };
}

export default async function InvitePage({ params }) {
  const { eventSlug } = params;
  const admin = createSupabaseAdminClient();

  const { data: event } = await admin
    .rpc("get_event_by_slug", { p_slug: eventSlug })
    .single();

  if (!event) notFound();

  // If the event is over (48+ hours past event_date), redirect to the memory page
  if (event.event_date) {
    const cleaned = event.event_date
      .replace(/\b(IST|EST|PST|CST|GMT|UTC|[A-Z]{2,4})\b/g, "")
      .replace(/(\d+)(st|nd|rd|th)\b/g, "$1")
      .trim();
    const d = new Date(cleaned) || new Date(event.event_date);
    if (!isNaN(d.getTime()) && (Date.now() - d.getTime()) / (1000 * 60 * 60) > 48) {
      redirect(`/${eventSlug}/memory`);
    }
  }

  const coverUrl = event.event_image_path
    ? `/api/image?p=${encodeURIComponent(event.event_image_path)}`
    : null;

  // Check if this is part of a Wedding Suite — fetch all sibling functions
  let groupEvents = null;
  const { data: extraFields } = await admin
    .from("events")
    .select("event_group_id, event_type")
    .eq("slug", eventSlug)
    .single();

  if (extraFields?.event_group_id && extraFields?.event_type === "wedding_function") {
    const { data: groupData } = await admin.rpc("get_group_events_by_event_slug", { p_slug: eventSlug });
    if (groupData?.length > 1) {
      groupEvents = groupData;
    }
  }

  return (
    <InviteForm
      profile={event}
      eventSlug={eventSlug}
      coverUrl={coverUrl}
      groupEvents={groupEvents}
    />
  );
}
