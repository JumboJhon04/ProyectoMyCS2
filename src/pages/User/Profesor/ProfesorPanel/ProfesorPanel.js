// src/pages/User/Profesor/ProfesorPanel/ProfesorPanel.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserPanel from '../../UserPanel';
import EventoProfesor from '../EventoProfesor/EventoProfesor';
import { FaDatabase, FaChartLine } from 'react-icons/fa'; // Iconos de ejemplo para los cursos
import './ProfesorPanel.css';

// Mock de datos para los cursos que imparte el profesor
const professorEvents = [
  { 
    id: 1, 
    title: "Base de Datos", 
    students: 30, 
    nextClassDate: "20/11/2025", 
    nextClassTime: "08:00", 
    icon: FaDatabase,
    imageUrl: 'https://via.placeholder.com/50/007bff/FFFFFF?text=DB' // Placeholder
  },
  { 
    id: 2, 
    title: "Análisis de Datos", 
    students: 25, 
    nextClassDate: "21/11/2025", 
    nextClassTime: "08:00", 
    icon: FaChartLine,
    imageUrl: 'https://via.placeholder.com/50/28a745/FFFFFF?text=AD' // Placeholder
  },
];

const ProfesorPanel = () => {
  const navigate = useNavigate();

  const handleViewAllModules = () => {
    navigate('/profesor/modules');
  };

  return (
    <div className="dashboard-user-container"> {/* Reutiliza el contenedor principal */}
      
      {/* Usamos UserPanel para la sección de bienvenida y cambio de rol */}
      <UserPanel userName="Fulanito" role="Docente" message="Continúa enseñando" />

      {/* --- Contenido Principal (Cursos y Opciones Rápidas) --- */}
      <div className="dashboard-content-grid"> {/* Reutiliza el grid de EstudiantePanel */}
        
        {/* Columna Izquierda: Lista de Cursos del Profesor (Eventos) */}
        <main className="course-list-main"> {/* Reutiliza la clase de lista */}
          <div className="profesor-events-list">
            {professorEvents.map(event => (
              <EventoProfesor
                key={event.id}
                id={event.id}
                title={event.title}
                students={event.students}
                nextClassDate={event.nextClassDate}
                nextClassTime={event.nextClassTime}
                icon={event.icon}
                imageUrl={event.imageUrl}
              />
            ))}
          </div>
          <button className="view-all-btn" onClick={handleViewAllModules}>Ver todos los módulos</button> {/* Reutiliza el botón */}
        </main>

        {/* Columna Derecha: Opciones Rápidas (Similar a Próximas Pruebas) */}
        <aside className="upcoming-exams-sidebar"> {/* Reutiliza la clase lateral */}
          <h3>Opciones Rápidas</h3>
          
          <div className="options-list">
            <button className="quick-option-btn">Crear prueba</button>
            <button className="quick-option-btn">Subir contenido</button>
            <button className="quick-option-btn">Estadísticas</button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ProfesorPanel;