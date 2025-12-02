import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches your Backend Port
});

// Interceptor: Attach Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;