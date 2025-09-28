// src/utils/storage.ts

/**
 * ยูทิลอ่าน/เขียน localStorage ที่กัน error เวลาอยู่ฝั่ง server (ไม่มี window)
 * + ช่วย parse/serialize JSON ให้เรียบร้อย
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const hasWindow = () => typeof window !== "undefined";

const getRaw = (key: string): string | null => {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setRaw = (key: string, value: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // quota/full หรือถูกบล็อก → เงียบไว้
  }
};

const removeRaw = (key: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
};

/** อ่านค่า string ธรรมดา */
export function lsGet(
  key: string,
  fallback: string | null = null
): string | null {
  const v = getRaw(key);
  return v ?? fallback;
}

/** เขียนค่า string ธรรมดา */
export function lsSet(key: string, value: string): void {
  setRaw(key, value);
}

/** ลบ key */
export function lsRemove(key: string): void {
  removeRaw(key);
}

/** อ่าน/parse JSON; ถ้า parse ไม่ได้ คืน fallback */
export function lsGetJSON<T extends Json = any>(
  key: string,
  fallback?: T
): T | undefined {
  const raw = getRaw(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** stringify แล้วเขียน JSON */
export function lsSetJSON<T extends Json = any>(key: string, value: T): void {
  try {
    setRaw(key, JSON.stringify(value));
  } catch {
    // ถ้า stringify fail หรือ quota เต็ม → เงียบไว้
  }
}

/** เคลียร์ทั้งหมด (ระวัง!) */
export function lsClear(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.clear();
  } catch {}
}

/**
 * subscribe การเปลี่ยนแปลงของ key จากแท็บ/หน้าต่างอื่น
 * return fn สำหรับยกเลิก
 */
export function onStorageKeyChange(
  key: string,
  cb: (newValue: string | null) => void
): () => void {
  if (!hasWindow()) return () => {};
  const handler = (e: StorageEvent) => {
    if (e.storageArea === window.localStorage && e.key === key) {
      cb(e.newValue);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/* ---------------- Shorthands สำหรับ auth ---------------- */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
};

const TOKEN_KEY = "token";
const USER_KEY = "user";

/** ได้ access token หรือ null */
export function getAccessToken(): string | null {
  return lsGet(TOKEN_KEY);
}

/** เซ็ต access token */
export function setAccessToken(token: string): void {
  lsSet(TOKEN_KEY, token);
}

/** ลบ access token */
export function clearAccessToken(): void {
  lsRemove(TOKEN_KEY);
}

/** ได้ user ที่เคยเก็บไว้ หรือ null */
export function getAuthUser(): AuthUser | null {
  return (lsGetJSON<AuthUser>(USER_KEY) as AuthUser | undefined) ?? null;
}

/** เซ็ต user */
export function setAuthUser(user: AuthUser): void {
  lsSetJSON<AuthUser>(USER_KEY, user);
}

/** ลบ user */
export function clearAuthUser(): void {
  lsRemove(USER_KEY);
}
