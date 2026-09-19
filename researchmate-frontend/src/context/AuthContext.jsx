// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const STORAGE_KEY = 'researchmate_auth';

const AuthContext = createContext(null);

/**
 * Reads the persisted session from localStorage.
 * Returns { user, token } or { user: null, token: null } if nothing stored or token is expired.
 */
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    if (parsed?.token) {
      try {
        const decoded = jwtDecode(parsed.token);
        if (decoded?.exp && decoded.exp * 1000 <= Date.now()) {
          localStorage.removeItem(STORAGE_KEY);
          return { user: null, token: null };
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return { user: null, token: null };
      }
      return parsed;
    }
  } catch {
    // corrupted storage — ignore
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  /** Persist a new session to state + localStorage */
  const persistSession = useCallback((user, token) => {
    const next = { user, token };
    setSession(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** Clear session from state + localStorage */
  const logout = useCallback(() => {
    setSession({ user: null, token: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /** Proactive JWT Expiry Timer */
  useEffect(() => {
    if (!session.token) return;

    try {
      const decoded = jwtDecode(session.token);
      if (!decoded?.exp) return;

      const remainingTime = decoded.exp * 1000 - Date.now();

      const handleExpiry = () => {
        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      };

      if (remainingTime <= 0) {
        handleExpiry();
        return;
      }

      const timer = setTimeout(handleExpiry, remainingTime);
      return () => clearTimeout(timer);
    } catch {
      logout();
    }
  }, [session.token, logout]);

  /** Call POST /api/auth/login, persist token, return resolved data */
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.message || 'Login failed');
    const { userId, name, email: userEmail, token } = body.data;
    persistSession({ userId, name, email: userEmail }, token);
    return body.data;
  }, [persistSession]);

  /** Call POST /api/auth/register, persist token, return resolved data */
  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.message || 'Registration failed');
    const { userId, name: userName, email: userEmail, token } = body.data;
    persistSession({ userId, name: userName, email: userEmail }, token);
    return body.data;
  }, [persistSession]);

  const value = {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token),
    login,
    register,
    logout,
    persistSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

