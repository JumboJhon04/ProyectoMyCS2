import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../config/api';
import '../../pages/landing.css';
import { useUser } from '../../context/UserContext';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [headerConfig, setHeaderConfig] = useState({
    siteName: 'Cursos UTA',
    menuItems: [
      { label: 'Inicio', link: '/' },
      { label: 'Cursos', link: '/courses' },
      { label: 'Contactos', link: '/contact' }
    ]
  });
  const { user, setUser } = useUser();
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const isAuthenticated = useMemo(() => {
    if (user || storedUser) return true;
    return localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('user');
  }, [user, storedUser]);

  const displayName = useMemo(() => {
    const u = user || storedUser;
    if (!u) return '';
    return u.nombres || u.NOMBRES || u.nombre || u.name || u.correo || u.email || 'Mi cuenta';
  }, [user, storedUser]);

  const dashboardPath = useMemo(() => {
    const u = user || storedUser;
    const rol = u?.codigoRol || u?.CODIGOROL;
    if (rol === 'ADM') return '/admin/panel';
    if (rol === 'RES') return '/responsable/profile';
    if (rol === 'DOC') return '/profesor/panel';
    if (rol === 'EST') return '/user/panel';
    return '/';
  }, [user, storedUser]);

  const userInitials = useMemo(() => {
    const name = displayName || '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return 'U';
  }, [displayName]);

  const userPhoto = useMemo(() => {
    const u = user || storedUser;
    if (!u) return null;
    return u.fotoPerfil || u.FOTO_PERFIL || u.foto || null;
  }, [user, storedUser]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = '/';
  };

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
    setUserMenuOpen(false);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={"landing-nav" + (open ? ' nav-open' : '')}>
      <div className="nav-inner">
        <div className="logo">{headerConfig.siteName}</div>

        <nav className="nav-links" onClick={closeMenu} style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {headerConfig.menuItems?.map((item, idx) => (
            <Link key={idx} to={item.link}>{item.label}</Link>
          ))}
        </nav>
        <div className="right-controls">
          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-chip" onClick={() => setUserMenuOpen(prev => !prev)}>
                <div className="user-chip-avatar" style={{ overflow: 'hidden', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userPhoto ? (
                    <img src={userPhoto} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{userInitials}</span>
                  )}
                </div>
                <div className="user-chip-name">{displayName}</div>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">Ingresar</Link>
            )}
            {isAuthenticated && userMenuOpen && (
              <div className="user-chip-menu">
                <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)}>Ir a mi panel</Link>
                <button type="button" onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
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
