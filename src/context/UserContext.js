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

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nuevo comentario en la página", unread: true, createdAt: new Date().toISOString() },
    { id: 2, text: "Evento aprobado", unread: true, createdAt: new Date().toISOString() },
  ]);

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
