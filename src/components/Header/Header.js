import React from 'react';
import { FaBell, FaBars } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import './Header.css';

export default function Header({ onToggleSidebar }) {
  const { user, unreadCount, markAllRead } = useUser();

  return (
    <header className="app-header">
      <div className="header-left">
        {/* hamburger for mobile (CSS shows/hides it via .sidebar-toggle rules) */}
        <button className="sidebar-toggle" aria-label="Toggle menu" onClick={onToggleSidebar}>
          <FaBars />
        </button>
        {/* aquí podrías poner un título dinámico o breadcrumb */}
      </div>

      <div className="header-right">
        <button className="icon-btn notification" onClick={markAllRead}>
          <FaBell />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>

        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.displayRole || user?.role}</div>
        </div>
      </div>
    </header>
  );
}