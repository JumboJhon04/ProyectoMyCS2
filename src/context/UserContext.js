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

  // Cargar notificaciones de pagos pendientes si el usuario es responsable
  useEffect(() => {
    const loadPagosNotifications = async () => {
      // Verificar si el usuario es responsable
      const isResponsable = user?.codigoRol === 'RES' || user?.CODIGOROL === 'RES';

      if (isResponsable) {
        try {
          const response = await fetch(`${API_URL}/api/pagos/pendientes/conteo`);
          const data = await response.json();

          if (data.success && data.data?.total > 0) {
            const total = data.data.total;

            // Actualizar notificaciones usando función de estado
            setNotifications(prev => {
              const existingNotification = prev.find(n => n.type === 'pagos-pendientes');

              if (existingNotification) {
                // Actualizar notificación existente
                return prev.map(n =>
                  n.type === 'pagos-pendientes'
                    ? { ...n, text: `Tienes ${total} ${total === 1 ? 'pago pendiente' : 'pagos pendientes'} de revisión`, unread: true }
                    : n
                );
              } else {
                // Agregar nueva notificación
                const newNotification = {
                  id: Date.now(),
                  type: 'pagos-pendientes',
                  text: `Tienes ${total} ${total === 1 ? 'pago pendiente' : 'pagos pendientes'} de revisión`,
                  unread: true,
                  createdAt: new Date().toISOString()
                };
                return [newNotification, ...prev.filter(n => n.type !== 'pagos-pendientes')];
              }
            });
          } else {
            // Remover notificación si no hay pagos pendientes
            setNotifications(prev => prev.filter(n => n.type !== 'pagos-pendientes'));
          }
        } catch (error) {
          console.error('Error al cargar notificaciones de pagos:', error);
        }
      } else {
        // Si no es responsable, remover notificaciones de pagos
        setNotifications(prev => prev.filter(n => n.type !== 'pagos-pendientes'));
      }
    };

    if (user) {
      loadPagosNotifications();
      // Actualizar cada 30 segundos
      const interval = setInterval(loadPagosNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Persistir activeRole en localStorage
  useEffect(() => {
    if (activeRole) {
      localStorage.setItem('activeRole', activeRole);
    }
  }, [activeRole]);

  // Sincronizar activeRole cuando cambia el usuario
  useEffect(() => {
    if (user?.codigoRol && !activeRole) {
      setActiveRole(user.codigoRol);
    }
  }, [user, activeRole]);

  useEffect(() => {
    // Sincronizar con localStorage cuando el usuario cambia
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      // Si no hay usuario, limpiar también el activeRole
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

  // Función para cambiar el rol activo
  const switchRole = (newRole) => {
    if (newRole === 'EST' || newRole === 'DOC') {
      setActiveRole(newRole);
    }
  };

  // Roles se determinan a partir de `user.codigoRol` (p.ej. 'EST' -> estudiante, 'DOC' -> docente)
  // activeRole permite cambiar entre vistas sin modificar el usuario real
  return (
    <UserContext.Provider
      value={{ user, setUser, activeRole, switchRole, notifications, addNotification, markAllRead, unreadCount }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
