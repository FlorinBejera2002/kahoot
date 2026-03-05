import { createContext, useState, useEffect } from 'react';

export const AdminContext = createContext(null);

const ADMIN_KEY = 'quizblitz_admin';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_KEY);
    if (stored === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const login = (password) => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, password);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}
