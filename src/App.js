import React, { useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import { ThemeProvider } from "./context/ThemeContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import AppRoutes from './routes/AppRoutes';
// ProtectedRoute moved to `src/components/ProtectedRoute.js`

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <CoursesProvider>
          <Router>
            <AppLayout />
          </Router>
        </CoursesProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

function AppLayout() {
  const { user, setUser } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  // Sincronizar usuario de localStorage con el contexto al cargar
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (storedUser && isAuthenticated === 'true' && !user) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, [user, setUser]);

  // Mapear codigoRol de la BD al formato que usa tu app
  const getRoleKey = () => {
    // Prefer a normalized `user.role` if present (handle variants like 'ESTUDIANTE', 'Docente', etc.)
    if (user?.role) {
      const r = String(user.role).toLowerCase();
      const normalize = {
        'admin': 'admin',
        'administrador': 'admin',
        'adm': 'admin',
        'responsable': 'responsable',
        'res': 'responsable',
        'docente': 'docente',
        'profesor': 'docente',
        'doc': 'docente',
        'estudiante': 'estudiante',
        'est': 'estudiante',
        'user': 'user',
        'inv': 'user',
        'otro': 'user'
      };
      return normalize[r] || r;
    }

    if (user?.codigoRol) {
      const roleMap = {
        'ADM': 'admin',
        'RES': 'responsable',
        'DOC': 'docente',
        'EST': 'estudiante',
        'INV': 'user',
        'OTRO': 'user'
      };
      return roleMap[user.codigoRol] || 'user';
    }

    return 'admin';
  };
  const roleKey = getRoleKey();

  // Ocultar header/sidebar en rutas de autenticación (considerar /courses y /contact como públicas)
  const authPaths = ['/', '/login', '/register', '/courses', '/contact'];
  const isAuthRoute = authPaths.includes(location.pathname) || location.pathname.startsWith('/courses');

  // Mostrar sidebar sólo cuando hay usuario y no es usuario tipo 'user' (estudiante)
  // Mostrar sidebar solo para 'admin' y 'responsable'
  const showSidebar = Boolean(user) && (roleKey === 'admin' || roleKey === 'responsable') && !isAuthRoute;

  // Ruta por defecto según rol
  const defaultForRole = () => {
    if (!user) return '/'; // landing
    if (roleKey === 'responsable') return '/responsable/profile';
    if (roleKey === 'admin') return '/admin/panel';
    if (roleKey === 'docente') return '/profesor/panel';
    if (roleKey === 'estudiante' || roleKey === 'user') return '/user/panel';
    return '/';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Hide sidebar on auth pages */}
      {showSidebar && (
        <SidebarWrapper 
          role={roleKey} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}

      <main 
        className="main-content" 
        style={{ 
          flex: 1, 
          display: isAuthRoute ? 'block' : 'flex', 
          flexDirection: 'column', 
          overflow: 'auto', 
          // If the sidebar is visible we allow the CSS rule to apply (margin-left: 260px).
          // If there is no sidebar (e.g. estudiante/docente pages) force marginLeft to 0
          marginLeft: showSidebar ? undefined : 0
        }}
      >
        {/* Hide header on auth pages */}
        {!isAuthRoute && (
          <HeaderWrapper onToggleSidebar={showSidebar ? () => setIsSidebarOpen((v) => !v) : undefined} />
        )}

        {/* overlay controlled by state */}
        {showSidebar && (
          <div 
            className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}

        <AppRoutes />
      </main>
    </div>
  );
}

export default App;