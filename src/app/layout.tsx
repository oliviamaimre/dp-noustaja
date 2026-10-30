import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DP-nõustaja",
  description: "Küsi detailplaneeringu menetluse kohta – vastused põhinevad ametlikel menetlusskeemidel.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et">
      <body className="flex h-dvh flex-col">
        <div className="min-h-0 flex-1">{children}</div>
        <footer className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-[11px] leading-snug text-zinc-500">
          Vastused põhinevad Majandus- ja Kommunikatsiooniministeeriumi menetlusskeemidel, mis on
          informatiivsed ega ole õigusnõu.
        </footer>
      </body>
    </html>
  );
}
