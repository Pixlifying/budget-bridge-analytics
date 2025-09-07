import React from 'react';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRole, 
  fallback = null 
}) => {
  const { hasRole, loading } = useUserRole();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;