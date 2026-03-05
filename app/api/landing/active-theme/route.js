import { getActiveTheme } from "../../../../lib/landing-store";

/** Public: returns the active landing theme's intake mode for use by "Design your celebration" / Get Started flows. */
export async function GET() {
  try {
    const theme = await getActiveTheme();
    const intakeMode = theme?.intakeMode === "full" ? "full" : "light";
    return Response.json({ intakeMode });
  } catch {
    return Response.json({ intakeMode: "full" });
  }
}
