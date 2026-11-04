import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
        <Chatbot />
      </body>
    </html>
  );
}
