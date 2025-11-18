// src/components/Header/ProfesorHeader.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
// Reutilizamos la lógica de iniciales de UserHeader.js
const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
  // La imagen muestra solo dos letras (FT)
  return initials.length > 2 ? initials.substring(0, 2) : initials; 
}

const ProfesorHeader = ({ onToggleSidebar, onLogout }) => {
        const { user } = useUser();
        const userInitials = getInitials(user?.name || `${user?.nombres || ''}`);

        const [showUserMenu, setShowUserMenu] = React.useState(false);
        const userMenuRef = React.useRef(null);

        React.useEffect(() => {
            const onDocClick = (e) => {
                if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                    setShowUserMenu(false);
                }
            };
            document.addEventListener('click', onDocClick);
            return () => document.removeEventListener('click', onDocClick);
        }, []);

        const toggleUserMenu = (e) => { e.stopPropagation(); setShowUserMenu(v => !v); };
        const handleLogout = () => { setShowUserMenu(false); if (onLogout) onLogout(); };

        return (
                <header className="app-header user-header-container"> {/* Reutiliza la clase principal de estilos */}
                        <div className="header-left">
                            <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
                                <FaBars />
                            </button>
                            <div className="greeting header-greeting"><span className="greeting-text">PLATAFORMA</span></div>
                        </div>

                        <nav className="user-header-nav">
                                <NavLink to="/profesor/panel" className={({ isActive }) => isActive ? "active" : ""}>Inicio</NavLink>
                                <NavLink to="/profesor/modules" className={({ isActive }) => isActive ? "active" : ""}>Modulos</NavLink>
                                <NavLink to="/profesor/test" className={({ isActive }) => isActive ? "active" : ""}>Test</NavLink>
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
                                            <div className="user-menu-role">{user?.rol || user?.displayRole || user?.role || 'Docente'}</div>
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

export default ProfesorHeader;