// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Kanit } from "next/font/google";

import AuthGuard from "@/components/auth/AuthGuard";
import GsiLoader from "@/components/GsiLoader"; // client component
import AppShell from "@/components/AppShell"; // client component
import { ToastHub } from "@/components/ui/toast-hub";

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
        {/* ทำให้ subtree เป็น client boundary */}
        <AppShell>
          {/* ToastHub มี ToastProvider ภายในแล้ว ไม่ต้องใส่ Toaster อีก */}
          <ToastHub />
          {/* โหลดสคริปต์ Google Sign-In */}
          <GsiLoader />
          {/* Guard ทุกหน้า (ยกเว้น public routes ที่คุณยกเว้นไว้) */}
          <AuthGuard>{children}</AuthGuard>
        </AppShell>
      </body>
    </html>
  );
}
