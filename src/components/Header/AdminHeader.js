import React from 'react';
import Header from './Header';

const AdminHeader = ({ onToggleSidebar }) => {
  // For now reuse the generic Header and you can extend with admin-specific controls
  return (
    <div>
      <Header onToggleSidebar={onToggleSidebar} />
      {/* Example admin-only control could go here */}
    </div>
  );
};

export default AdminHeader;
