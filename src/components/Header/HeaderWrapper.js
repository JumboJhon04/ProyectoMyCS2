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
  // Normalizar role si viene como texto (p.ej. 'ESTUDIANTE') o usar codigoRol si no
  let roleKey = 'user';
  if (user?.role) {
    const r = String(user.role).toLowerCase();
    const normalize = {
      'admin': 'admin',
      'administrador': 'admin',
      'adm': 'admin',
      'responsable': 'responsable',
      'res': 'responsable',
      'docente': 'docente',
      'profesor': 'docente',
      'doc': 'docente',
      'estudiante': 'estudiante',
      'est': 'estudiante',
      'user': 'user',
      'inv': 'user',
      'otro': 'user'
    };
    roleKey = normalize[r] || r;
  } else if (user?.codigoRol) {
    const roleMap = {
      'ADM': 'admin',
      'RES': 'responsable',
      'DOC': 'docente',
      'EST': 'estudiante',
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
    case 'estudiante':
      return <EstudianteHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;
    case 'docente':
      return <ProfesorHeader onToggleSidebar={onToggleSidebar} onLogout={handleLogout} />;

    default:
      return null;
  }
};

export default HeaderWrapper;