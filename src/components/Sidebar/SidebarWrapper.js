import React from "react";
import AdminSidebar from "./AdminSidebar";
import ResponsableSidebar from "./ResponsableSidebar";
import UserSidebar from "./UserSidebar";
import EstudianteSidebar from "./UserSidebar";
import ProfesorSidebar from "./AdminSidebar"; // fallback if no specific profesor sidebar exists

const SidebarWrapper = ({ role, isOpen, onClose }) => {
  // Soportar tanto códigos desde la BD (ADM, RES, EST, DOC)
  // como claves ya mapeadas por el frontend (admin, responsable, profesor, estudiante, user)
  const bdMap = {
    'ADM': 'admin',
    'RES': 'responsable',
    'EST': 'estudiante',
    'DOC': 'docente'
  };

  let mappedRole = bdMap[role] || role;

  // Normalizar algunos alias
  if (mappedRole === 'user') mappedRole = 'estudiante';

  switch (mappedRole) {
    case 'admin':
      return <AdminSidebar isOpen={isOpen} onClose={onClose} />;
    case 'responsable':
      return <ResponsableSidebar isOpen={isOpen} onClose={onClose} />;
    case 'docente':
      return <ProfesorSidebar isOpen={isOpen} onClose={onClose} />;
    case 'estudiante':
      return <EstudianteSidebar isOpen={isOpen} onClose={onClose} />;
    default:
      return null;
  }
};

export default SidebarWrapper;
