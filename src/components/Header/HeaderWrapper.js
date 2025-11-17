import React from 'react';
import { useUser } from '../../context/UserContext';
import AdminHeader from './AdminHeader';
import ResponsableHeader from './ResponsableHeader';
import Header from './Header';
import UserHeader from './UserHeader';

const HeaderWrapper = ({ onToggleSidebar }) => {
  const { user } = useUser();

  if (!user) return null;

  // Render a role-specific header like SidebarWrapper: switch on role for consistency
  switch (user.role) {
    case 'admin':
      return <AdminHeader onToggleSidebar={onToggleSidebar} />;
    case 'responsable':
      return <ResponsableHeader onToggleSidebar={onToggleSidebar} />;
    case 'user':
      return <UserHeader onToggleSidebar={onToggleSidebar} />;
    default:
      return null;
  }
};

export default HeaderWrapper;
