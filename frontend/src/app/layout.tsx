import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { AuthProvider } from "../contexts/AuthContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <meta property="og:image" content="/icon-512.svg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ThemeProvider>
            <Navigation />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
