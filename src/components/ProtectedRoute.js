import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false, requireResponsable = false }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Solo admin puede acceder a rutas de admin
  if (requireAdmin && user.codigoRol !== 'ADM') {
    return <Navigate to="/" replace />;
  }

  // Responsable o Admin pueden acceder a rutas de responsable
  if (requireResponsable && user.codigoRol !== 'RES' && user.codigoRol !== 'ADM') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;