import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boston Immigrant Resource Dashboard",
  description: "",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // Guard on NODE_ENV too, not just whether the ID is set — this ensures
  // localhost browsing is never tracked even if the same .env.local file
  // (reasonably) contains the real ID for convenience.
  const shouldLoadAnalytics = Boolean(googleAnalyticsId) && process.env.NODE_ENV === "production";

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
        </ClerkProvider>
        {shouldLoadAnalytics && <GoogleAnalytics gaId={googleAnalyticsId as string} />}
      </body>
    </html>
  );
}
