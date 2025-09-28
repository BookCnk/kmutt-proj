import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
};


export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, token) => set({ user, accessToken: token }),
  setAccessToken: (token) => set({ accessToken: token }),
  clear: () => set({ user: null, accessToken: null }),
}));
