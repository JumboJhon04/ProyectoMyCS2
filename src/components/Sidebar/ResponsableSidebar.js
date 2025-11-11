import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaSearch, FaUser, FaRegFileAlt, FaUsers, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css";

const ResponsableSidebar = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const menuItems = [
    { id: "perfil", label: "PERFIL", icon: FaUser, to: "/responsable/ProfileResponsable/profile" },
    { id: "eventos", label: "CURSOS", icon: FaRegFileAlt, to: "/responsable/events" },
    { id: "usuarios", label: "USUARIOS", icon: FaUsers, to: "/responsable/users" },
    { id: "calendar", label: "CALENDARIO", icon: FaCalendarAlt, to: "/responsable/calendar" },
    { id: "salir", label: "SALIR", icon: FaSignOutAlt, to: "/logout" },
  ];

  const filtered = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`sidebar ${isOpen ? "active" : ""}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">RESPONSABLE</h2>
        <button className="sidebar-close" aria-label="Cerrar menú" onClick={onClose}>×</button>
      </div>

      <div className="sidebar-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <nav className="sidebar-menu">
        {filtered.length === 0 && (
          <div className="no-results">No hay resultados</div>
        )}

        {filtered.map((item) => {
          const Icon = item.icon;
          // For 'SALIR' we may want a different behaviour; keep NavLink to /logout for now
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
              onClick={onClose}
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

export default ResponsableSidebar;
