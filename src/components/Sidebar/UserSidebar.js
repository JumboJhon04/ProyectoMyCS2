import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const UserSidebar = ({ isOpen, onClose }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="close-btn" onClick={onClose}>&times;</button>
      <nav>
        <ul>
          <li><NavLink to="/user/panel" className={({ isActive }) => isActive ? "active" : ""}>Panel</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default UserSidebar;
