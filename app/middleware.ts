// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** เส้นทางที่ต้องล็อกอินก่อนเข้า */
const PROTECTED_PREFIXES = ["/dashboard", "/survey"];

/** ไว้กันรันกับไฟล์ public/_next/api */
const PUBLIC_PATHS = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ข้ามไฟล์/เส้นทาง public
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ดูว่า path นี้อยู่ในกลุ่มที่ต้องล็อกอินไหม
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected && pathname !== "/login") {
    return NextResponse.next();
  }

  // ถือว่า "ล็อกอินแล้ว" ถ้ามีคุกกี้ logged_in=yes (หรือจะเช็คคุกกี้/ชื่ออื่นเพิ่มเติมก็ได้)
  const loggedIn = req.cookies.get("logged_in")?.value === "yes";

  // ยังไม่ล็อกอิน แต่เข้า path ที่ป้องกัน -> เตะไป login พร้อม next
  if (isProtected && !loggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + (search ?? ""));
    return NextResponse.redirect(url);
  }

  // ล็อกอินแล้ว แต่ยังอยู่หน้า /login -> ส่งไปหน้าแรกของ dashboard
  if (pathname === "/login" && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard/overview", req.url));
  }

  return NextResponse.next();
}

// ให้ middleware ทำงานเฉพาะเส้นทางเหล่านี้ (รวดเร็วและชัดเจน)
export const config = {
  matcher: ["/login", "/dashboard/:path*", "/survey/:path*"],
};
