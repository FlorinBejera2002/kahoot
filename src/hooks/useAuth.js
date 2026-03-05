import { useContext } from 'react';
import { AdminContext } from '../context/AuthContext';

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
