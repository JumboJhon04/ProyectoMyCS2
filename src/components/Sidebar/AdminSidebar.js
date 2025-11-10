import React, { useState } from "react";
import { FaHome, FaCalendarAlt, FaUsers, FaTimes, FaBars, FaSearch } from "react-icons/fa";
import "./Sidebar.css";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("panel");
  const [searchTerm, setSearchTerm] = useState("");

  const menuItems = [
    { id: "panel", label: "Panel", icon: FaHome, href: "#panel" },
    { id: "eventos", label: "Eventos", icon: FaCalendarAlt, href: "#eventos" },
    { id: "usuarios", label: "Usuarios", icon: FaUsers, href: "#usuarios" },
  ];

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
    setIsOpen(false);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <FaBars />
      </button>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "active" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Administrador</h2>
          <button 
            className="sidebar-close" 
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`sidebar-item ${activeItem === item.id ? "active" : ""}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <IconComponent className="sidebar-icon" />
                  <span>{item.label}</span>
                </a>
              );
            })
          ) : (
            <div className="no-results">No se encontraron resultados</div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;