import { AppLoader } from '@/components/loading/Loaders';
import { useAuth } from '@/context/AuthContext';
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoader fullscreen={false} message="Verifying your sign-in and preparing your workspace…" />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
