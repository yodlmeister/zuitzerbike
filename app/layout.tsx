import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickiePay",
  description: "Fast and secure payment solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: 'var(--font-geist-sans)',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        <ThemeProvider attribute="class">
          <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%" appearance="dark">
            {children}
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
