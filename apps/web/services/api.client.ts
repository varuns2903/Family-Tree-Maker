import axios from 'axios';
import { authStore } from '@/store/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = authStore.getState().refreshToken;
      if (!refreshToken) return Promise.reject(error);

      const res = await api.post('/auth/refresh', {
        refreshToken,
      });

      authStore.getState().setTokens(
        res.data.accessToken,
        res.data.refreshToken,
      );

      original.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return api(original);
    }

    return Promise.reject(error);
  },
);
