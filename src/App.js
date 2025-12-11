import React, { useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import { ThemeProvider } from "./context/ThemeContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import AppRoutes from './routes/AppRoutes';
import FloatingSupportButton from './components/FloatingSupportButton/FloatingSupportButton';
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
  const { user, setUser, activeRole } = useUser();
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
  // Usar activeRole si está disponible, sino derivar del usuario  
  const getRoleKey = () => {
    const roleToNormalize = activeRole || user?.role || user?.codigoRol;

    if (roleToNormalize) {
      const r = String(roleToNormalize).toUpperCase();
      const normalize = {
        'ADMIN': 'admin',
        'ADMINISTRADOR': 'admin',
        'ADM': 'admin',
        'RESPONSABLE': 'responsable',
        'RES': 'responsable',
        'DOCENTE': 'docente',
        'PROFESOR': 'docente',
        'DOC': 'docente',
        'ESTUDIANTE': 'estudiante',
        'EST': 'estudiante',
        'USER': 'user',
        'INV': 'user',
        'OTRO': 'user'
      };
      return normalize[r] || 'user';
    }

    return 'user';
  };
  const roleKey = getRoleKey();

  // Ocultar header/sidebar en rutas de autenticación (considerar /courses y /contact como públicas)
  // /payment solo es authRoute si NO hay usuario (para mostrar PublicHeader)
  // Si hay usuario, /payment debe mostrar el header del rol
  const authPaths = ['/', '/login', '/register', '/courses', '/contact'];
  const isPaymentRoute = location.pathname.startsWith('/payment');
  // Si es ruta de payment y hay usuario, NO es authRoute (para mostrar header del rol)
  // Si es ruta de payment y NO hay usuario, SÍ es authRoute (para mostrar PublicHeader)
  const isAuthRoute = authPaths.includes(location.pathname) ||
    location.pathname.startsWith('/courses') ||
    (isPaymentRoute && !user);

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
          height: '100vh',
          overflow: 'auto',
          marginLeft: showSidebar ? undefined : 0
        }}
      >
        {/* Hide header on auth pages */}
        {!isAuthRoute && (
          <div style={{ flexShrink: 0, zIndex: 1000, position: 'relative' }}>
            <HeaderWrapper onToggleSidebar={showSidebar ? () => setIsSidebarOpen((v) => !v) : undefined} />
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', width: '100%' }}>
          <AppRoutes />
          <FloatingSupportButton />

          {/* overlay controlled by state */}
          {showSidebar && (
            <div
              className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;