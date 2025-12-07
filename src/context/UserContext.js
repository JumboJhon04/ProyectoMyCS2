import React, { createContext, useContext, useEffect, useState } from "react";

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

  const [notifications, setNotifications] = useState([]);

  // Cargar notificaciones de pagos pendientes si el usuario es responsable
  useEffect(() => {
    const loadPagosNotifications = async () => {
      // Verificar si el usuario es responsable
      const isResponsable = user?.codigoRol === 'RES' || user?.CODIGOROL === 'RES';
      
      if (isResponsable) {
        try {
          const response = await fetch('http://localhost:5000/api/pagos/pendientes/conteo');
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

  useEffect(() => {
    // Sincronizar con localStorage cuando el usuario cambia
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
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

  // Roles se determinan a partir de `user.codigoRol` (p.ej. 'EST' -> estudiante, 'DOC' -> docente)
  return (
    <UserContext.Provider
      value={{ user, setUser, notifications, addNotification, markAllRead, unreadCount }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
