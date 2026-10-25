import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Import the Chatbot component you just created
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodShare - Food Waste Management",
  description: "Connecting surplus food with those in need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className={inter.className}>
        {children}
        {/* Add the Chatbot component here */}
        <Chatbot />

      </body>
    </html>
  );
}
