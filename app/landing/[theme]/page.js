import { getThemeByName } from "../../../lib/landing-store";
import { DEFAULT_THEMES } from "../../components/landing/themes/defaults";
import LandingTemplate from "../../components/landing/LandingTemplate";

export async function generateMetadata({ params }) {
  const name = params.theme;
  const labels = {
    wedding:       "Weddings & Marriage Events",
    festival:      "Festivals — Holi, Diwali, Navratri",
    puja:          "Religious & Puja Events",
    anniversary:   "Marriage Anniversary",
    birthday_kid:  "Kid's Birthday Party",
    birthday_adult:"Milestone Birthday",
  };
  const label = labels[name] || "Celebrations";
  return {
    title: `${label} — Utsavé`,
    description: "Plan and celebrate with Utsavé — invites, RSVPs, photo galleries, and WhatsApp reminders.",
  };
}

// Public — no auth required. Used for marketing campaign links and admin preview.
export default async function ThemePreview({ params }) {
  const name = params.theme;

  // Try DB first, fall back to in-code default
  let theme = await getThemeByName(name).catch(() => null);
  if (!theme) theme = DEFAULT_THEMES[name] ?? DEFAULT_THEMES.wedding;

  return <LandingTemplate theme={theme} />;
}
