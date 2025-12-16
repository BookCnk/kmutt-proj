// src/utils/auth.ts
export const TOKEN_KEY = "token";

export type JwtRole = "user" | "admin" | string;

export type JwtPayload = {
  id?: string;
  email?: string;
  role?: JwtRole;
  iat?: number;
  exp?: number;
};

// อ่าน cookie ฝั่ง client (เฉพาะที่ไม่ใช่ HttpOnly)
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function base64UrlDecode(str: string) {
  try {
    const pad = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
    const b64 = pad(str).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    // handle unicode
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const dec = new TextDecoder().decode(bytes);
    return dec;
  } catch {
    return "";
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  // priority: localStorage -> cookie (non-HttpOnly เท่านั้นถึงอ่านได้)
  const ls = window.localStorage.getItem(TOKEN_KEY);
  if (ls) return ls;
  const ck = getCookie(TOKEN_KEY);
  return ck || null;
}

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const p = decodeJwt(token);
  const exp = typeof p?.exp === "number" ? p.exp : 0;
  const now = Math.floor(Date.now() / 1000);
  return !exp || exp <= now;
}

export function isTokenValid(): boolean {
  return !isTokenExpired(getClientToken());
}

/** ✅ อ่าน role จาก token (ถ้าไม่มี token/อ่านไม่ได้ -> null) */
export function getTokenRole(token?: string | null): JwtRole | null {
  const t = token ?? getClientToken();
  if (!t) return null;
  const p = decodeJwt(t);
  return (p?.role as JwtRole) ?? null;
}

/** ✅ เช็ค role แบบเจาะจง (แนะนำ) */
export function hasRole(allowed: JwtRole | JwtRole[], token?: string | null) {
  const role = getTokenRole(token);
  if (!role) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(role);
}

/** ✅ Authorization รวม: token ต้อง valid + role ต้องผ่าน */
export function isAuthorized(allowedRoles: JwtRole | JwtRole[]) {
  const token = getClientToken();
  if (!token) return false;
  if (isTokenExpired(token)) return false;
  return hasRole(allowedRoles, token);
}

export function saveToken(token: string, { alsoCookie = true } = {}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  if (alsoCookie) {
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
      token
    )}; path=/; SameSite=Lax`;
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
}
