import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { AppLoader } from '@/components/feedback/AppLoader';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { token, isLoading } = useAuth();

  if (isLoading) return <AppLoader />;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
