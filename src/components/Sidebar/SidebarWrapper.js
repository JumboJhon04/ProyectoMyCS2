import React from "react";
import AdminSidebar from "./AdminSidebar";
//import EditorSidebar from "./EditorSidebar";
//import UserSidebar from "./UserSidebar";

const SidebarWrapper = ({ role, isOpen, onClose }) => {
  switch (role) {
    case "admin":
      return <AdminSidebar isOpen={isOpen} onClose={onClose} />;
    case "editor":
      return <EditorSidebar isOpen={isOpen} onClose={onClose} />;
    case "user":
      return <UserSidebar isOpen={isOpen} onClose={onClose} />;
    default:
      return null;
  }
};

export default SidebarWrapper;
