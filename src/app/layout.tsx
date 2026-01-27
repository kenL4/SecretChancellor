import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Secret Chancellor | Cambridge University Social Deduction Game",
  description: "A multiplayer social deduction game, with a Cambridge University theme. Discover secret roles, enact policies, and uncover the Chancellor!",
  keywords: ["social deduction", "multiplayer game", "secret hitler", "cambridge", "party game", "online game"],
  authors: [{ name: "Secret Chancellor Team" }],
  openGraph: {
    title: "Secret Chancellor",
    description: "A Cambridge University themed social deduction game for 5-10 players",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  );
}
