import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/shared/pwa-register";

export const metadata: Metadata = {
  title: "Kratos",
  description: "Strength planning, workout execution, and AI coaching.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kratos",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
