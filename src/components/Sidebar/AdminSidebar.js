import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaCalendarAlt, FaSearch, FaUsers } from "react-icons/fa";
import "./Sidebar.css";

const AdminSidebar = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mantener solo los items que tenías originalmente: Editar Página y Eventos
  const menuItems = [
    { id: "panel", label: "Editar Página", icon: FaHome, to: "/admin/panel" },
    { id: "eventos", label: "Cursos", icon: FaCalendarAlt, to: "/admin/events" },
    { id: "users", label: "Usuarios Responsables", icon: FaUsers, to: "/admin/users" },
  ];

  const filtered = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Administrador</h2>
        <button className="sidebar-close" aria-label="Cerrar menú" onClick={onClose}>×</button>
      </div>

      <div className="sidebar-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <nav className="sidebar-menu">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;