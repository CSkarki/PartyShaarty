import "./globals.css";

export const metadata = {
  title: "Utsavé — Every Celebration, Elevated",
  description:
    "The end-to-end celebration platform for the Indian diaspora. Invites, RSVPs, photo galleries, WhatsApp reminders — for every function in your family's life.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
