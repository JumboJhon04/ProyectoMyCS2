import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import './EstudianteHeader.css';

const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
    return initials.length > 2 ? initials.substring(0, 2) : initials;
}

const UserHeader = ({ onToggleSidebar, onLogout }) => {
        const { user } = useUser();
        const userInitials = getInitials(user?.name || (user?.nombres ? `${user.nombres} ${user.apellidos}` : ''));
        const location = useLocation();

        const [showUserMenu, setShowUserMenu] = useState(false);
        const userMenuRef = useRef(null);

        useEffect(() => {
            const onDocClick = (e) => {
                if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                    setShowUserMenu(false);
                }
            };
            document.addEventListener('click', onDocClick);
            return () => document.removeEventListener('click', onDocClick);
        }, []);

        const toggleUserMenu = (e) => {
            e.stopPropagation();
            setShowUserMenu(v => !v);
        };

        const handleLogout = () => {
            setShowUserMenu(false);
            if (onLogout) onLogout();
        };

        return (
                <header className="app-header user-header-container">
                        <div className="header-left">
                            <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
                                <FaBars />
                            </button>
                            <div className="greeting header-greeting">
                                <span className="greeting-text">PLATAFORMA</span>
                            </div>
                        </div>

                        <nav className="user-header-nav">
                                <NavLink to="/user/panel" className={({ isActive }) => isActive ? "active" : ""}>Inicio</NavLink>
                                <NavLink to="/user/events" className={({ isActive }) => isActive ? "active" : ""}>Modulos</NavLink>
                                <NavLink to="/user/tests" className={({ isActive }) => isActive ? "active" : ""}>Test</NavLink>
                        </nav>

                        <div className="header-right">
                            <div style={{ position: 'relative' }}>
                                <div className="user-avatar" title={user?.nombres ? `${user.nombres} ${user.apellidos}` : user?.name} onClick={toggleUserMenu} style={{ cursor: 'pointer' }}>
                                    <span>{userInitials || 'FT'}</span>
                                </div>

                                {showUserMenu && (
                                    <div className="user-menu-panel" ref={userMenuRef} onClick={(e)=>e.stopPropagation()}>
                                        <div className="user-menu-header">
                                            <div className="user-menu-name">{user?.nombres ? `${user.nombres} ${user.apellidos}` : user?.name || 'Usuario'}</div>
                                            <div className="user-menu-email">{user?.correo || user?.email || ''}</div>
                                            <div className="user-menu-role">{user?.rol || user?.displayRole || user?.role || 'Estudiante'}</div>
                                        </div>
                                        <div className="user-menu-divider" />
                                        <button className="user-menu-item logout" onClick={handleLogout}><FaSignOutAlt /><span>Cerrar Sesión</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                </header>
        );
};

export default UserHeader;