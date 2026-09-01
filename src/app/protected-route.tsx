import { Navigate, Outlet } from 'react-router';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import { useAuthContext } from '../features/auth/context/AuthContext';
import type { UserRole } from '../features/auth/api/auth-api';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isLoading, user } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Loading your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}