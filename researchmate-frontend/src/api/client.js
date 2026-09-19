// src/api/client.js
import axios from 'axios';

const STORAGE_KEY = 'researchmate_auth';

const client = axios.create({
  // Use relative path — Vite proxies /api/* → http://localhost:8080/api/* in dev.
  // This avoids all CORS issues because the browser never makes a cross-origin request.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT token from localStorage ──────────────────
client.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token } = JSON.parse(raw);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore parse errors — request goes through without header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — unwrap wrapper + handle 401 ────────────────────────
client.interceptors.response.use(
  (response) => {
    // Blob responses (PDF / DOCX downloads) — return the raw blob directly
    if (response.data instanceof Blob) {
      return response.data;
    }
    const body = response.data;
    if (body && body.success === false) {
      return Promise.reject(new Error(body.message || 'Request failed'));
    }
    // Return the inner `data` payload directly
    return body.data !== undefined ? body.data : body;
  },
  (error) => {
    // 401 Unauthorized — clear session and redirect to login
    if (error?.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default client;

