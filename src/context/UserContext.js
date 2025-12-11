import React, { createContext, useContext, useEffect, useState } from "react";
import API_URL from '../config/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {

  // Inicializar desde localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
      }
    }
    return null;
  });

  // Estado para el rol activo (puede diferir del rol real del usuario)
  const [activeRole, setActiveRole] = useState(() => {
    const stored = localStorage.getItem('activeRole');
    if (stored) return stored;
    // Por defecto, usar el codigoRol del usuario
    if (user?.codigoRol) return user.codigoRol;
    return null;
  });

  const [notifications, setNotifications] = useState([]);

  // Cargar datos del perfil (incluyendo foto) cuando el usuario se inicializa
  useEffect(() => {
    const loadProfileData = async () => {
      if (user && (user.id || user.SECUENCIAL)) {
        try {
          const id = user.id || user.SECUENCIAL;
          const response = await fetch(`${API_URL}/api/users/${id}/profile`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const profileData = data.data;
              const updatedUser = {
                ...user,
                nombres: profileData.NOMBRES || profileData.nombres || user.nombres,
                apellidos: profileData.APELLIDOS || profileData.apellidos || user.apellidos,
                telefono: profileData.TELEFONO || profileData.telefono || user.telefono,
                fotoPerfil: profileData.FOTO_PERFIL || profileData.fotoPerfil || profileData.foto,
                foto: profileData.FOTO_PERFIL || profileData.fotoPerfil || profileData.foto
              };
              
              // Simple check to avoid unnecessary updates
              if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            }
          }
        } catch (error) {
          console.error('Error al cargar datos del perfil:', error);
        }
      }
    };

    if (user) loadProfileData();
  }, []); // Run once on mount, but check user inside

  // Cargar notificaciones
  useEffect(() => {
    const loadPagosNotifications = async () => {
      const isResponsable = user?.codigoRol === 'RES' || user?.CODIGOROL === 'RES';

      if (isResponsable) {
        try {
          const response = await fetch(`${API_URL}/api/pagos/pendientes/conteo`);
          const data = await response.json();

          if (data.success && data.data?.total > 0) {
            const total = data.data.total;
            setNotifications(prev => {
              const existing = prev.find(n => n.type === 'pagos-pendientes');
              if (existing && existing.text.includes(total)) return prev; // No change

              const text = `Tienes ${total} ${total === 1 ? 'pago pendiente' : 'pagos pendientes'} de revisión`;
              if (existing) {
                  return prev.map(n => n.type === 'pagos-pendientes' ? { ...n, text, unread: true } : n);
              } else {
                  return [{ id: Date.now(), type: 'pagos-pendientes', text, unread: true, createdAt: new Date().toISOString() }, ...prev];
              }
            });
          } else {
             setNotifications(prev => prev.filter(n => n.type !== 'pagos-pendientes'));
          }
        } catch (error) {
          console.error('Error al cargar notificaciones de pagos:', error);
        }
      }
    };

    if (user) {
      loadPagosNotifications();
      const interval = setInterval(loadPagosNotifications, 60000); // 60 seconds
      return () => clearInterval(interval);
    }
  }, [user?.codigoRol, user?.CODIGOROL, user?.id]); // Only re-run if Identity/Role changes, not every field

  // Persistir activeRole
  useEffect(() => {
    if (activeRole) localStorage.setItem('activeRole', activeRole);
  }, [activeRole]);

  useEffect(() => {
    if (user?.codigoRol && !activeRole) setActiveRole(user.codigoRol);
  }, [user?.codigoRol, activeRole]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else {
        localStorage.removeItem('activeRole');
        setActiveRole(null);
    }
  }, [user]);

  const addNotification = (text) => {
    const n = { id: Date.now(), text, unread: true, createdAt: new Date().toISOString() };
    setNotifications((s) => [n, ...s]);
  };

  const markAllRead = () => {
    setNotifications((s) => s.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const switchRole = (newRole) => {
    if (newRole === 'EST' || newRole === 'DOC') setActiveRole(newRole);
  };

  const value = React.useMemo(() => ({
      user, setUser, activeRole, switchRole, notifications, addNotification, markAllRead, unreadCount
  }), [user, activeRole, notifications, unreadCount]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
