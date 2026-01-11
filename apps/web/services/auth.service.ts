import { api } from './api.client';

export const AuthService = {
  register: (data: any) => api.post('/auth/register', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  login: (data: any) => api.post('/auth/login', data),
};
