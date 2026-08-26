import axios from 'axios';

// Localhost:
//   Uses http://localhost:8080 when VITE_API_URL is not provided.
//
// Production (Vercel):
//   Uses VITE_API_URL configured in Vercel Environment Variables.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token if present in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor for handling authentication expiration
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login if the user session has expired
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
