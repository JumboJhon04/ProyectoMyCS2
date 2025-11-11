import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaBars } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import './Header.css';

export default function ResponsableHeader({ onToggleSidebar }) {
  const { user, unreadCount, markAllRead, notifications = [] } = useUser();
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const onDocClick = () => setShowNotif(false);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotif((v) => !v);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const onPanelClick = (e) => e.stopPropagation();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
          <FaBars />
        </button>

        <div className="greeting header-greeting">
          <span className="wave">👋</span>
          <span className="greeting-text">HOLA, {user?.displayRole ? user.displayRole.toUpperCase() : (user?.role || '').toUpperCase()}</span>
        </div>
      </div>

      <div className="header-right">
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

        <div className="user-avatar" title={user?.name}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user?.name} avatar`} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
