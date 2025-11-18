import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
import UserPanelAdmin from "./pages/Admin/UserPanelAdmin/UserPanelAdmin";
import ResponsableProfile from "./pages/Responsable/ProfileResponsable/Profile";
import EventoResponsable from "./pages/Responsable/EventoResponsable/EventoResponsable";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import Landing from "./pages/Landing";
import AuthLogin from "./pages/Auth/Login";
import AuthRegister from "./pages/Auth/Register";

import EstudiantePanel from './pages/User/Estudiante/EstudiantePanel/EstudiantePanel';
import EstudianteEvents from './pages/User/Estudiante/EventoEstudiante/EstudianteEvents';
import EstudianteTests from './pages/User/Estudiante/EstudianteTest/EstudianteTest';
import EstudianteCourseDetail from './pages/User/Estudiante/EstudianteCourseDetail/EstudianteCourseDetail';
import ProfesorPanel from './pages/User/Profesor/ProfesorPanel/ProfesorPanel';
import ProfesorModules from './pages/User/Profesor/ProfesorModules/ProfesorModules';
import ProfesorTest from './pages/User/Profesor/ProfesorTest/ProfesorTest';
import ProfesorCourseDetail from './pages/User/Profesor/ProfesorCourseDetail/ProfesorCourseDetail';

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
  const { user } = useUser();

  const roleKey = user?.role; // undefined when not authenticated

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const location = useLocation();

  // Rutas de autenticación limpias
  const authPaths = ['/login', '/register'];
  const isAuthRoute = authPaths.includes(location.pathname);

  // Mostrar sidebar sólo cuando hay usuario y no es usuario tipo 'user' (estudiante)
  const showSidebar = Boolean(user) && roleKey !== 'user' && !isAuthRoute;

  // Ruta por defecto según rol
  const defaultForRole = () => {
    if (!user) return '/'; // landing
    if (roleKey === 'responsable') return '/responsable/profile';
    if (roleKey === 'admin') return '/admin/panel';
    if (user?.subRole === 'profesor') return '/profesor/panel';
    return '/user/panel';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <SidebarWrapper role={roleKey} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      <main className={showSidebar ? "main-content" : ""} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', width: '100%' }}>
        {!isAuthRoute && <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />}

        {/* overlay controlled by state: clicking it closes the sidebar */}
        {showSidebar && <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />}

        <Routes>
          {/* Root: muestra landing si no hay usuario, o redirige según rol si está autenticado */}
          <Route path="/" element={
            user ? <Navigate to={defaultForRole()} replace /> : <Landing />
          } />

          {/* Auth routes */}
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />

          {/* Admin routes */}
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<EventoAdmin />} />
          <Route path="/admin/users" element={<UserPanelAdmin />} />

          {/* Responsable routes */}
          <Route path="/responsable/profile" element={<ResponsableProfile />} />
          <Route path="/responsable/eventos" element={<EventoResponsable />} />

          {/* Estudiante routes */}
          <Route path="/user/panel" element={<EstudiantePanel />} />
          <Route path="/user/events" element={<EstudianteEvents />} />
          <Route path="/user/tests" element={<EstudianteTests />} />
          <Route path="/user/course/:courseId" element={<EstudianteCourseDetail />} />

          {/* Profesor routes */}
          <Route path="/profesor/panel" element={<ProfesorPanel />} />
          <Route path="/profesor/modules" element={<ProfesorModules />} />
          <Route path="/profesor/test" element={<ProfesorTest />} />
          <Route path="/profesor/course/:courseId" element={<ProfesorCourseDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;