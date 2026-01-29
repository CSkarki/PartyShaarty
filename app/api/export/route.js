import { readFileSync, existsSync } from "fs";
import { join } from "path";
import XLSX from "xlsx";
import { requireHost } from "../../../lib/auth";

const RSVPS_FILE = join(process.cwd(), "data", "rsvps.json");

export async function GET(request) {
  const result = requireHost(request);
  if (!result.ok) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    if (!existsSync(RSVPS_FILE)) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([["Timestamp", "Name", "Email", "Attending", "Message"]]);
      XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="rsvps.xlsx"',
        },
      });
    }

    const raw = readFileSync(RSVPS_FILE, "utf8");
    const rows = JSON.parse(raw);
    const arr = Array.isArray(rows) ? rows : [];
    const head = ["Timestamp", "Name", "Email", "Attending", "Message"];
    const data = [head, ...arr.map((r) => [r.timestamp, r.name, r.email, r.attending, r.message || ""])];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="rsvps.xlsx"',
      },
    });
  } catch (err) {
    console.error("Export error:", err.message);
    return new Response("Export failed", { status: 500 });
  }
}
