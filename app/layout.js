import "./globals.css";

export const metadata = {
  title: "You're Invited",
  description: "Event invitation with RSVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
