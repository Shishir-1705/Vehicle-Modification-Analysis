import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bike ModAI | Multi-Label Violation Engine",
  description: "Next-generation motorcycle modification detection with Expert Explainable AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { font-family: 'Outfit', sans-serif; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
