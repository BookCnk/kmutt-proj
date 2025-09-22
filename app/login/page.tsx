// src/app/login/page.tsx
"use client";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm opacity-80 mb-6">
          คลิกปุ่มด้านล่างเพื่อดำเนินการต่อ
        </p>
        <GoogleLoginButton onDone={() => router.replace("/dashboard")} />
      </div>
    </main>
  );
}
