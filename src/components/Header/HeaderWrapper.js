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
  const { user, setUser } = useUser();

  // Función de logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  // Mapear codigoRol de la BD al formato que usa tu app
  let roleKey = user.role;
  if (!roleKey && user.codigoRol) {
    const roleMap = {
      'ADM': 'admin',
      'RES': 'responsable',  // CAMBIADO: agregar RES
      'DOC': 'responsable',  // Mantener DOC por compatibilidad
      'EST': 'user',
      'INV': 'user',
      'OTRO': 'user'
    };
    roleKey = roleMap[user.codigoRol] || 'user';
  }

  // Render a role-specific header
  switch (roleKey) {
    case 'admin':
      return <AdminHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'responsable':
      return <ResponsableHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'user':
      return <UserHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;

    default:
      return null;
  }
};

export default HeaderWrapper;