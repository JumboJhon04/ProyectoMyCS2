import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useCourses } from '../../../../context/CoursesContext';
import PaymentModal from '../../../../components/PaymentModal/PaymentModal';
import './EstudianteEvents.css';

const EstudianteEvents = () => {
  const { user } = useUser();
  const { courses: availableCourses } = useCourses();
  const [courses, setCourses] = useState([]);
  const [view, setView] = useState('mine'); // 'mine' o 'all'
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  // Cargar solo los eventos en los que el estudiante está inscrito
  useEffect(() => {
    const fetchStudentEvents = async () => {
      if (!user || !user.id) return setCourses([]);
      try {
        const res = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/eventos`);
        if (!res.ok) {
          console.warn('No se pudieron obtener las inscripciones del estudiante');
          setCourses([]);
          return;
        }
        const json = await res.json();
        // json.data es un array de inscripciones con datos de evento
        const mapped = (json.data || []).map(item => {
          // item contiene: inscripcionId, FECHAINSCRIPCION, CODIGOESTADOINSCRIPCION, evento fields, URL_IMAGEN
          const progress = item.PORCENTAJE_ASISTENCIA ? Math.round(item.PORCENTAJE_ASISTENCIA) : 0;
          const lessons = item.HORAS || 0;
          // Determinar estado: si codigo estado inscripcion es ACE -> en progreso/finalizado
          let status = 'in-progress';
          const today = new Date().toISOString().split('T')[0];
          if (item.CODIGOESTADOINSCRIPCION === 'ACE') {
            if (item.FECHAFIN && item.FECHAFIN < today) status = 'completed';
            else status = 'in-progress';
          } else if (item.CODIGOESTADOINSCRIPCION === 'ANU' || item.CODIGOESTADOINSCRIPCION === 'REC') {
            status = 'cancelled';
          } else {
            status = 'in-progress';
          }

          return {
            id: item.eventoId || item.SECUENCIALEVENTO || item.SECUENCIAL,
            title: item.TITULO || item.title || 'Sin título',
            description: item.DESCRIPCION || item.description || 'Sin descripción',
            imageUrl: item.URL_IMAGEN || null,
            progress,
            lessons,
            completedLessons: Math.floor((lessons * (progress || 0)) / 100),
            status,
            raw: item
          };
        });

        setCourses(mapped);
      } catch (e) {
        console.error('Error cargando eventos del estudiante:', e.message);
        setCourses([]);
      }
    };

    fetchStudentEvents();
  }, [user]);

  // Cursos con estado calculado
  const coursesWithStatus = courses;

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, inscripcionId: null, monto: 0 });

  // Manejar inscripción desde la lista de todos los cursos
  const handleInscribirse = async (eventoId) => {
    if (!user || !user.id) {
      alert('Debes iniciar sesión para inscribirte');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/inscribir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al inscribirse');
      }
      
      // Si requiere pago, abrir modal de pago
      if (json.requierePago && json.inscripcionId) {
        setPaymentModal({
          isOpen: true,
          inscripcionId: json.inscripcionId,
          monto: json.monto
        });
      } else {
        alert('Inscripción realizada correctamente');
      }
      
      // Recargar mis cursos
      await reloadStudentEvents();
    } catch (e) {
      console.error('Error inscribiéndose:', e.message);
      alert(e.message);
    }
  };

  const reloadStudentEvents = async () => {
    if (!user || !user.id) return;
    try {
      const evRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/eventos`);
      const evJson = await evRes.json();
      setCourses((evJson.data || []).map(item => ({
        id: item.eventoId || item.SECUENCIALEVENTO || item.SECUENCIAL,
        title: item.TITULO || item.title || 'Sin título',
        description: item.DESCRIPCION || item.description || 'Sin descripción',
        imageUrl: item.URL_IMAGEN || null,
        progress: item.PORCENTAJE_ASISTENCIA ? Math.round(item.PORCENTAJE_ASISTENCIA) : 0,
        lessons: item.HORAS || 0,
        completedLessons: Math.floor(((item.HORAS || 0) * (item.PORCENTAJE_ASISTENCIA || 0)) / 100),
        status: item.CODIGOESTADOINSCRIPCION === 'ACE' ? 'in-progress' : 'in-progress',
        raw: item
      })));
    } catch (e) {
      console.error('Error recargando eventos:', e);
    }
  };

  // Filtrar cursos
  const filteredCourses = (view === 'mine' ? coursesWithStatus : (availableCourses || []).map(ev => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    imageUrl: ev.imageUrl,
    progress: 0,
    lessons: ev.meta?.hours || ev.meta?.lessons || ev.HORAS || 0,
    completedLessons: 0,
    status: 'available',
    raw: ev
  }))).filter(course => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.status === 'in-progress';
    if (filter === 'completed') return course.status === 'completed';
    return true;
  });

  return (
    <div className="user-events-container">
      {/* Header */}
      <div className="events-header">
        <div className="header-content">
          <h1 className="events-title">{view === 'mine' ? 'Mis Cursos' : 'Todos los Cursos'}</h1>
          <p className="events-subtitle">Gestiona tu progreso de aprendizaje</p>
          <div style={{ marginTop: 12 }}>
            <button className={`filter-btn ${view === 'mine' ? 'active' : ''}`} onClick={() => setView('mine')}>Mis Cursos</button>
            <button className={`filter-btn ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')} style={{ marginLeft: 8 }}>Todos los Cursos</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="events-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({view === 'mine' ? coursesWithStatus.length : (availableCourses || []).length})
          </button>
          <button
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            En Progreso ({(view === 'mine' ? coursesWithStatus.filter(c => c.status === 'in-progress').length : 0)})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completados ({(view === 'mine' ? coursesWithStatus.filter(c => c.status === 'completed').length : 0)})
          </button>
        </div>
      </div>

      {/* Grid de Cursos */}
      <div className="events-grid">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <p>No hay cursos {filter === 'all' ? 'disponibles' : filter === 'in-progress' ? 'en progreso' : 'completados'}</p>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="event-card">
              {/* Encabezado con imagen */}
              <div className="event-card-header">
                <img
                  src={course.imageUrl || 'https://via.placeholder.com/200/CCCCCC/666666?text=Curso'}
                  alt={course.title}
                  className="event-logo"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200/CCCCCC/666666?text=Curso'; }}
                />
                {course.status === 'completed' && (
                  <div className="completion-badge">
                    <span>✓</span> Completado
                  </div>
                )}
              </div>

              {/* Cuerpo */}
              <div className="event-card-body">
                <h3 className="event-title">{course.title}</h3>
                <p className="event-description">{course.description}</p>

                {/* Información de progreso */}
                <div className="progress-info">
                  <div className="progress-stats">
                    <span className="progress-label">
                      {course.completedLessons} / {course.lessons} lecciones
                    </span>
                    <span className="progress-percentage">{course.progress}%</span>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Estrellas de calificación */}
                <div className="event-rating">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`star ${i < (course.rating || 0) ? 'filled' : 'empty'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Botón de acción */}
                {view === 'mine' ? (
                  <button 
                    className="continue-btn"
                    onClick={() => navigate(`/user/course/${course.id}`)}
                  >
                    {course.status === 'completed' ? 'Revisar' : 'Continuar'}
                  </button>
                ) : (
                  <button 
                    className="continue-btn"
                    onClick={() => navigate(`/payment/${course.raw?.id || course.id}`)}
                  >
                    Comprar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, inscripcionId: null, monto: 0 })}
        inscripcionId={paymentModal.inscripcionId}
        monto={paymentModal.monto}
        onPaymentSuccess={reloadStudentEvents}
      />
    </div>
  );
};

export default EstudianteEvents;