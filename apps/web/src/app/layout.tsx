import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import dynamic from "next/dynamic";

const Assistant = dynamic(() => import("@/components/AI/Assistant"), { ssr: false });

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "NoteFlow ✦ | Collaborative AI Workspace",
  description: "A production-grade, collaborative AI-powered notes workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Assistant />
        </Providers>
      </body>
    </html>
  );
}
