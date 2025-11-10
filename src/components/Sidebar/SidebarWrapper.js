import React from "react";
import AdminSidebar from "./AdminSidebar";
//import EditorSidebar from "./EditorSidebar";
//import UserSidebar from "./UserSidebar";
const SidebarWrapper = ({ role }) => {
  switch (role) {
    case "admin":
      return <AdminSidebar />;
    case "editor":
      return <EditorSidebar />;
    case "user":
      return <UserSidebar />;
    default:
      return null;
  }
};

export default SidebarWrapper;
