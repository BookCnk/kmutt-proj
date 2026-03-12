// app/login/page.tsx
"use client";

import GoogleOneTap from "@/components/GoogleOneTap";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search?.get("next") || "/dashboard/overview";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1f130d] text-orange-50">
      <div className="absolute inset-0 motion-safe:animate-[bgDrift_14s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_14%_18%,rgba(250,163,75,0.45),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.34),transparent_34%),linear-gradient(160deg,#2d1a10_8%,#4a240f_52%,#1f130d_100%)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl motion-safe:animate-[floatLeft_9s_ease-in-out_infinite]" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl motion-safe:animate-[floatRight_11s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-12 top-1/4 h-44 w-44 rounded-full border border-orange-100/25 bg-orange-200/10 blur-[2px] motion-safe:animate-[orbitOne_16s_linear_infinite]" />
        <span className="absolute right-[8%] top-[18%] h-32 w-32 rounded-full border border-amber-100/30 bg-amber-100/10 blur-[1px] motion-safe:animate-[orbitTwo_13s_ease-in-out_infinite]" />
        <span className="absolute bottom-[12%] left-[20%] h-56 w-56 rounded-full border border-orange-50/15 bg-orange-100/5 motion-safe:animate-[orbitThree_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center p-6 md:p-10">
        <section className="mx-auto w-full max-w-md rounded-3xl border border-orange-100/20 bg-white/10 p-8 shadow-2xl shadow-orange-900/45 backdrop-blur-xl motion-safe:animate-[cardEnter_700ms_ease-out] md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100/30 bg-orange-100/10 px-3 py-1 text-xs font-medium tracking-wide text-orange-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300" />
            Secure Sign In
          </div>

          <div className="mt-6 rounded-2xl border border-orange-100/20 bg-orange-50/10 p-4">
            <Image
              src="/ICON.png"
              alt="KMUTT logo"
              width={420}
              height={140}
              priority
              className="mx-auto h-20 w-auto object-contain motion-safe:animate-[logoBreath_4.8s_ease-in-out_infinite]"
            />
          </div>

          <h1 className="mt-6 text-3xl font-semibold leading-tight text-white">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-3 text-sm leading-6 text-orange-100/90">
            เข้าสู่ระบบด้วยบัญชี Google
            เพื่อใช้งานบริการของมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (มจธ.)
            อย่างปลอดภัย
          </p>

          <div className="mt-8 rounded-2xl border border-orange-100/20 bg-black/20 p-5">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-orange-100/80">
              Continue with Google
            </p>
            <div id="google-signin-host" className="flex justify-center" />
          </div>

          <p className="mt-5 text-xs text-orange-100/75">
            หลังเข้าสู่ระบบสำเร็จ ระบบจะพาไปยังหน้าแดชบอร์ดโดยอัตโนมัติ
          </p>

          <GoogleOneTap
            onSuccess={(_res) => router.replace("/dashboard/overview")}
            autoPrompt={false}
            showButton
            buttonContainerId="google-signin-host"
            debug
          />

          <div className="mt-8 border-t border-orange-100/20 pt-4 text-center text-xs text-orange-100/75">
            <p className="mb-2 uppercase tracking-[0.2em] text-orange-100/60">
              Web Credits
            </p>
            <p>
              <a
                href="https://www.linkedin.com/in/chanakarn-kruehong-06845332b/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white hover:underline">
                Chanaakarn Kruehong
              </a>
            </p>
            <p>
              <a
                href="https://www.linkedin.com/in/kundids/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white hover:underline">
                Kundids Khawmeesri
              </a>
            </p>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes bgDrift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(-1.5%, 1.8%, 0) scale(1.05);
          }
        }

        @keyframes floatLeft {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(22px, -14px, 0);
          }
        }

        @keyframes floatRight {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-24px, 18px, 0);
          }
        }

        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoBreath {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.02);
          }
        }

        @keyframes orbitOne {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(38vw, -4vh, 0) scale(1.08);
          }
          50% {
            transform: translate3d(58vw, 26vh, 0) scale(0.92);
          }
          75% {
            transform: translate3d(24vw, 42vh, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes orbitTwo {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-42vw, 40vh, 0) rotate(180deg);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(360deg);
          }
        }

        @keyframes orbitThree {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(30vw, -26vh, 0) scale(1.1);
          }
          66% {
            transform: translate3d(48vw, -6vh, 0) scale(0.95);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
