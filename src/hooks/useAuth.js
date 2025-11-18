import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay usuario en localStorage al cargar
    const storedUser = localStorage.getItem('user');
    const authStatus = localStorage.getItem('isAuthenticated');

    if (storedUser && authStatus === 'true') {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const isAdmin = () => {
    return user?.codigoRol === 'ADM' || user?.codigoRol === 'DOC';
  };

  const isStudent = () => {
    return user?.codigoRol === 'EST';
  };

  return {
    user,
    isAuthenticated,
    logout,
    isAdmin,
    isStudent
  };
};