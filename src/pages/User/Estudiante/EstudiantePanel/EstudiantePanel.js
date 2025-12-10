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

  // Próximas pruebas (Drawer)
  const upcomingExams = (studentEvents || []).slice(0, 3).map((ev, i) => ({
    id: i + 1,
    name: `Actividad: ${ev.TITULO || ev.title} `,
    courseId: ev.eventoId || ev.id,
    date: ev.FECHAINICIO || ev.startDate || 'Sin fecha',
    icon: <FaClipboardList />
  }));

  // Tareas Pendientes (sección principal)
  // Filtrar tareas que sean a futuro para considerarlas "pendientes"
  const futureEvents = (studentEvents || []).filter(ev => {
    const d = ev.FECHAINICIO || ev.startDate;
    if (!d) return true; // Si no hay fecha, asumir pendiente
    return new Date(d) > new Date(); // Solo futuras
  });

  const pendingTasks = futureEvents.slice(0, 4);
  const hasEnrolledCourses = coursesWithProgress.length > 0;

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

      {/* --- Contenido Principal Restructurado --- */}
      <div className="dashboard-content-grid">

        {/* --- Sección 1: Tareas Pendientes --- */}
        <section className="dashboard-section pending-tasks-section">
          <div className="section-header">
            <h2>Tareas Pendientes</h2>
            <small>Tus actividades prioritarias</small>
          </div>

          <div className="tasks-grid">
            {pendingTasks.length > 0 ? pendingTasks.map((task, i) => (
              <div key={i} className="task-card-summary">
                <div className="task-icon"><FaClipboardList /></div>
                <div className="task-info">
                  <h4>{task.TITULO || task.title}</h4>
                  <span className="task-date">{task.FECHAINICIO || task.startDate}</span>
                </div>
              </div>
            )) : (
              <div className="empty-section-state">
                <FaCheckCircle className="empty-state-icon" style={{ color: hasEnrolledCourses ? '#94e19a' : '#cbd5e1' }} />

                {hasEnrolledCourses ? (
                  /* Caso 1: Inscrito pero sin tareas pendientes (Al día) */
                  <>
                    <p style={{ color: '#2c3e50', fontWeight: 'bold' }}>¡Estás al día!</p>
                    <span style={{ color: '#64748b' }}>No tienes tareas pendientes urgentes.</span>
                  </>
                ) : (
                  /* Caso 2: No inscrito (Invitar a inscribirse) */
                  <>
                    <p style={{ color: '#2c3e50', fontWeight: 'bold' }}>No tienes cursos inscritos</p>
                    <span style={{ color: '#64748b', marginBottom: '1rem', display: 'block' }}>Inscríbete en un curso para ver tus actividades.</span>
                    <button className="navigate-courses-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/user/events')}>
                      Ir a Cursos
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* --- Enlace para Ver Cursos (Acción Principal) --- */}


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

              {hasEnrolledCourses ? (
                /* Caso 1: Inscrito pero sin pruebas (Todo listo) */
                <>
                  <p>¡Todo listo!</p>
                  <small>No tienes pruebas pendientes por ahora.</small>
                </>
              ) : (
                /* Caso 2: No inscrito (Invitar a inscribirse) */
                <>
                  <p>Sin cursos</p>
                  <small>Inscríbete para ver tus próximas pruebas.</small>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

    </div>
  );
};

export default EstudiantePanel;