import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  // Mock user for testing (you can replace with fetch to /api/me)
  const [user, setUser] = useState({
    id: 1,
    name: "Wilson Pillapa",
  // role is a machine-friendly key used by wrappers (admin|responsable|user)
  role: "admin",
  // displayRole is the human-readable role shown in the UI
  displayRole: "Responsable",
  // subRole is used to switch between Estudiante and Profesor for users
  subRole: "estudiante", // 'estudiante' or 'profesor'
    avatarUrl: "", // leave empty to show placeholder
  });

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nuevo comentario en la página", unread: true, createdAt: new Date().toISOString() },
    { id: 2, text: "Evento aprobado", unread: true, createdAt: new Date().toISOString() },
  ]);

  useEffect(() => {
    // In a real app you'd load user & notifications from API here.
    // This mock keeps initial state for testing.
  }, []);

  const addNotification = (text) => {
    const n = { id: Date.now(), text, unread: true, createdAt: new Date().toISOString() };
    setNotifications((s) => [n, ...s]);
  };

  const markAllRead = () => {
    setNotifications((s) => s.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Función para cambiar el subRole entre 'estudiante' y 'profesor'
  const setSubRole = (newSubRole) => {
    setUser((prevUser) => ({
      ...prevUser,
      subRole: newSubRole,
    }));
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, setSubRole, notifications, addNotification, markAllRead, unreadCount }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
