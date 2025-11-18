import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import './EstudianteHeader.css';

const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
  return initials.length > 2 ? initials.substring(0, 2) : initials;
}

const UserHeader = () => {
    const { user } = useUser();
    const userInitials = getInitials(user?.name);
    const location = useLocation();

    return (
        <header className="user-header-container">
            {/* Left side */}
            <div className="user-header-left">
                <h2>Plataforma</h2>
            </div>

            {/* Navigation links */}
            <nav className="user-header-nav">
                <NavLink
                    to="/user/panel"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Inicio
                </NavLink>
                <NavLink
                    to="/user/events"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Modulos
                </NavLink>
                <NavLink
                    to="/user/tests"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Test
                </NavLink>
            </nav>

            {/* User info */}
            <div className="user-header-right">
                <div className="user-avatar-initials">
                    {userInitials || 'FT'}
                </div>
            </div>
        </header>
    );
};

export default UserHeader;