import api from "@/lib/api";

const BASE = "/admin/user";

/** GET /api/admin/user/ — Get all users */
// userService.ts
export const getUsers = async (params?: any): Promise<any> => {
  const qs = new URLSearchParams(
    Object.entries(params || {}).reduce((o, [k, v]) => {
      if (v === undefined || v === null) return o;
      o[k] = String(v);
      return o;
    }, {} as Record<string, string>)
  ).toString();
  return api.get<any, any>(`/admin/user/${qs ? `?${qs}` : ""}`);
};

/** GET /api/admin/user/{id} — Get user by id */
export const getUserById = async (id: string): Promise<any> =>
  api.get<any, any>(`${BASE}/${id}`);

/** GET /api/admin/user/profile — Get profile user */
export const getProfileUser = async (): Promise<any> =>
  api.get<any, any>(`${BASE}/profile`);

/** PUT /api/admin/user/role/{id} — Update user role */
export const updateUserRole = async (id: string, payload: any): Promise<any> =>
  api.put<any, any, any>(`${BASE}/role/${id}`, payload);
