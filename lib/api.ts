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

// ⬇️ คืนเฉพาะ response.data
api.interceptors.response.use(
  (response: AxiosResponse) => response.data as any,
  (error: AxiosError) => {
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
