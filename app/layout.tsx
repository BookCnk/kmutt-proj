import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'แบบสำรวจการคัดเลือกนักศึกษา KMUTT',
  description: 'ระบบแบบสำรวจการคัดเลือกนักศึกษา มหาวิทยาลัยเทคนิคธุรกิจราชเทวี',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="font-sans antialiased">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'thai-text',
          }}
        />
      </body>
    </html>
  );
}