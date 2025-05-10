import type { Metadata } from "next";
import { Box, Container, Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Header } from "@/components/Header";

import { headers } from 'next/headers' // added
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: 'ZuitzerBike',
  description: 'Powered by Reown'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

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
            <Box style={{ minHeight: "100vh" }} p="6">
              <ContextProvider cookies={cookies}>
                <Container size="3">
                  <Header />
                  {children}
                </Container>
              </ContextProvider>
            </Box>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
