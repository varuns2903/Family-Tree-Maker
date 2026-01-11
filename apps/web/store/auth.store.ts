import { create } from 'zustand';

type User = {
  id: string;
  name: string;
  email: string;
};

type PendingRegistration = {
  name: string;
  email: string;
  password: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  pendingRegistration: PendingRegistration | null;

  setPendingRegistration: (data: PendingRegistration) => void;
  clearPendingRegistration: () => void;

  setAuth: (user: User, at: string, rt: string) => void;
  setTokens: (at: string, rt: string) => void;
  logout: () => void;
};

export const authStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  pendingRegistration: null,

  setPendingRegistration: (data) =>
    set({ pendingRegistration: data }),

  clearPendingRegistration: () =>
    set({ pendingRegistration: null }),

  setAuth: (user, accessToken, refreshToken) =>
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      pendingRegistration: null,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      pendingRegistration: null,
    }),
}));
