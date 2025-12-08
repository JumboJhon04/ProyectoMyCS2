import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../config/api';
import '../../pages/landing.css';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [headerConfig, setHeaderConfig] = useState({
    siteName: 'Cursos UTA',
    menuItems: [
      { label: 'Inicio', link: '/' },
      { label: 'Cursos', link: '/courses' },
      { label: 'Contactos', link: '/contact' }
    ]
  });

  useEffect(() => {
    const fetchHeaderConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config/home`);
        const data = await response.json();
        
        if (data.success && data.data.header) {
          setHeaderConfig(data.data.header);
        }
      } catch (error) {
        console.error('Error al cargar configuración del header:', error);
      }
    };
    
    fetchHeaderConfig();
  }, []);

  function toggleMenu() {
    setOpen((s) => !s);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={"landing-nav" + (open ? ' nav-open' : '')}>
      <div className="nav-inner">
        <div className="logo">{headerConfig.siteName}</div>

        <nav className="nav-links" onClick={closeMenu}>
          {headerConfig.menuItems?.map((item, idx) => (
            <Link key={idx} to={item.link}>{item.label}</Link>
          ))}
        </nav>
        <div className="right-controls">
          <div className="nav-actions">
            <Link to="/login" className="btn btn-primary">Ingresar</Link>
          </div>

          <button
            className="hamburger"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={toggleMenu}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
