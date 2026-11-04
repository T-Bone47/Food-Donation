import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";
import { ToastProvider } from "@/components/ui/toast";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FoodShare — Zero-Waste Community Food Rescue Platform",
    template: "%s | FoodShare",
  },
  description: "Unified civic platform connecting food donors, field rescue volunteers, verified community NGOs, and logistical governance.",
  icons: {
    icon: "/images/foodshare-mark.svg",
    apple: "/images/foodshare-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased bg-[#EEF4EC] text-[#143322]">
        <ToastProvider>{children}</ToastProvider>
        <Chatbot />
      </body>
    </html>
  );
}
