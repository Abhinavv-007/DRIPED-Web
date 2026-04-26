import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolve relative metadata URLs (icon.png, opengraph-image.png, …) against
  // the production origin so social previews + favicons work in static export.
  metadataBase: new URL("https://driped.in"),
  title: "Driped — Stop the Drip",
  description:
    "Track, manage, and cancel forgotten subscriptions. Find every recurring charge draining your wallet.",
  openGraph: {
    title: "Driped — Stop the Drip",
    description:
      "Catch the drip. Cut the bills. Driped finds every recurring charge in your inbox and helps you cancel the ones you don't need.",
    type: "website",
    url: "https://driped.in",
    siteName: "Driped",
  },
  twitter: {
    card: "summary_large_image",
    title: "Driped — Stop the Drip",
    description:
      "Catch the drip. Cut the bills. Driped finds every recurring charge in your inbox and helps you cancel the ones you don't need.",
  },
};

const themeScript = `
  (function() {
    try {
      var data = JSON.parse(localStorage.getItem('driped-app') || '{}');
      var theme = data && data.state && data.state.theme;
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
