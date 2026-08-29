import type { Metadata } from "next";

import { MotionProvider } from "@/components/layout/motion-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/server-api";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FMI — Face-first image discovery",
    template: "%s — FMI",
  },
  description:
    "Upload, process, organize, and search every face across your image galleries.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <MotionProvider>
          <SiteHeader user={user} />
          <main>{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
