import React from 'react';
import { useUser } from '../../context/UserContext';
import AdminHeader from './AdminHeader';
//import EditorHeader from './EditorHeader';
//import UserHeader from './UserHeader';

const HeaderWrapper = ({ onToggleSidebar }) => {
  const { user } = useUser();

  if (!user) return null;

  // For now we reuse AdminHeader for all roles. Expand with role-specific headers
  // (EditorHeader/UserHeader) when those components are available.
  return <AdminHeader onToggleSidebar={onToggleSidebar} />;
};

export default HeaderWrapper;
