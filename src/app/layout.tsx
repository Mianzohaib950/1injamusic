import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "1 Jamaica Music",
  description: "Official music, artists, events, booking, and merch from 1 Jamaica Music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
