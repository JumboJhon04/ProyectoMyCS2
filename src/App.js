import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
import ResponsableProfile from "./pages/Responsable/ProfileResponsable/Profile";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";
import UserPanel from './pages/User/Estudiante/UserPanel/UserPanel';
import UserEvents from './pages/User/Estudiante/EventoUser/UserEvents';
import UserTests from './pages/User/Estudiante/UserTest/UserTest';
import CourseDetail from './pages/User/Estudiante/CourseDetail/CourseDetail';

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

  // Users don't have sidebar, only header navigation
  const showSidebar = roleKey !== 'user';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <SidebarWrapper role={roleKey} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      <main className={showSidebar ? "main-content" : ""} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', width: '100%' }}>
        <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        {/* overlay controlled by state: clicking it closes the sidebar */}
        {showSidebar && <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />}

        <Routes>
          {/* Redirect root to a role-specific default */}
          <Route path="/" element={
            <Navigate to={
              roleKey === 'responsable' ? '/responsable/profile' : 
              (roleKey === 'admin' ? '/admin/panel' : '/user/panel')
            } replace />
          } />

          {/* Admin routes */}
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<EventoAdmin />} />

          {/* Responsable routes */}
          <Route path="/responsable/profile" element={<ResponsableProfile />} />

          {/* User routes */}
          <Route path="/user/panel" element={<UserPanel />} />
          <Route path="/user/events" element={<UserEvents />} />
          <Route path="/user/tests" element={<UserTests />} />
          <Route path="/user/course/:courseId" element={<CourseDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;