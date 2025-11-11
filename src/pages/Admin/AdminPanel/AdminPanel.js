import React from "react";
import { FaBell, FaUser, FaImage } from "react-icons/fa";
import "./AdminPanel.css";
import { /* useUser */ } from "../../../context/UserContext";

const AdminPanel = () => {
  // no longer using simulated notifications here
  // const { user, setUser, unreadCount, addNotification, markAllRead } = useUser();

  return (
    <div className="admin-container">
      {/* Main Content (header is shared component) */}
      <main className="main-content1">
        {/* Content Area */}
        <div className="content-area">
          <div className="content-grid">
            {/* Editar Imagen */}
            <div className="card large-card">
              <div className="card-header">
                <h3>Editar Imagen Inicio de la pagina</h3>
                <button className="btn-secondary">Agregar imagen</button>
              </div>
              <div className="image-preview">
                <div className="image-placeholder">
                  <FaImage />
                </div>
              </div>
            </div>

            {/* Colores */}
            <div className="card">
              <div className="card-header">
                <h3>Colores de la pagina</h3>
              </div>
              <div className="color-controls">
                <div className="color-slider">
                  <input type="range" min="0" max="255" defaultValue="128" className="slider slider-red" />
                  <div className="color-preview" style={{ backgroundColor: '#ff6b6b' }} />
                </div>
                <div className="color-slider">
                  <input type="range" min="0" max="255" defaultValue="128" className="slider slider-green" />
                  <div className="color-preview" style={{ backgroundColor: '#51cf66' }} />
                </div>
                <div className="color-slider">
                  <input type="range" min="0" max="255" defaultValue="128" className="slider slider-purple" />
                  <div className="color-preview" style={{ backgroundColor: '#845ef7' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Información de la página */}
          <div className="card full-width">
            <div className="card-header">
              <h3>informacion de la pagina</h3>
            </div>
            <textarea className="page-info-textarea" placeholder="informacion de la pagina" rows="8" />
            {/* Simular notificación button removed */}
            <div className="pagination">
              <button className="page-btn">1</button>
              <button className="page-btn active">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">4</button>
              <button className="page-btn">5</button>
              <span className="page-dots">...</span>
              <button className="page-btn">20</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;