export type Role = "admin" | "staff" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name?: string;
  picture?: string;
};

export function decodeJwt<T = any>(
  jwt?: string | null
): (T & { exp?: number; iat?: number }) | null {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isTokenExpired(jwt?: string | null, skewSeconds = 30): boolean {
  const payload = decodeJwt(jwt);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export function getRole(
  user?: AuthUser | null,
  accessToken?: string | null
): Role | null {
  if (user?.role) return user.role;
  const payload = decodeJwt(accessToken);
  return (payload?.role as Role) ?? null;
}

export function hasRole(
  required: Role | Role[],
  user?: AuthUser | null,
  accessToken?: string | null
): boolean {
  const r = getRole(user, accessToken);
  if (!r) return false;
  const req = Array.isArray(required) ? required : [required];
  return req.includes(r);
}

const PERMISSIONS: Record<string, Role[]> = {
  "form.view": ["admin", "staff", "viewer"],
  "form.create": ["admin", "staff"],
  "form.delete": ["admin"],
  "user.manage": ["admin"],
};

export function can(
  action: keyof typeof PERMISSIONS,
  user?: AuthUser | null,
  accessToken?: string | null
): boolean {
  return hasRole(PERMISSIONS[action], user, accessToken);
}
