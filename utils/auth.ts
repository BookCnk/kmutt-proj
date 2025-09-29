// src/utils/auth.ts
export const TOKEN_KEY = "token";

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

export function decodeJwt(token: string): any | null {
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

export function saveToken(token: string, { alsoCookie = true } = {}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  if (alsoCookie) {
    // เก็บ cookie ให้ guard อ่านได้ (ถ้า backend ใช้ HttpOnly อยู่แล้ว อันนี้ไม่จำเป็น)
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
  // ลบ cookie ฝั่ง client
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
}
