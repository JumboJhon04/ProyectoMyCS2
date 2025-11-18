import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
import ResponsableProfile from "./pages/Responsable/ProfileResponsable/Profile";
import EventoResponsable from "./pages/Responsable/EventoResponsable/EventoResponsable";
import UserPanelAdmin from "./pages/Admin/UserPanelAdmin/UserPanelAdmin";
import UsersResponsable from "./pages/Responsable/UsersResponsable/UsersResponsable";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import Landing from "./pages/Landing";
import AuthLogin from "./pages/Auth/Login";
import AuthRegister from "./pages/Auth/Register";

// Componente de ruta protegida
function ProtectedRoute({ children, requireAdmin = false, requireResponsable = false }) {
  const { user: contextUser } = useUser();
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Usar el usuario del contexto si está disponible, sino usar el del localStorage
  const user = contextUser || storedUser;

  if (!isAuthenticated || !user) {
    console.log('No autenticado o sin usuario. isAuthenticated:', isAuthenticated, 'user:', user);
    return <Navigate to="/login" replace />;
  }

  // Verificar si requiere permisos de admin
  if (requireAdmin && user.codigoRol !== 'ADM') {
    console.log('No es admin. codigoRol:', user.codigoRol);
    return <Navigate to="/" replace />;
  }

  // Verificar si requiere permisos de responsable
  if (requireResponsable && user.codigoRol !== 'RES' && user.codigoRol !== 'ADM') {
    console.log('No es responsable ni admin. codigoRol:', user.codigoRol);
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <UserProvider>
      <CoursesProvider>
        <Router>
          <AppLayout />
        </Router>
      </CoursesProvider>
    </UserProvider>
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
    if (user?.role) return user.role;
    
    if (user?.codigoRol) {
      const roleMap = {
        'ADM': 'admin',
        'RES': 'responsable',  // CAMBIADO: DOC -> RES
        'DOC': 'docente',  // Mantener DOC por compatibilidad
        'EST': 'user',
        'INV': 'user',
        'OTRO': 'user'
      };
      return roleMap[user.codigoRol] || 'user';
    }
    
    return 'admin';
  };

  const roleKey = getRoleKey();

  // Ocultar header/sidebar en rutas de autenticación
  const authPaths = ['/', '/login', '/register'];
  const isAuthRoute = authPaths.includes(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Hide sidebar on auth pages */}
      {!isAuthRoute && (
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
          marginLeft: isAuthRoute ? 0 : undefined 
        }}
      >
        {/* Hide header on auth pages */}
        {!isAuthRoute && (
          <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />
        )}

        {/* overlay controlled by state */}
        {!isAuthRoute && (
          <div 
            className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}

        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />

          {/* Rutas protegidas de Admin */}
          <Route 
            path="/admin/panel" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/events" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <EventoAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserPanelAdmin />
              </ProtectedRoute>
            } 
          />

          {/* Rutas protegidas de Responsable */}
          <Route 
            path="/responsable/profile" 
            element={
              <ProtectedRoute requireResponsable={true}>
                <ResponsableProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/responsable/events" 
            element={
              <ProtectedRoute requireResponsable={true}>
                <EventoResponsable />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/responsable/users" 
            element={
              <ProtectedRoute requireResponsable={true}>
                <UsersResponsable />
              </ProtectedRoute>
            } 
          />

          {/* Ruta por defecto: redirigir a login si no está autenticado */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;