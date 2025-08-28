import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Kanit } from "next/font/google";

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
        {children}
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, className: "thai-text" }}
        />
      </body>
    </html>
  );
}
