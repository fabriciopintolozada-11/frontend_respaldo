import { Navigate, Outlet } from 'react-router';

import type { UserRole } from '../../../shared/types/openapi';
import { useAuth } from '../hooks/useAuth';

const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  RECEPTIONIST: '/recepcion',
  MECHANIC: '/mecanico',
  WORKSHOP_LEAD: '/taller',
  ADMIN: '/taller',
};

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback = ROLE_DEFAULT_ROUTE[user.role] ?? '/taller';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
