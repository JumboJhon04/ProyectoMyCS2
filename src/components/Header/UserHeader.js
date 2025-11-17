import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import './UserHeader.css';

const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
  return initials.length > 2 ? initials.substring(0, 2) : initials;
}

const UserHeader = ({ onToggleSidebar}) => {
    const { user } = useUser();
    const [activeLink, setActiveLink] = useState("Inicio");
    const userInitials = getInitials(user?.name);

    return (
        <header className="user-header-container">
            {/* Sidebar toggle button */}
            <div className="user-header-left">
                <h2>Plataforma</h2>
            </div>

            {/* Navigation links */}
            <nav className="user-header-nav">
                <a
                    href="#"
                    className={activeLink === "Inicio" ? "active" : ""}
                    onClick={() => setActiveLink("Inicio")}
                >
                    Inicio
                </a>
                <a
                    href="#"
                    className={activeLink === "Modulos" ? "active" : ""}
                    onClick={() => setActiveLink("Modulos")}
                >
                    Modulos
                </a>
                <a
                    href="#"
                    className={activeLink === "Test" ? "active" : ""}
                    onClick={() => setActiveLink("Test")}
                >
                    Test
                </a>
                </nav>

                {/* User info */}
                <div className="user-header-right">
                    <div className="user-avatar-initials">
                        {userInitials || 'U'}
                    </div>
                </div>
        </header>
    );
};

export default UserHeader;