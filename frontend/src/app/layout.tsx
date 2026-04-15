import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { AuthProvider } from "../contexts/AuthContext";
import { SessionProvider } from "../contexts/SessionContext";
import { AnalyticsProvider } from "../contexts/AnalyticsContext";
import Navigation from "@/components/Navigation";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Nuudle",
  description: "Mind Matters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C6A55F" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FDF9F4" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#333333" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nuudle" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="Mind Matters" />
        <meta property="og:title" content="Nuudle" />
        <meta property="og:description" content="Mind Matters" />
        <meta property="og:image" content="/og-image.png" />
      </head>
      <body className={dmSans.variable}>
        <AuthProvider>
          <ThemeProvider>
            <AnalyticsProvider>
              <SessionProvider>
                <Navigation />
                {children}
              </SessionProvider>
            </AnalyticsProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
