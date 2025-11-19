import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useCourses } from '../../../../context/CoursesContext';
import { useUser } from '../../../../context/UserContext';
import PublicHeader from '../../../../components/PublicHeader/PublicHeader';
import './EstudianteCourseDetail.css';

const EstudianteCourseDetail = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInscrito, setIsInscrito] = useState(false);
  const [pagoAprobado, setPagoAprobado] = useState(false);
  const [inscripcionId, setInscripcionId] = useState(null);
  
  // Determinar si es una ruta pública (acceso desde /courses/:courseId sin autenticación)
  const isPublicRoute = location.pathname.startsWith('/courses/') && !location.pathname.startsWith('/user/course/') && !location.pathname.startsWith('/profesor/course/');

  // Encontrar el curso en el contexto (fallback)
  const courseFromContext = courses.find(c => c.id === parseInt(courseId));

  // Función para mapear códigos a nombres
  const mapCodigoToType = (codigo) => {
    const tipos = {
      'CUR': 'Curso',
      'TALL': 'Taller',
      'SEM': 'Seminario',
      'CONF': 'Conferencia',
      'EXP': 'Exposición'
    };
    return tipos[codigo] || 'Curso';
  };

  const mapCodigoToModalidad = (codigo) => {
    const modalidades = {
      'PRES': 'Presencial',
      'VIRT': 'Virtual',
      'HIBR': 'Híbrida',
      'SEMIP': 'Semi-presencial',
      'ADC': 'A Distancia'
    };
    return modalidades[codigo] || 'Presencial';
  };

  const mapEstado = (estado) => {
    const estados = {
      'DISPONIBLE': 'Disponible',
      'CERRADO': 'Cerrado',
      'CANCELADO': 'Cancelado',
      'EN CURSO': 'En Curso',
      'FINALIZADO': 'Finalizado',
      'CREADO': 'Creado'
    };
    return estados[estado] || estado;
  };

  // Obtener datos completos del curso desde la API
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/eventos/${courseId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar el curso');
        }

        setCourseData(data.data);
        setError(null);

        // Verificar si el usuario está inscrito y estado del pago
        if (user && user.id) {
          try {
            // Usar el endpoint que incluye inscripciones pendientes
            const inscripcionRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/inscripcion?eventoId=${courseId}`);
            if (inscripcionRes.ok) {
              const inscripcionData = await inscripcionRes.json();
              if (inscripcionData.data) {
                setIsInscrito(true);
                const idInscripcion = inscripcionData.data.inscripcionId || inscripcionData.data.SECUENCIAL;
                setInscripcionId(idInscripcion);
                
                // Verificar estado del pago si el curso es pagado (usar data.data que es la respuesta del fetch)
                const cursoEsPagado = data.data?.ES_PAGADO === 1;
                if (idInscripcion && cursoEsPagado) {
                  try {
                    const pagoRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${idInscripcion}`);
                    if (pagoRes.ok) {
                      const pagoData = await pagoRes.json();
                      const aprobado = pagoData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                      setPagoAprobado(aprobado || false);
                    } else {
                      setPagoAprobado(false);
                    }
                  } catch (e) {
                    console.warn('Error verificando pago:', e);
                    setPagoAprobado(false);
                  }
                } else {
                  // Si no es pagado, considerar como aprobado
                  setPagoAprobado(true);
                }
              } else {
                setIsInscrito(false);
                setPagoAprobado(false);
              }
            }
          } catch (e) {
            console.warn('Error verificando inscripción:', e);
            setIsInscrito(false);
            setPagoAprobado(false);
          }
        }
      } catch (err) {
        console.error('Error al cargar detalles del curso:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, user]);

  // Parsear topics del contenido
  const parseTopics = (contenido) => {
    if (!contenido) return [];
    
    try {
      const contenidoStr = contenido.trim();
      if (contenidoStr.startsWith('{') && contenidoStr.endsWith('}')) {
        const parsed = JSON.parse(contenidoStr);
        if (parsed.topics && Array.isArray(parsed.topics)) {
          return parsed.topics;
        }
      }
    } catch (e) {
      console.warn('Error parseando topics:', e);
    }
    return [];
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Obtener iniciales del docente
  const getDocenteInitials = (docente) => {
    if (!docente) return 'ND';
    const parts = docente.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return docente.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        {isPublicRoute && <PublicHeader />}
        <div className="error-message">
          <p>Cargando información del curso...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="course-detail-container">
        {isPublicRoute && <PublicHeader />}
        <div className="error-message">
          <p>{error || 'Curso no encontrado'}</p>
          <button onClick={() => navigate(isPublicRoute ? '/courses' : '/user/events')}>
            {isPublicRoute ? 'Volver a Cursos' : 'Volver a Mis Cursos'}
          </button>
        </div>
      </div>
    );
  }

  // Usar datos de la API o del contexto como fallback
  const course = courseData || courseFromContext;
  if (!course) {
    return (
      <div className="course-detail-container">
        {isPublicRoute && <PublicHeader />}
        <div className="error-message">
          <p>Curso no encontrado</p>
          <button onClick={() => navigate(isPublicRoute ? '/courses' : '/user/events')}>
            {isPublicRoute ? 'Volver a Cursos' : 'Volver a Mis Cursos'}
          </button>
        </div>
      </div>
    );
  }

  // Extraer información del curso
  const title = courseData?.TITULO || course?.title || 'Sin título';
  const description = courseData?.DESCRIPCION || course?.description || 'Sin descripción';
  const imageUrl = courseData?.URL_IMAGEN || course?.imageUrl || 'https://via.placeholder.com/200';
  const tipo = mapCodigoToType(courseData?.CODIGOTIPOEVENTO || course?.meta?.type);
  const modalidad = mapCodigoToModalidad(courseData?.CODIGOMODALIDAD || course?.meta?.modality);
  const horas = courseData?.HORAS || course?.meta?.hours || 0;
  const docente = courseData?.Docente || course?.meta?.docente || 'No especificado';
  const costo = courseData?.COSTO || course?.price || 0;
  const capacidad = courseData?.CAPACIDAD || course?.meta?.capacity || 'No especificada';
  const notaAprobacion = courseData?.NOTAAPROBACION || course?.meta?.passingGrade;
  const asistenciaMinima = courseData?.ASISTENCIAMINIMA || course?.meta?.attendanceRequired;
  const fechaInicio = courseData?.FECHAINICIO || course?.meta?.startDate;
  const fechaFin = courseData?.FECHAFIN || course?.meta?.endDate;
  const estado = mapEstado(courseData?.ESTADO || 'DISPONIBLE');
  const esPagado = courseData?.ES_PAGADO === 1 || course?.meta?.isPaid;
  const carreras = courseData?.CARRERAS || [];
  const topics = parseTopics(courseData?.CONTENIDO || '');
  
  // Crear "lecciones" basadas en los topics
  const lessons = topics.length > 0 
    ? topics.map((topic, index) => ({
        id: index + 1,
        title: typeof topic === 'string' ? topic : topic.title || `Tema ${index + 1}`,
        description: typeof topic === 'string' ? '' : topic.description || '',
        status: 'locked', // Por defecto bloqueadas
        type: 'lesson'
      }))
    : [];

  const totalLessons = lessons.length || topics.length || 0;
  const completedLessons = 0; // Esto se podría obtener de la inscripción del estudiante
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="course-detail-container">
      {isPublicRoute && <PublicHeader />}
      
      {/* Header del Curso */}
      <div className="course-detail-header">
        <div className="course-header-content">
          {/* Información izquierda */}
          <div className="course-header-left">
            <div className="course-tags">
              <span className="tag">{tipo}</span>
              <span className="tag">{modalidad}</span>
              {esPagado && <span className="tag">Pago</span>}
              {!esPagado && <span className="tag">Gratis</span>}
            </div>

            <h1 className="course-detail-title">{title}</h1>
            <p className="course-detail-description" dangerouslySetInnerHTML={{ __html: description }} />

            <div className="course-meta-info">
              {docente && (
                <div className="meta-item">
                  <span className="meta-badge">{getDocenteInitials(docente)}</span>
                  <span className="meta-text">{docente}</span>
                </div>
              )}
              {horas > 0 && (
                <div className="meta-item">
                  <span className="meta-icon">⏱</span>
                  <span className="meta-text">{horas} horas</span>
                </div>
              )}
              {capacidad && (
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span className="meta-text">{capacidad} cupos</span>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="course-additional-info">
              {fechaInicio && fechaFin && (
                <div>
                  <strong>📅 Fechas:</strong> Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {costo > 0 && (
                  <div>
                    <strong>💰 Costo:</strong> ${parseFloat(costo).toFixed(2)}
                  </div>
                )}
                {notaAprobacion && (
                  <div>
                    <strong>📝 Nota de aprobación:</strong> {notaAprobacion}/10
                  </div>
                )}
                {asistenciaMinima && (
                  <div>
                    <strong>✅ Asistencia mínima:</strong> {asistenciaMinima}%
                  </div>
                )}
                <div>
                  <strong>📊 Estado:</strong> {estado}
                </div>
              </div>

              {carreras.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>🎓 Carreras relacionadas:</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {carreras.map((carrera, idx) => (
                      <span key={idx} className="tag" style={{ fontSize: '0.85rem' }}>
                        {carrera.NOMBRE_CARRERA || carrera}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de comprar/inscribirse - Solo mostrar si NO está inscrito O si está inscrito pero el pago no está aprobado */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {isPublicRoute ? (
                <Link 
                  to={`/payment/${courseId}`}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.75rem 2rem', 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  {esPagado ? 'Comprar Curso' : 'Inscribirse Gratis'}
                </Link>
              ) : (
                // Solo mostrar botón si NO está inscrito O si está inscrito pero el pago no está aprobado
                (!isInscrito || (isInscrito && esPagado && !pagoAprobado)) && (
                  <Link 
                    to={`/payment/${courseId}`}
                    className="btn btn-primary"
                    style={{ 
                      padding: '0.75rem 2rem', 
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    {isInscrito && esPagado && !pagoAprobado 
                      ? 'Completar Pago' 
                      : esPagado 
                        ? 'Comprar Curso' 
                        : 'Inscribirse Gratis'}
                  </Link>
                )
              )}
              {/* Mensaje si ya está inscrito y pagado */}
              {!isPublicRoute && isInscrito && (!esPagado || pagoAprobado) && (
                <div style={{
                  padding: '1rem 1.5rem',
                  background: '#d1fae5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '8px',
                  color: '#065f46',
                  fontSize: '1rem',
                  fontWeight: 500
                }}>
                  ✅ Ya estás inscrito en este curso
                </div>
              )}
            </div>
          </div>

          {/* Logo del curso */}
          <div className="course-header-right">
            <div className="course-logo-circle">
              <img 
                src={imageUrl} 
                alt={title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
              />
            </div>
          </div>
        </div>

        {/* Barra de progreso - solo mostrar si hay lecciones */}
        {totalLessons > 0 && (
          <div className="course-progress-section">
            <div className="progress-header">
              <h3>Progreso</h3>
              <span className="progress-text">{completedLessons} de {totalLessons} temas completados</span>
            </div>
            <div className="progress-bar-large">
              <div 
                className="progress-bar-fill-large" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sección de Temas/Lecciones */}
      {totalLessons > 0 && (
        <div className="course-lessons-section">
          <div className="lessons-header">
            <div className="lessons-count-box">
              <span className="lessons-icon">📚</span>
              <div>
                <div className="lessons-count-label">Total de temas</div>
                <div className="lessons-count-number">{totalLessons}</div>
              </div>
            </div>
          </div>

          {/* Lista de Temas */}
          <div className="lessons-list">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`lesson-item ${lesson.status}`}
              >
                <div className="lesson-status-icon">
                  {lesson.status === 'completed' && <span className="status-check">✓</span>}
                  {lesson.status === 'in-progress' && <span className="status-progress">⟳</span>}
                  {lesson.status === 'locked' && <span className="status-lock">🔒</span>}
                </div>

                <div className="lesson-content">
                  <div className="lesson-header-row">
                    <h4 className="lesson-title">{lesson.title}</h4>
                    {lesson.status === 'completed' && (
                      <span className="lesson-badge completed-badge">Completa</span>
                    )}
                    {lesson.status === 'in-progress' && (
                      <span className="lesson-badge progress-badge">Iniciar</span>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="lesson-description">{lesson.description}</p>
                  )}
                </div>

                <button 
                  className="lesson-action-btn"
                  disabled={lesson.status === 'locked'}
                >
                  <span className="action-icon">👁</span>
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Si no hay temas, mostrar mensaje */}
      {totalLessons === 0 && (
        <div className="course-lessons-section">
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p>Este curso no tiene temas definidos aún.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstudianteCourseDetail;
