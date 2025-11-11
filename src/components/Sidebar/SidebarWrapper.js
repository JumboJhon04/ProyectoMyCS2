import React from "react";
import AdminSidebar from "./AdminSidebar";
import ResponsableSidebar from "./ResponsableSidebar";
//import UserSidebar from "./UserSidebar";

const SidebarWrapper = ({ role, isOpen, onClose }) => {
  switch (role) {
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
