import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { DesignContract } from "@/components/design-contract";
import "./globals.css";

const display = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "AniReminder — Your week, on cue", template: "%s | AniReminder" },
  description: "Follow your anime in one clear lineup. See published release dates, keep track of waiting seasons, and choose your ntfy episode alerts.",
  applicationName: "AniReminder",
};

export const viewport: Viewport = { themeColor: "#111210", colorScheme: "dark" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scheme-only-dark">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <DesignContract />
        {children}
      </body>
    </html>
  );
}
