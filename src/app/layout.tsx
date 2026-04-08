import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
});

const newsreaderSerif = Newsreader({
    variable: "--font-serif",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Ami SSH - Terminal AI Assistant",
    description: "SSH into your servers with Claude-like AI assistance",
};

import { AppLayout } from "@/components/layout/AppLayout";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} ${newsreaderSerif.variable} h-full antialiased`}
        >
            <body className="h-full">
                <AppLayout>{children}</AppLayout>
            </body>
        </html>
    );
}
