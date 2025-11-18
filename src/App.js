import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
import ResponsableProfile from "./pages/Responsable/ProfileResponsable/Profile";
import EventoResponsable from "./pages/Responsable/EventoResponsable/EventoResponsable";
import UserPanelAdmin from "./pages/Admin/UserPanelAdmin/UserPanelAdmin";
//import ResponsableUsers from "./pages/Responsable/Users";
//import ResponsableCalendar from "./pages/Responsable/Calendar";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import Landing from "./pages/Landing";
import Courses from "./pages/Courses";
import Contact from "./pages/Contact";
import AuthLogin from "./pages/Auth/Login";
import AuthRegister from "./pages/Auth/Register";

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

  // map role to a value SidebarWrapper understands; default to 'admin'
  const roleKey = user?.role || 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const location = useLocation();
  // ocultar header/sidebar en rutas públicas limpias (landing, login, register, courses, contact)
  const authPaths = ['/', '/login', '/register', '/courses', '/contact'];
  // también tratar rutas que comienzan con /courses (detalle) como públicas
  const isAuthRoute = authPaths.includes(location.pathname) || location.pathname.startsWith('/courses');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Hide sidebar on auth pages (landing, login, register) */}
      {!isAuthRoute && (
        <SidebarWrapper role={roleKey} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

  <main className="main-content" style={{ flex: 1, display: isAuthRoute ? 'block' : 'flex', flexDirection: 'column', overflow: 'auto', marginLeft: isAuthRoute ? 0 : undefined }}>
        {/* Hide header on auth pages */}
        {!isAuthRoute && <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />}

        {/* overlay controlled by state: clicking it closes the sidebar */}
        {!isAuthRoute && <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />}

        <Routes>
          {/* Root: mostrar Landing con dos botones */}
          <Route path="/" element={<Landing />} />

          {/* Auth route (login) */}
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin routes */}
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<EventoAdmin />} />
          <Route path="/admin/users" element={<UserPanelAdmin />} />

          {/* Responsable routes (placeholders) */}
          <Route path="/responsable/ProfileResponsable/profile" element={<ResponsableProfile />} />
          <Route path="/responsable/EventoResponsable/EventoResponsable" element={<EventoResponsable />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
