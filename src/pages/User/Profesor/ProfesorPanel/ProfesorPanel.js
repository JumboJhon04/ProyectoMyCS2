// src/pages/User/Profesor/ProfesorPanel/ProfesorPanel.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserPanel from '../../UserPanel';
import EventoProfesor from '../EventoProfesor/EventoProfesor';
import { useUser } from '../../../../context/UserContext';
import { useEffect, useState } from 'react';
import { FaDatabase, FaChartLine } from 'react-icons/fa'; // Iconos de ejemplo para los cursos
import './ProfesorPanel.css';

// Eventos que dictará el profesor (se cargarán desde backend)
const ProfesorPanel = () => {
  const { user } = useUser();
  const [professorEvents, setProfessorEvents] = useState([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user || !user.id) return;
      try {
        const res = await fetch(`http://localhost:5000/api/docentes/${user.id}/eventos`);
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data) setProfessorEvents(json.data);
      } catch (e) {
        console.warn('No se pudieron cargar los eventos del docente:', e.message);
      }
    };
    fetchEvents();
  }, [user]);

  const navigate = useNavigate();

  const handleViewAllModules = () => {
    navigate('/profesor/modules');
  };

  return (
    <div className="dashboard-user-container"> {/* Reutiliza el contenedor principal */}
      
      {/* Usamos UserPanel para la sección de bienvenida y cambio de rol */}
      <UserPanel userName={user?.nombres ? user.nombres.split(' ')[0] : 'Fulanito'} role="Docente" message="Continúa enseñando" />

      {/* --- Contenido Principal (Cursos y Opciones Rápidas) --- */}
      <div className="dashboard-content-grid"> {/* Reutiliza el grid de EstudiantePanel */}
        
        {/* Columna Izquierda: Lista de Cursos del Profesor (Eventos) */}
        <main className="course-list-main"> {/* Reutiliza la clase de lista */}
          <div className="profesor-events-list">
            {professorEvents.length > 0 ? professorEvents.map(ev => (
              <EventoProfesor
                key={ev.eventoId || ev.SECUENCIAL || ev.id}
                id={ev.eventoId || ev.SECUENCIAL || ev.id}
                title={ev.TITULO || ev.title}
                students={ev.CAPACIDAD || ev.students || 0}
                nextClassDate={ev.FECHAINICIO || ev.nextClassDate}
                nextClassTime={ev.FECHAFIN || ev.nextClassTime}
                imageUrl={ev.URL_IMAGEN || ev.imageUrl}
              />
            )) : (
              <div style={{ padding: 20 }}>
                <p>No tienes eventos asignados actualmente.</p>
              </div>
            )}
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