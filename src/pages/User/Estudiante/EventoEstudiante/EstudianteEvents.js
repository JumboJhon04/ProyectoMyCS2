import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useCourses } from '../../../../context/CoursesContext';
import PaymentModal from '../../../../components/PaymentModal/PaymentModal';
import './EstudianteEvents.css';
import '../../../CoursesFilters.css';

import API_URL from '../../../../config/api';

const EstudianteEvents = () => {
  const { user } = useUser();
  const { courses: availableCourses } = useCourses();
  const [courses, setCourses] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [view, setView] = useState('mine'); // 'mine' o 'all'
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, in-progress, completed
  const [tipoFilter, setTipoFilter] = useState('');
  const [costoFilter, setCostoFilter] = useState('');
  const [disponibilidadFilter, setDisponibilidadFilter] = useState('todos');
  const [soloAptos, setSoloAptos] = useState(false);

  const userCareerIds = useMemo(() => {
    if (!user) return [];
    const raw = user.carreras || user.CARRERAS || [];
    return raw
      .map(c => c?.SECUENCIAL || c?.id || c?.ID || c?.sec || c?.secId)
      .filter(Boolean)
      .map(Number);
  }, [user]);

  // Cargar solo los eventos en los que el estudiante está inscrito
  useEffect(() => {
    const fetchStudentEvents = async () => {
      if (!user || !user.id) return setCourses([]);
      try {
        const res = await fetch(`${API_URL}/api/estudiantes/${user.id}/eventos`);
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

          const eventoCarreras = (item.CARRERAS || []).map(cc => cc.SECUENCIAL || cc.id || cc.ID).filter(Boolean).map(Number);
          const hasCareerRestriction = eventoCarreras.length > 0;
          const esApto = !hasCareerRestriction || eventoCarreras.some(id => userCareerIds.includes(id));

          return {
            id: item.eventoId || item.SECUENCIALEVENTO || item.SECUENCIAL,
            title: item.TITULO || item.title || 'Sin título',
            description: item.DESCRIPCION || item.description || 'Sin descripción',
            imageUrl: item.URL_IMAGEN || null,
            progress,
            lessons,
            completedLessons: Math.floor((lessons * (progress || 0)) / 100),
            status,
            hasCareerRestriction,
            esApto,
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

  // Cargar todos los eventos disponibles con información de carreras
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/eventos/`);
        if (!res.ok) {
          console.warn('No se pudieron obtener todos los eventos');
          setAllEvents([]);
          return;
        }
        const json = await res.json();
        setAllEvents(json.data || []);
      } catch (e) {
        console.error('Error cargando todos los eventos:', e.message);
        setAllEvents([]);
      }
    };

    fetchAllEvents();
  }, []);

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
      const res = await fetch(`${API_URL}/api/estudiantes/${user.id}/inscribir`, {
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
      const evRes = await fetch(`${API_URL}/api/estudiantes/${user.id}/eventos`);
      const evJson = await evRes.json();
      setCourses((evJson.data || []).map(item => {
        const eventoCarreras = (item.CARRERAS || []).map(cc => cc.SECUENCIAL || cc.id || cc.ID).filter(Boolean).map(Number);
        const hasCareerRestriction = eventoCarreras.length > 0;
        const esApto = !hasCareerRestriction || eventoCarreras.some(id => userCareerIds.includes(id));
        return {
          id: item.eventoId || item.SECUENCIALEVENTO || item.SECUENCIAL,
          title: item.TITULO || item.title || 'Sin título',
          description: item.DESCRIPCION || item.description || 'Sin descripción',
          imageUrl: item.URL_IMAGEN || null,
          progress: item.PORCENTAJE_ASISTENCIA ? Math.round(item.PORCENTAJE_ASISTENCIA) : 0,
          lessons: item.HORAS || 0,
          completedLessons: Math.floor(((item.HORAS || 0) * (item.PORCENTAJE_ASISTENCIA || 0)) / 100),
          status: item.CODIGOESTADOINSCRIPCION === 'ACE' ? 'in-progress' : 'in-progress',
          hasCareerRestriction,
          esApto,
          raw: item
        };
      }));
    } catch (e) {
      console.error('Error recargando eventos:', e);
    }
  };

  // Filtrar cursos
  const filteredCourses = (view === 'mine' ? coursesWithStatus : (allEvents || []).map(ev => {
    const eventoCarreras = (ev.CARRERAS || []).map(cc => cc.SECUENCIAL || cc.id || cc.ID).filter(Boolean).map(Number);
    const hasCareerRestriction = eventoCarreras.length > 0;
    const esApto = !hasCareerRestriction || eventoCarreras.some(id => userCareerIds.includes(id));
    return {
      id: ev.SECUENCIAL || ev.id,
      title: ev.TITULO || ev.title || 'Sin título',
      description: ev.DESCRIPCION || ev.description || 'Sin descripción',
      imageUrl: ev.URL_IMAGEN || ev.imageUrl,
      progress: 0,
      lessons: ev.HORAS || ev.meta?.hours || ev.meta?.lessons || 0,
      completedLessons: 0,
      status: 'available',
      hasCareerRestriction,
      esApto,
      tipoEvento: ev.CODIGOTIPOEVENTO,
      esPagado: ev.ES_PAGADO === 1 || ev.ES_PAGADO === true,
      raw: ev
    };
  })).filter(course => {
    // Filtro de progreso (solo para mis cursos)
    if (view === 'mine') {
      if (filter === 'in-progress' && course.status !== 'in-progress') return false;
      if (filter === 'completed' && course.status !== 'completed') return false;
    }

    // Filtro por tipo
    if (tipoFilter && course.tipoEvento !== tipoFilter) return false;

    // Filtro por costo
    if (costoFilter === 'pagado' && !course.esPagado) return false;
    if (costoFilter === 'gratis' && course.esPagado) return false;

    // Filtro por aptitud
    if (soloAptos && !course.esApto) return false;

    // Filtro por disponibilidad
    if (disponibilidadFilter === 'aptos' && !course.esApto) return false;
    if (disponibilidadFilter === 'noaptos' && (course.esApto || !course.hasCareerRestriction)) return false;

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

        {/* Filtros de progreso (solo para Mis Cursos) */}
        {view === 'mine' && (
          <div className="events-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({coursesWithStatus.length})
            </button>
            <button
              className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setFilter('in-progress')}
            >
              En Progreso ({coursesWithStatus.filter(c => c.status === 'in-progress').length})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completados ({coursesWithStatus.filter(c => c.status === 'completed').length})
            </button>
          </div>
        )}

        {/* Filtros avanzados (solo para Todos los Cursos) */}
        {view === 'all' && (
          <div style={{ marginTop: '1rem' }}>
            <div className="events-filters" style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, marginRight: '0.5rem', color: '#0f172a' }}>Tipo:</span>
              <button className={`filter-btn ${tipoFilter === '' ? 'active' : ''}`} onClick={() => setTipoFilter('')}>Todo</button>
              <button className={`filter-btn ${tipoFilter === 'CUR' ? 'active' : ''}`} onClick={() => setTipoFilter('CUR')}>Curso</button>
              <button className={`filter-btn ${tipoFilter === 'TALL' ? 'active' : ''}`} onClick={() => setTipoFilter('TALL')}>Taller</button>
              <button className={`filter-btn ${tipoFilter === 'SEM' ? 'active' : ''}`} onClick={() => setTipoFilter('SEM')}>Seminario</button>
              <button className={`filter-btn ${tipoFilter === 'CONF' ? 'active' : ''}`} onClick={() => setTipoFilter('CONF')}>Conferencia</button>
            </div>
            <div className="events-filters" style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, marginRight: '0.5rem', color: '#0f172a' }}>Costo:</span>
              <button className={`filter-btn ${costoFilter === 'pagado' ? 'active' : ''}`} onClick={() => setCostoFilter(costoFilter === 'pagado' ? '' : 'pagado')}>Pagado</button>
              <button className={`filter-btn ${costoFilter === 'gratis' ? 'active' : ''}`} onClick={() => setCostoFilter(costoFilter === 'gratis' ? '' : 'gratis')}>Gratis</button>
            </div>
            {userCareerIds.length > 0 && (
              <div className="events-filters" style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, marginRight: '0.5rem', color: '#0f172a' }}>Aptitud:</span>
                <button className={`filter-btn ${soloAptos ? 'active' : ''}`} onClick={() => setSoloAptos(prev => !prev)}>Solo aptos para mi carrera</button>
              </div>
            )}
            <div className="events-filters">
              <span style={{ fontWeight: 600, marginRight: '0.5rem', color: '#0f172a' }}>Disponibilidad:</span>
              <button className={`filter-btn ${disponibilidadFilter === 'todos' ? 'active' : ''}`} onClick={() => setDisponibilidadFilter('todos')}>Todos</button>
              <button className={`filter-btn ${disponibilidadFilter === 'aptos' ? 'active' : ''}`} onClick={() => setDisponibilidadFilter('aptos')}>Aptos</button>
              <button className={`filter-btn ${disponibilidadFilter === 'noaptos' ? 'active' : ''}`} onClick={() => setDisponibilidadFilter('noaptos')}>No aptos</button>
            </div>
          </div>
        )}
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

                {/* Badge de aptitud */}
                {course.hasCareerRestriction && (
                  <div className="apt-badge" style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    background: course.esApto ? '#ecfdf3' : '#fef2f2',
                    color: course.esApto ? '#065f46' : '#b91c1c',
                    border: course.esApto ? '1px solid #bbf7d0' : '1px solid #fecdd3'
                  }}>
                    {course.esApto ? 'Apto para tu carrera' : 'No apto'}
                  </div>
                )}

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
                  course.hasCareerRestriction && !course.esApto ? (
                    <div style={{
                      padding: '10px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecdd3',
                      borderLeft: '4px solid #ef4444',
                      borderRadius: '8px',
                      color: '#991b1b',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      Solo para carreras habilitadas
                    </div>
                  ) : (
                    <button 
                      className="continue-btn"
                      onClick={() => navigate(`/payment/${course.raw?.id || course.id}`)}
                    >
                      Comprar
                    </button>
                  )
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