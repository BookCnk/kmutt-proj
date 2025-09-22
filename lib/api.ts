// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const runQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response.data as any,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original?._retry) {
      if (isRefreshing) {
        const token = await new Promise<string | null>((resolve) =>
          pendingQueue.push(resolve)
        );
        if (token && original.headers)
          original.headers.set("Authorization", `Bearer ${token}`);
        original._retry = true;
        return api(original);
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post<{
          status: boolean;
          message: string;
          access_token: string;
          data: any;
        }>(`${BASE_URL}/auth/refresh`, null, { withCredentials: true });

        const newToken = res.data?.access_token;
        if (newToken) {
          localStorage.setItem("token", newToken);
          runQueue(newToken);
          if (original.headers)
            original.headers.set("Authorization", `Bearer ${newToken}`);
          return api(original);
        } else {
          runQueue(null);
          localStorage.removeItem("token");
          return Promise.reject(error);
        }
      } catch (e) {
        runQueue(null);
        localStorage.removeItem("token");
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // Log error
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        message: error.message,
        data: error.response.data,
      });
    } else {
      console.error("Network/API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// helper (ไม่เปลี่ยน)
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
