import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Educator Outreach Portal | GED Reconnect",
  description: "Secure student outreach and attendance tracking portal for educational institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
