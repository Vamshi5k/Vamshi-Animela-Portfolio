import type { Metadata } from "next";
import { ViewfinderCursor } from "@/components/motion/ViewfinderCursor";
import { profile } from "@/data/profile";
import { ui } from "@/data/ui";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: profile.siteName,
  description: profile.metaDescription,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="type-mono-s sr-only bg-accent text-accent-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-3"
        >
          {ui.skipToContent}
        </a>
        {children}
        {/* Shared viewfinder cursor: mounts only with a mouse and motion allowed (SPEC §4.8). */}
        <ViewfinderCursor />
      </body>
    </html>
  );
}
