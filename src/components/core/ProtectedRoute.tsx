import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { checkPermission } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  allowedRoles?: string[];
  requiredPermission?: string;
  
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  const role = user?.role;
  const roleName = role?.name ?? '';

  // Check permission if specified
  if (requiredPermission && !checkPermission(role, requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check roles if specified
  if (allowedRoles && !allowedRoles.includes(roleName)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
