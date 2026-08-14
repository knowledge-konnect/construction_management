import { useAuth } from '@/context/AuthContext';
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading authentication…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
