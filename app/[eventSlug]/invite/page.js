import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";
import { getCoverImageUrl } from "../../../lib/supabase";
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

  // Resolve cover image signed URL if set
  const coverUrl = await getCoverImageUrl(event.event_image_path);

  return (
    <InviteForm
      profile={event}
      eventSlug={eventSlug}
      coverUrl={coverUrl}
    />
  );
}
