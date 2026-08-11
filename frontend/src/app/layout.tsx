import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { CommandCenterProvider } from "@/context/CommandCenterContext";


export const metadata: Metadata = {
  title: "AXION — The Future of AI-Powered Vehicle Inspection",
  description: "Next-generation computer vision engine for automated modification detection, legal compliance verification, and real-time telematics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050505] text-white antialiased selection:bg-[#00E5A8]/30 selection:text-[#00E5A8] font-sans">
        <AuthProvider>
          <NotificationProvider>
            <CommandCenterProvider>
              {children}
            </CommandCenterProvider>
          </NotificationProvider>
        </AuthProvider>

      </body>
    </html>
  );
}




