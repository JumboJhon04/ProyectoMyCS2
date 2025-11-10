import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaBars } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import './Header.css';

export default function Header({ onToggleSidebar }) {
  const { user, unreadCount, markAllRead, notifications = [] } = useUser();
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef(null);

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotif((v) => !v);
  };

  useEffect(() => {
    const onDocClick = () => setShowNotif(false);
    // close when clicking outside
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // prevent closing when clicking inside the panel
  const onPanelClick = (e) => e.stopPropagation();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <header className="app-header">
      <div className="header-left">
        {/* hamburger for mobile (CSS shows/hides it via .sidebar-toggle rules) */}
        <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
          <FaBars />
        </button>
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

        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.displayRole || user?.role}</div>
        </div>

        <div className="user-avatar" title={user?.name}>
          {user?.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={user.avatarUrl} alt={`${user?.name} avatar`} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
}