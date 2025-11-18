import React from 'react';
import Header from './Header';

const AdminHeader = ({ onToggleSidebar, onLogout }) => {
  return (
    <div>
      <Header onToggleSidebar={onToggleSidebar} onLogout={onLogout} />
      {/* Example admin-only control could go here */}
    </div>
  );
};

export default AdminHeader;