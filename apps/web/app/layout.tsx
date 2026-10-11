import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND, BRAND_COLORS } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND.productName,
  description: BRAND.description,
  applicationName: BRAND.productName,
  appleWebApp: {
    capable: true,
    title: BRAND.productName,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: BRAND_COLORS.navy,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
