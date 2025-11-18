import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import './Header.css';

export default function Header({ onToggleSidebar, onLogout }) {
  const { user, unreadCount, markAllRead, notifications = [] } = useUser();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const panelRef = useRef(null);
  const userMenuRef = useRef(null);

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotif((v) => !v);
    setShowUserMenu(false); // Cerrar menú de usuario al abrir notificaciones
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();
    setShowUserMenu((v) => !v);
    setShowNotif(false); // Cerrar notificaciones al abrir menú de usuario
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      // Cerrar notificaciones si se hace clic fuera
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      // Cerrar menú de usuario si se hace clic fuera
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // prevent closing when clicking inside the panel
  const onPanelClick = (e) => e.stopPropagation();

  // Obtener iniciales del usuario
  const initials = user?.nombres && user?.apellidos
    ? `${user.nombres[0]}${user.apellidos[0]}`.toUpperCase()
    : user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // Obtener nombre completo
  const fullName = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.name || 'Usuario';

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
          <FaBars />
        </button>
      </div>

      <div className="header-right">
        {/* Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn notification"
            onClick={toggleNotifications}
            aria-haspopup="true"
            aria-expanded={showNotif}
          >
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="notifications-panel" ref={panelRef} onClick={onPanelClick}>
              <div className="notifications-header">
                <strong>Notificaciones</strong>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={() => markAllRead()}>
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <ul className="notifications-list">
                {notifications.length === 0 && <li className="notification-empty">No hay notificaciones</li>}
                {notifications.map((n) => (
                  <li key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                    <div className="notification-text">{n.text}</div>
                    <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Información del usuario (solo visible en desktop) */}
        <div className="user-info">
          <div className="user-name">{fullName}</div>
          <div className="user-role">
            {user?.rol || user?.displayRole || user?.role || 'Usuario'}
          </div>
        </div>

        {/* Avatar con menú desplegable */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-avatar clickable" 
            title={fullName}
            onClick={toggleUserMenu}
          >
            {user?.avatarUrl || user?.FOTO_PERFIL ? (
              <img src={user.avatarUrl || user.FOTO_PERFIL} alt={`${fullName} avatar`} />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Menú desplegable del usuario */}
          {showUserMenu && (
            <div 
              className="user-menu-panel" 
              ref={userMenuRef} 
              onClick={onPanelClick}
            >
              <div className="user-menu-header">
                <div className="user-menu-name">{fullName}</div>
                <div className="user-menu-email">
                  {user?.correo || user?.email || ''}
                </div>
                <div className="user-menu-role">
                  {user?.rol || user?.displayRole || user?.role || 'Usuario'}
                </div>
              </div>
              
              <div className="user-menu-divider"></div>
              
              <button className="user-menu-item logout" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}