import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaCheckCircle, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useUser } from '../../../../context/UserContext';
import { useCourses } from '../../../../context/CoursesContext';
import UserPanel from '../../UserPanel';
import './EstudiantePanel.css';
import API_URL from '../../../../config/api';

const EstudiantePanel = () => {
  const { user } = useUser();
  const { courses } = useCourses();
  const navigate = useNavigate();
  const [studentEvents, setStudentEvents] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Obtener el primer nombre para el saludo
  const firstName = user?.nombres ? user.nombres.split(' ')[0] : (user?.name ? user.name.split(' ')[0] : 'Fulanito');

  // Usar SOLO eventos reales del estudiante
  const coursesWithProgress = studentEvents.map((course, index) => ({
    id: course.eventoId || course.id,
    title: course.TITULO || course.title || course.name,
    imageUrl: course.URL_IMAGEN || course.imageUrl || 'https://via.placeholder.com/50',
    progress: [70, 40, 90][index % 3] || 50,
    lessons: course.HORAS || course.lessons || course.meta?.lessons || 20
  }));

  // Próximas pruebas: derivadas de los eventos del estudiante
  const upcomingExams = (studentEvents || []).slice(0, 3).map((ev, i) => ({
    id: i + 1,
    name: `Actividad: ${ev.TITULO || ev.title} `,
    courseId: ev.eventoId || ev.id,
    date: ev.FECHAINICIO || ev.startDate || 'Sin fecha',
    icon: <FaClipboardList />
  }));

  // Cargar eventos reales del estudiante
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
    <div className={`dashboard-user-container ${isDrawerOpen ? 'drawer-active' : ''}`}>

      {/* --- Sección de Bienvenida y Roles --- */}
      <UserPanel userName={firstName} role="Estudiante" message="Continúa aprendiendo" />

      {/* --- Contenido Principal (Cursos) --- */}
      <div className="dashboard-content-grid">
        <main className="course-list-main full-width">
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
              <p>No estás inscrito en ningún curso por el momento.</p>
              <button className="view-all-btn" onClick={() => navigate('/user/events')}>Ver cursos disponibles</button>
            </div>
          )}
        </main>
      </div>

      {/* --- Cajón Retráctil de Próximas Pruebas (Sidebar) --- */}
      <div className={`upcoming-drawer-container ${isDrawerOpen ? 'open' : 'closed'}`}>
        <button
          className="drawer-toggle-btn"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          title={isDrawerOpen ? "Cerrar próximas pruebas" : "Ver próximas pruebas"}
        >
          {isDrawerOpen ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <aside className="upcoming-exams-drawer-content">
          <h3><FaCalendarAlt style={{ marginRight: '8px' }} /> Próximas Pruebas</h3>

          {upcomingExams.length > 0 ? (
            <div className="exams-list">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="exam-item">
                  <div className="exam-icon-wrapper">
                    <span className="exam-icon">{exam.icon}</span>
                  </div>
                  <div className="exam-details">
                    <p className="exam-title">{exam.name}</p>
                    <span className="exam-date"><FaCalendarAlt style={{ marginRight: '4px', fontSize: '0.85em' }} /> {exam.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-exams-state">
              <span className="empty-icon"><FaCheckCircle /></span>
              <p>¡Todo listo!</p>
              <small>No tienes pruebas pendientes por ahora.</small>
            </div>
          )}
        </aside>
      </div>

    </div>
  );
};

export default EstudiantePanel;