import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import EventoAdmin from "./pages/Admin/EventoAdmin/EventoAdmin";
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        {/* overlay controlled by state: clicking it closes the sidebar */}
        <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        <Routes>
          <Route path="/" element={<Navigate to="/admin/panel" replace />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<EventoAdmin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
