import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";
import { getCoverImageUrl } from "../../../lib/supabase";
import InviteForm from "./InviteForm";

export async function generateMetadata({ params }) {
  const { hostSlug } = params;
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .rpc("get_host_profile_by_slug", { p_slug: hostSlug })
    .single();

  if (!profile) return { title: "Invitation" };
  return {
    title: profile.event_name || "You're Invited",
    description: profile.event_message || "RSVP for this event",
  };
}

export default async function InvitePage({ params }) {
  const { hostSlug } = params;
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .rpc("get_host_profile_by_slug", { p_slug: hostSlug })
    .single();

  if (!profile) notFound();

  // Resolve cover image signed URL if set
  const coverUrl = await getCoverImageUrl(profile.event_image_path);

  return (
    <InviteForm
      profile={profile}
      hostSlug={hostSlug}
      coverUrl={coverUrl}
    />
  );
}
