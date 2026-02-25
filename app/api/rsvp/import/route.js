import * as XLSX from "xlsx";
import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { addRsvp } from "../../../../lib/rsvp-store";
import { getEvent } from "../../../../lib/event-store";

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try { ({ profile } = await requireHostProfile(supabase)); } catch (res) { return res; }

  let file, eventId;
  try {
    const formData = await request.formData();
    file = formData.get("file");
    eventId = formData.get("eventId") || null;
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file || !(file instanceof File) || file.size === 0)
    return Response.json({ error: "No file uploaded" }, { status: 400 });

  // Verify event ownership if eventId provided
  let resolvedEventId = null;
  if (eventId) {
    const event = await getEvent(eventId, profile.id);
    if (!event) return Response.json({ error: "Event not found" }, { status: 404 });
    resolvedEventId = event.id;
  }

  let rows;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  } catch {
    return Response.json({ error: "Failed to parse CSV file" }, { status: 400 });
  }

  if (rows.length < 2)
    return Response.json(
      { error: "CSV must contain a header row and at least one data row" },
      { status: 400 }
    );

  // Normalise headers: strip asterisks, lowercase, trim
  const headers = rows[0].map((h) => String(h).replace(/\*/g, "").trim().toLowerCase());
  const idx = {
    name:      headers.indexOf("name"),
    email:     headers.indexOf("email"),
    phone:     headers.indexOf("phone"),
    attending: headers.indexOf("attending"),
    message:   headers.indexOf("message"),
  };

  if (idx.name === -1 || idx.email === -1 || idx.attending === -1)
    return Response.json(
      { error: "CSV must have Name, Email, and Attending columns" },
      { status: 400 }
    );

  let imported = 0, skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length - 1; i++) {
    const row    = rows[i + 1];
    const rowNum = i + 2; // 1-indexed; header is row 1

    const name      = String(row[idx.name]      ?? "").trim();
    const email     = String(row[idx.email]     ?? "").trim();
    const phone     = idx.phone    !== -1 ? String(row[idx.phone]    ?? "").trim() : "";
    const attending = String(row[idx.attending] ?? "").trim();
    const message   = idx.message !== -1 ? String(row[idx.message]  ?? "").trim() : "";

    // Skip completely blank rows
    if (!name && !email && !attending) { skipped++; continue; }

    if (!name)      { errors.push({ row: rowNum, reason: "Name is required" });      skipped++; continue; }
    if (!email)     { errors.push({ row: rowNum, reason: "Email is required" });     skipped++; continue; }
    if (!attending) { errors.push({ row: rowNum, reason: "Attending is required" }); skipped++; continue; }

    // Normalise attending to title case (yes/YES/Yes → "Yes")
    const norm = attending.charAt(0).toUpperCase() + attending.slice(1).toLowerCase();
    if (norm !== "Yes" && norm !== "No") {
      errors.push({ row: rowNum, reason: `Attending must be "Yes" or "No" (got "${attending}")` });
      skipped++;
      continue;
    }

    try {
      await addRsvp(
        { name, email, phone: phone || null, attending: norm, message: message || "" },
        profile.id,
        resolvedEventId
      );
      imported++;
    } catch (err) {
      errors.push({ row: rowNum, reason: err.message || "Database error" });
      skipped++;
    }
  }

  return Response.json({ imported, skipped, errors });
}
