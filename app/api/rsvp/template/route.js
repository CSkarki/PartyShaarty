import * as XLSX from "xlsx";
import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  try { await requireHostProfile(supabase); } catch (res) { return res; }

  const aoa = [
    ["Name*", "Email*", "Phone", "Attending*", "Message"],
    ["Jane Doe", "jane@example.com", "555-1234", "Yes", "Looking forward to it!"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(ws);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="rsvp-template.csv"',
    },
  });
}
