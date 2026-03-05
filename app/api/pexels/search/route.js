import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";

export async function GET(request) {
  const supabase = createSupabaseServerClient();
  try {
    await requireHostProfile(supabase);
  } catch (res) {
    return res;
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get("q")?.trim();
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const per_page = Math.min(30, Math.max(1, parseInt(searchParams.get("per_page") || "15", 10)));

  if (!q) {
    return Response.json({ error: "Query required" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Pexels not configured" }, { status: 500 });
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`;

  let pexelsRes;
  try {
    pexelsRes = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 300 }, // cache 5 min
    });
  } catch (err) {
    return Response.json({ error: "Pexels request failed" }, { status: 502 });
  }

  if (!pexelsRes.ok) {
    return Response.json({ error: "Pexels API error" }, { status: pexelsRes.status });
  }

  const data = await pexelsRes.json();

  const photos = (data.photos || []).map((p) => ({
    id:               p.id,
    src_medium:       p.src.medium,
    src_large:        p.src.large2x || p.src.large,
    photographer:     p.photographer,
    photographer_url: p.photographer_url,
    original_url:     p.url,
    width:            p.width,
    height:           p.height,
    alt:              p.alt || "",
  }));

  return Response.json({
    photos,
    total_results: data.total_results,
    page,
    per_page,
  });
}
