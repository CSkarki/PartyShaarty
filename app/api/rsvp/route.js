import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const RSVPS_FILE = join(DATA_DIR, "rsvps.json");

function getRsvps() {
  if (!existsSync(RSVPS_FILE)) {
    return [];
  }
  try {
    const raw = readFileSync(RSVPS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRsvps(rows) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(RSVPS_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, attending, message } = body;
  if (!name || typeof name !== "string" || !email || typeof email !== "string" || !attending) {
    return Response.json(
      { error: "Name, email, and attending are required" },
      { status: 400 }
    );
  }

  try {
    const rows = getRsvps();
    rows.push({
      timestamp: new Date().toISOString(),
      name: String(name).trim(),
      email: String(email).trim(),
      attending: String(attending).trim(),
      message: message != null ? String(message).trim() : "",
    });
    saveRsvps(rows);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("RSVP API error:", err.message);
    return Response.json(
      { error: err.message || "Failed to save RSVP" },
      { status: 500 }
    );
  }
}
