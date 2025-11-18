import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function ProtectedRoute({ children, requireAdmin = false, requireResponsable = false }) {
  const { user: contextUser } = useUser();
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const user = contextUser || storedUser;

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (requireAdmin && user.codigoRol !== 'ADM') return <Navigate to="/" replace />;

  if (requireResponsable && user.codigoRol !== 'RES' && user.codigoRol !== 'ADM') return <Navigate to="/" replace />;

  return children;
}