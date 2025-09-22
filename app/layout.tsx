import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toast";
import { Kanit } from "next/font/google";
import { ToastHub } from "@/components/ui/toast-hub";
import Script from "next/script";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "แบบสำรวจการคัดเลือกนักศึกษา KMUTT",
  description: "ระบบแบบสำรวจการคัดเลือกนักศึกษา มหาวิทยาลัยเทคนิคธุรกิจราชเทวี",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className="font-sans antialiased">
        <Toaster>
          <ToastHub />
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
          />
          {children}
        </Toaster>
      </body>
    </html>
  );
}
