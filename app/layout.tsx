import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import "./globals.css";

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
      <body
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <ThemeProvider attribute="class">
          <Theme
            accentColor="blue"
            grayColor="slate"
            radius="medium"
            scaling="100%"
            appearance="dark"
          >
            {children}
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
