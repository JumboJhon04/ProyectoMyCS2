import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import AdminHeader from './AdminHeader';
import ResponsableHeader from './ResponsableHeader';
import Header from './Header';
import EstudianteHeader from './EstudianteHeader';
import ProfesorHeader from './ProfesorHeader';

const HeaderWrapper = ({ onToggleSidebar }) => {
  const { user } = useUser();
  const location = useLocation();

  if (!user) return null;

  // Render a role-specific header like SidebarWrapper: switch on role for consistency
  switch (user.role) {
    case 'admin':
      return <AdminHeader onToggleSidebar={onToggleSidebar} />;
    case 'responsable':
      return <ResponsableHeader onToggleSidebar={onToggleSidebar} />;
    case 'user':
      // Determinar si es Estudiante o Profesor basado en el subRole del usuario o la ruta actual
      // Prioridad: subRole > ruta actual
      const isProfesor = user?.subRole === 'profesor' || location.pathname.startsWith('/profesor');
      return isProfesor ? <ProfesorHeader /> : <EstudianteHeader />;
    default:
      return null;
  }
};

export default HeaderWrapper;
