import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import AdminHeader from './AdminHeader';
import ResponsableHeader from './ResponsableHeader';
import Header from './Header';
import EstudianteHeader from './EstudianteHeader';
import ProfesorHeader from './ProfesorHeader';

const HeaderWrapper = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, setUser, activeRole } = useUser();

  // Función de logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('activeRole');
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  // Mapear codigoRol de la BD al formato que usa tu app
  // Usar activeRole si está disponible, sino derivar del usuario
  let roleKey = 'user';
  const roleToNormalize = activeRole || user?.role || user?.codigoRol;

  if (roleToNormalize) {
    const r = String(roleToNormalize).toUpperCase();
    const normalize = {
      'ADMIN': 'admin',
      'ADMINISTRADOR': 'admin',
      'ADM': 'admin',
      'RESPONSABLE': 'responsable',
      'RES': 'responsable',
      'DOCENTE': 'docente',
      'PROFESOR': 'docente',
      'DOC': 'docente',
      'ESTUDIANTE': 'estudiante',
      'EST': 'estudiante',
      'USER': 'user',
      'INV': 'user',
      'OTRO': 'user'
    };
    roleKey = normalize[r] || 'user';
  }

  // Render a role-specific header
  switch (roleKey) {
    case 'admin':
      return <AdminHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'responsable':
      return <ResponsableHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'estudiante':
      return <EstudianteHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'docente':
      return <ProfesorHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;

    default:
      return null;
  }
};

export default HeaderWrapper;