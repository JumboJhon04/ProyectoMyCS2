import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
import ResponsableProfile from "./pages/Responsable/ProfileResponsable/Profile";
//import ResponsableEvents from "./pages/Responsable/Events";
//import ResponsableUsers from "./pages/Responsable/Users";
//import ResponsableCalendar from "./pages/Responsable/Calendar";
import { UserProvider, useUser } from "./context/UserContext";
import { CoursesProvider } from "./context/CoursesContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarWrapper role={roleKey} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        {/* overlay controlled by state: clicking it closes the sidebar */}
        <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        <Routes>
          {/* Redirect root to a role-specific default */}
          <Route path="/" element={<Navigate to={roleKey === 'responsable' ? '/responsable/profile' : (roleKey === 'admin' ? '/admin/panel' : '/') } replace />} />

          {/* Admin routes */}
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<EventoAdmin />} />

          {/* Responsable routes (placeholders) */}
          <Route path="/responsable/ProfileResponsable/profile" element={<ResponsableProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
