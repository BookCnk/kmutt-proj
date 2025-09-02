"use client";

import * as React from "react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_100%_-20%,theme(colors.blue.200/40),transparent),radial-gradient(900px_400px_at_-20%_0%,theme(colors.purple.200/35),transparent)] dark:bg-[radial-gradient(1200px_600px_at_100%_-20%,theme(colors.blue.900/30),transparent),radial-gradient(900px_400px_at_-20%_0%,theme(colors.purple.900/25),transparent)]">
      {/* 👇 ตรงนี้ทำให้ทุกอย่างอยู่กึ่งกลางจอ */}
      <div className="min-h-screen grid place-items-center p-4">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-2xl backdrop-blur-lg dark:border-white/10 dark:bg-black/40">
          <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-r from-blue-500/20 via-fuchsia-500/20 to-emerald-500/20 opacity-60 blur-2xl" />

          <div className="relative grid items-stretch md:grid-cols-2">
            {/* Left: Brand / Hero */}
            <div className="hidden md:flex flex-col justify-between p-10 lg:p-12 border-r border-black/5 dark:border-white/10 bg-gradient-to-b from-white/60 to-white/30 dark:from-zinc-900/60 dark:to-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-fuchsia-600 text-white shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-6">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.9 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="font-semibold tracking-tight">
                  <span className="text-lg">KMUTT Grad Admin</span>
                </div>
              </div>

              <div className="mt-16">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                  ยินดีต้อนรับ 👋
                </h1>
                <p className="mt-3 text-zinc-600 dark:text-zinc-300">
                  จัดการข้อมูลคณะ ภาควิชา และหลักสูตรได้จากที่เดียว
                </p>
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
              <div className="mx-auto w-full max-w-sm">
                <div className="mb-8 text-center md:text-left">
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    เข้าสู่ระบบด้วย Google
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    คลิกปุ่มด้านล่างเพื่อดำเนินการต่อ
                  </p>
                </div>

                <GoogleIconButton />

                {/* ดิสเพลย์ไว้เฉย ๆ ไม่มี logic */}

                <footer className="mt-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  By continuing you agree to our{" "}
                  <a className="underline underline-offset-2" href="#">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a className="underline underline-offset-2" href="#">
                    Privacy Policy
                  </a>
                  .
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* Badge เล็ก ๆ ใต้การ์ด */}
      </div>
    </main>
  );
}

function GoogleIconButton() {
  return (
    <button
      type="button"
      aria-label="Continue with Google"
      className="group relative mx-auto grid h-14 w-64 place-items-center rounded-full border border-black/10 bg-white/90 text-zinc-800 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100 sm:w-80 md:w-96">
      <GoogleIcon className="h-6 w-6 shrink-0" />
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-500/0 via-fuchsia-500/0 to-emerald-500/0 opacity-0 blur-lg transition-all group-hover:from-blue-500/15 group-hover:via-fuchsia-500/15 group-hover:to-emerald-500/15 group-hover:opacity-100" />
    </button>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props} role="img" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.834 6.053 29.728 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.817C14.627 16.554 19.004 14 24 14c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.834 6.053 29.728 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c4.874 0 9.29-1.863 12.641-4.902l-5.835-4.934C28.84 35.441 26.548 36 24 36c-5.206 0-9.628-3.332-11.286-7.974l-6.53 5.025C9.477 39.556 16.142 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.013 12.013 0 01-4.094 5.464l.003-.002 5.835 4.934C34.79 40.219 40 36 40 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}
