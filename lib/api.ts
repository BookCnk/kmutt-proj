// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const REFRESH_URL = `${API_BASE}/auth/refresh`;

// ---------- utils ----------
const isRefreshEndpoint = (url?: string) =>
  !!url && /\/auth\/refresh(\b|\/|\?)/.test(url);

// ตั้งค่า header Authorization ให้รองรับทั้ง AxiosHeaders และ plain object
function setAuthHeader(
  headers: InternalAxiosRequestConfig["headers"] | undefined,
  token: string
) {
  if (!headers) return;
  if (headers instanceof AxiosHeaders || (headers as any)?.set) {
    // AxiosHeaders
    (headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  } else {
    // plain object
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }
}

// ---------- axios instance ----------
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ต้องส่ง refresh_token cookie ไปกับ /auth/refresh
});

// ---------- request interceptor ----------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const url = config.url || "";
      if (token && !isRefreshEndpoint(url)) {
        setAuthHeader(config.headers, token);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- refresh queue ----------
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const runQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

// ---------- response interceptor ----------
api.interceptors.response.use(
  (response) => response.data as any,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const url = original?.url || "";
    const msg = String(
      (error.response?.data as any)?.message ?? ""
    ).toLowerCase();

    // เงื่อนไขที่จะลอง refresh
    const shouldRefresh =
      !!original &&
      !original._retry &&
      !isRefreshEndpoint(url) &&
      (status === 401 || msg.includes("jwt expired"));

    if (!shouldRefresh) {
      return Promise.reject(error.response?.data ?? error);
    }

    if (isRefreshing) {
      // รอรอบ refresh ที่กำลังทำ
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error.response?.data ?? error);
          setAuthHeader(original.headers, token);
          original._retry = true;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

      try {
        // ใช้ instance เดียวกัน + ใส่ flag เพื่อกันโดนดักซ้ำ (เผื่อกรณีอนาคต)
        const res = await api.post<{
          status: boolean;
          message: string;
          access_token: string;
          data: any;
        }>("/auth/refresh", null, {
          // headers: { "x-refresh": "1" },
          withCredentials: true, // ไม่ต้อง ใส่แล้วใน instance
        });

      const newToken = res?.data?.access_token as string | undefined;

      if (newToken) {
        localStorage.setItem("token", newToken);
        runQueue(newToken);

        setAuthHeader(original.headers, newToken);
        return api(original); // รันคำขอเดิมซ้ำ
      } else {
        runQueue(null);
        localStorage.removeItem("token");
        return Promise.reject(error.response?.data ?? error);
      }
    } catch (e: any) {
      runQueue(null);
      localStorage.removeItem("token");
      return Promise.reject(e?.response?.data ?? e);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---------- helper (signature เดิม) ----------
export const apiHelper = {
  get: async <T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => api.get<T, T, D>(url, config),

  post: async <T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => api.post<T, T, D>(url, data, config),

  put: async <T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => api.put<T, T, D>(url, data, config),

  delete: async <T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => api.delete<T, T, D>(url, config),

  upload: async <T>(url: string, formData: FormData): Promise<T> =>
    api.post<T, T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
