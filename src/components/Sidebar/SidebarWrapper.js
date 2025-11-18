import React from "react";
import AdminSidebar from "./AdminSidebar";
import ResponsableSidebar from "./ResponsableSidebar";

// import UserSidebar from "./UserSidebar";


const SidebarWrapper = ({ role, isOpen, onClose }) => {
  // Mapeo de roles provenientes de la BD
  const roleMap = {
    'ADM': 'admin',
    'RES': 'responsable',
    'EST': 'estudiante',
  };

  // Convertimos el role recibido desde BD al que usa tu frontend
  const mappedRole = roleMap[role] || role;

  // Renderizamos el sidebar según el role ya mapeado
  switch (mappedRole) {
    case "admin":
      return <AdminSidebar isOpen={isOpen} onClose={onClose} />;
    case "responsable":
      return <ResponsableSidebar isOpen={isOpen} onClose={onClose} />;
    case "user":
      return <UserSidebar isOpen={isOpen} onClose={onClose} />;
    default:
      return null;
  }
};

export default SidebarWrapper;
