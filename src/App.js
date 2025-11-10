import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";
import AdminPanel from "./pages/Admin/AdminPanel/AdminPanel";
import { UserProvider, useUser } from "./context/UserContext";
import HeaderWrapper from "./components/Header/HeaderWrapper";

function App() {
  return (
    <UserProvider>
      <Router>
        <AppLayout />
      </Router>
    </UserProvider>
  );
}

function AppLayout() {
  const { user } = useUser();

  // map role to a value SidebarWrapper understands; default to 'admin'
  const roleKey = user?.role || 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex' }}>
      <SidebarWrapper role={roleKey} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main style={{ flex: 1, padding: '20px' }}>
        <HeaderWrapper onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        {/* overlay controlled by state: clicking it closes the sidebar */}
        <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        <Routes>
          <Route path="/" element={<Navigate to="/admin/panel" replace />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/events" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
