import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { createWeddingSuite } from "../../../../lib/event-store";

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { group_name, group_type, functions } = body;

  if (!group_name?.trim()) {
    return Response.json({ error: "group_name is required" }, { status: 400 });
  }
  if (!Array.isArray(functions) || functions.length === 0) {
    return Response.json({ error: "At least one function is required" }, { status: 400 });
  }

  try {
    const result = await createWeddingSuite(
      { group_name, group_type: group_type || "wedding", functions },
      profile.id
    );
    return Response.json(result, { status: 201 });
  } catch (err) {
    console.error("Create Wedding Suite error:", err.message);
    return Response.json({ error: err.message || "Failed to create Wedding Suite" }, { status: 500 });
  }
}
