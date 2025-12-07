import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './FloatingSupportButton.css';

const FloatingSupportButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // No mostrar en rutas de autenticación
  const authPaths = ['/', '/login', '/register', '/courses', '/contact'];
  const isAuthRoute = authPaths.includes(location.pathname) || 
                      location.pathname.startsWith('/courses') ||
                      location.pathname.startsWith('/payment');

  // Solo mostrar para usuarios que no sean admin ni responsable
  if (!user || isAuthRoute) return null;
  
  const codigoRol = user.codigoRol || user.CODIGOROL;
  if (codigoRol === 'ADM' || codigoRol === 'RES') {
    return null;
  }

  const handleClick = () => {
    navigate('/user/solicitud-soporte');
  };

  return (
    <button 
      className="floating-support-button"
      onClick={handleClick}
      aria-label="Solicitar soporte"
      title="Solicitar soporte"
    >
      <span className="floating-support-icon">📋</span>
    </button>
  );
};

export default FloatingSupportButton;

