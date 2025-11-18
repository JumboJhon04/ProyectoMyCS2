import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../pages/landing.css';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  function toggleMenu() {
    setOpen((s) => !s);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={"landing-nav" + (open ? ' nav-open' : '')}>
      <div className="nav-inner">
        <div className="logo">Cursos UTA</div>

        <nav className="nav-links" onClick={closeMenu}>
          <Link to="/">Inicio</Link>
          <Link to="/courses">Cursos</Link>
          <Link to="/contact">Contactos</Link>
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
