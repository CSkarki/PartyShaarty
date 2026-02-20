import "./globals.css";

export const metadata = {
  title: "PartyShaarty — Your Personal Event RSVP & Gallery",
  description:
    "Create your own event invite page, collect RSVPs, share photos, and send thank-you emails — all in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
