
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | null; // null means any authenticated user
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole = null 
}) => {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (requiredRole && currentUser?.role !== requiredRole) {
      navigate('/unauthorized');
    }
  }, [isLoggedIn, currentUser, navigate, requiredRole]);

  if (!isLoggedIn) {
    return null;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};
