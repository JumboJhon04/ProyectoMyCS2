import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useCourses } from '../../../../context/CoursesContext';
import { useEffect, useState } from 'react';
import UserPanel from '../../UserPanel';
import './EstudiantePanel.css';
import API_URL from '../../../../config/api';

const EstudiantePanel = () => {
  const { user } = useUser();
  const { courses } = useCourses();
  const navigate = useNavigate();
  const [studentEvents, setStudentEvents] = useState([]);

  // Obtener el primer nombre para el saludo (usa datos reales)
  const firstName = user?.nombres ? user.nombres.split(' ')[0] : (user?.name ? user.name.split(' ')[0] : 'Fulanito');

  // Usar SOLO eventos reales del estudiante (no mostrar cursos globales si el usuario no está inscrito)
  const coursesWithProgress = studentEvents.map((course, index) => ({
    id: course.eventoId || course.id,
    title: course.TITULO || course.title || course.name,
    imageUrl: course.URL_IMAGEN || course.imageUrl || 'https://via.placeholder.com/50',
    progress: [70, 40, 90][index % 3] || 50,
    lessons: course.HORAS || course.lessons || course.meta?.lessons || 20
  }));

  // Próximas pruebas: derivadas de los eventos del estudiante (si hay fechas)
  const upcomingExams = (studentEvents || []).slice(0,3).map((ev, i) => ({
    id: i+1,
    name: `Actividad: ${ev.TITULO || ev.title}`,
    courseId: ev.eventoId || ev.id,
    date: ev.FECHAINICIO || ev.startDate || 'Sin fecha',
    icon: '📌'
  }));

  // Cargar eventos reales del estudiante (si está autenticado)
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user || !user.id) return;
      try {
        const res = await fetch(`${API_URL}/api/estudiantes/${user.id}/eventos`);
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data) setStudentEvents(json.data);
      } catch (e) {
        console.warn('No se pudieron cargar los eventos del estudiante:', e.message);
      }
    };
    fetchEvents();
  }, [user]);

  return (
    <div className="dashboard-user-container">
      
      {/* --- Sección de Bienvenida y Roles --- */}
      <UserPanel userName={firstName} role="Estudiante" message="Continúa aprendiendo" />

      {/* --- Contenido Principal (Cursos y Pruebas) --- */}
      <div className="dashboard-content-grid">
        
        {/* Columna Izquierda: Cursos */}
        <main className="course-list-main">
          {coursesWithProgress.length > 0 ? coursesWithProgress.map((course) => (
            <div 
              key={course.id} 
              className="course-card" 
              onClick={() => navigate(`/user/course/${course.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={course.imageUrl || 'https://via.placeholder.com/50'} 
                alt={course.title} 
                className="course-icon"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
              />
              <div className="course-details">
                <h3>{course.title}</h3>
                <p className="course-info">Programación • {course.lessons} lecciones</p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ padding: 20 }}>
              <p>No estás inscrito en ningún evento por el momento.</p>
              <button className="view-all-btn" onClick={() => navigate('/user/events')}>Ver eventos disponibles</button>
            </div>
          )}
        </main>

        {/* Columna Derecha: Próximas Pruebas */}
        <aside className="upcoming-exams-sidebar">
          <h3>Próximas Pruebas</h3>
          
          {upcomingExams.map((exam) => {
            const course = courses.find(c => c.id === exam.courseId);
            return (
              <div key={exam.id} className="exam-item">
                <span className="exam-icon">{exam.icon}</span>
                <div className="exam-details">
                  <p>{exam.name}</p>
                  <span className="exam-date">{exam.date}</span>
                </div>
              </div>
            );
          })}

        </aside>

      </div>
    </div>
  );
};

export default EstudiantePanel;