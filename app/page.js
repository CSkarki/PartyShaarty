import { getActiveTheme, getThemeByName } from "../lib/landing-store";
import { DEFAULT_THEMES } from "./components/landing/themes/defaults";
import LandingTemplate from "./components/landing/LandingTemplate";

export const metadata = {
  title: "Utsavé — Every Celebration, Elevated",
  description:
    "The end-to-end celebration platform for the Indian diaspora. Invites, RSVPs, photo galleries, WhatsApp reminders — for every function in your family's life.",
};

export default async function Home({ searchParams }) {
  // ?theme=festival overrides the active theme for this request (no redeploy needed)
  const override = searchParams?.theme;
  let theme = null;

  if (override) {
    theme = await getThemeByName(override).catch(() => null);
  }

  if (!theme) {
    theme = await getActiveTheme().catch(() => null);
  }

  // Hardcoded fallback — works even if DB is unreachable
  if (!theme) {
    theme = DEFAULT_THEMES.wedding;
  }

  return <LandingTemplate theme={theme} />;
}
