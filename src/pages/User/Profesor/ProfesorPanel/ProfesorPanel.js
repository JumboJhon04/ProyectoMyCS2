// src/pages/User/Profesor/ProfesorPanel/ProfesorPanel.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPanel from '../../UserPanel';
import { useUser } from '../../../../context/UserContext';
import { FaFileAlt, FaUpload, FaChartBar, FaCheckCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Iconos para opciones rápidas
import './ProfesorPanel.css';
import './ProfesorPanel.css';

import API_URL from '../../../../config/api';

// Eventos que dictará el profesor (se cargarán desde backend)
const ProfesorPanel = () => {
  const { user } = useUser();
  const [professorEvents, setProfessorEvents] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Obtener nombre
  const firstName = user?.nombres ? user.nombres.split(' ')[0] : 'Profesor';

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user || !user.id) return;
      try {
        const res = await fetch(`${API_URL}/api/docentes/${user.id}/eventos`);
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data) setProfessorEvents(json.data);
      } catch (e) {
        console.warn('No se pudieron cargar los eventos del docente:', e.message);
      }
    };
    fetchEvents();
  }, [user]);

  const hasAssignedCourses = professorEvents.length > 0;

  // "Actividades Pendientes" (Simuladas o reales si hubiera endpoint)
  // Por ahora usaremos los eventos para poblar esto o mostrar empty state
  const pendingActivities = []; // A futuro: filtrar entregas pendientes de calificar

  return (
    <div className={`dashboard-user-container ${isDrawerOpen ? 'drawer-active' : ''}`}>

      {/* Bienvenida */}
      <UserPanel userName={firstName} role="Docente" message="Continúa enseñando" />

      {/* Contenido Principal */}
      <div className="dashboard-content-grid">

        {/* --- Sección 1: Actividades Pendientes (Calificación) --- */}
        <section className="dashboard-section pending-tasks-section">
          <div className="section-header">
            <h2>Actividades Pendientes</h2>
            <small>Entregas por calificar</small>
          </div>

          <div className="tasks-grid">
            {pendingActivities.length > 0 ? pendingActivities.map((task, i) => (
              <div key={i} className="task-card-summary">
                <div className="task-icon"><FaFileAlt /></div>
                <div className="task-info">
                  <h4>{task.title}</h4>
                  <span className="task-date">{task.date}</span>
                </div>
              </div>
            )) : (
              <div className="empty-section-state">
                <FaCheckCircle className="empty-state-icon" style={{ color: hasAssignedCourses ? '#94e19a' : '#cbd5e1' }} />

                {hasAssignedCourses ? (
                  <>
                    <p style={{ color: '#2c3e50', fontWeight: 'bold' }}>¡Todo al día!</p>
                    <span style={{ color: '#64748b' }}>No tienes entregas pendientes de calificar.</span>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#2c3e50', fontWeight: 'bold' }}>Sin asignaciones</p>
                    <span style={{ color: '#64748b', marginBottom: '1rem', display: 'block' }}>No tienes cursos asignados actualmente.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* --- Sección 2: Mis Módulos (Cursos) --- */}
        {/* Aquí podríamos mostrar un preview, o reutilizar la lista de eventos como "Cursos" */}
        {/* Para mantener simetría con estudiante, si se requiere lista visual iría aquí. 
            El usuario pidió "replicar", así que dejaremos la navegación principal abajo y el preview visual si aplica.*/}

        <div className="navigation-actions">
          <button className="navigate-courses-btn" onClick={() => navigate('/profesor/modules')}>
            Ver Mis Módulos
          </button>
        </div>

      </div>

      {/* --- Cajón Retráctil de Opciones Rápidas (Sidebar) --- */}
      <div className={`upcoming-drawer-container ${isDrawerOpen ? 'open' : 'closed'}`}>
        <button
          className="drawer-toggle-btn"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          title={isDrawerOpen ? "Cerrar opciones" : "Ver opciones rápidas"}
        >
          {isDrawerOpen ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <aside className="upcoming-exams-drawer-content">
          <h3><FaChartBar style={{ marginRight: '8px' }} /> Opciones Rápidas</h3>

          <div className="options-list">
            <button className="quick-option-btn">
              <FaFileAlt className="option-icon" /> Crear prueba
            </button>
            <button className="quick-option-btn">
              <FaUpload className="option-icon" /> Subir contenido
            </button>
            <button className="quick-option-btn">
              <FaChartBar className="option-icon" /> Estadísticas
            </button>
          </div>
        </aside>
      </div>

    </div>
  );
};

export default ProfesorPanel;