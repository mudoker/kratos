import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kratos",
  description: "Strength planning, workout execution, and AI coaching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
