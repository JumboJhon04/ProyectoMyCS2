import React from "react";
import SidebarWrapper from "./components/Sidebar/SidebarWrapper";

function App() {
  // Simulación del rol actual (puede venir de login o contexto global)
  const currentRole = "admin"; // Cambia a "editor" o "user" para probar

  return (
    <div style={{ display: "flex" }}>
      <SidebarWrapper role={currentRole} />
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Panel de {currentRole}</h1>
      </div>
    </div>
  );
}

export default App;
