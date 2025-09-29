import "./globals.css";
import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import AuthGuard from "@/components/auth/AuthGuard";

import { Toaster } from "@/components/ui/toast";
import { ToastHub } from "@/components/ui/toast-hub";
import GsiLoader from "@/components/GsiLoader"; // <- เป็น client component (มี "use client")
import AppShell from "@/components/AppShell"; // <- เป็น client component (มี "use client")

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
        {/* ทำให้ subtree นี้เป็น client boundary และเรียก useBootstrapAuth() */}
        <AppShell>
          {/* ใส่พวก client-only UI ไว้ใต้ AppShell ได้เลย */}
          <Toaster>
            <ToastHub />
          </Toaster>
          <GsiLoader />
          <AuthGuard>{children}</AuthGuard>
        </AppShell>
      </body>
    </html>
  );
}
