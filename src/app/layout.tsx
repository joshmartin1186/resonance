import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resonance - Beautiful Visuals for Beautiful Music",
  description: "Cinematic visual generation tool for organic and ambient music. Creates unique, narrative-driven visuals that respond to subtle musical cues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
