import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useCourses } from '../../../../context/CoursesContext';
import { useUser } from '../../../../context/UserContext';
import PublicHeader from '../../../../components/PublicHeader/PublicHeader';
import {
  FaClock, FaUsers, FaCalendarAlt, FaMoneyBillWave,
  FaClipboardCheck, FaCheckCircle, FaChartBar, FaGraduationCap,
  FaBook, FaCheck, FaSync, FaLock, FaEye
} from 'react-icons/fa';
import './EstudianteCourseDetail.css';

import API_URL from '../../../../config/api';

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

  const userCareerIds = useMemo(() => {
    if (!user) return [];
    const raw = user.carreras || user.CARRERAS || [];
    return raw
      .map(c => c?.SECUENCIAL || c?.id || c?.ID || c?.sec || c?.secId)
      .filter(Boolean)
      .map(Number);
  }, [user]);

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

  const eventCareerIds = useMemo(() => {
    const raw = courseData?.CARRERAS || courseFromContext?.CARRERAS || [];
    return raw
      .map(c => c?.SECUENCIAL || c?.id || c?.ID || c?.sec || c?.secId)
      .filter(Boolean)
      .map(Number);
  }, [courseData, courseFromContext]);

  const hasCareerRestriction = eventCareerIds.length > 0;
  const esAptoCarrera = !hasCareerRestriction || eventCareerIds.some(id => userCareerIds.includes(id));

  // Obtener datos completos del curso desde la API
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/eventos/${courseId}`);
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
            const inscripcionRes = await fetch(`${API_URL}/api/estudiantes/${user.id}/inscripcion?eventoId=${courseId}`);
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
                    const pagoRes = await fetch(`${API_URL}/api/pagos/inscripcion/${idInscripcion}`);
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

  // Obtener iniciales del docente (con manejo robusto de nulos e int)
  const getDocenteInitials = (docente) => {
    if (!docente || docente === 'Por asignar') return 'ND';
    const docenteStr = String(docente).trim();
    if (docenteStr === '' || docenteStr === 'null' || docenteStr === 'undefined') return 'ND';
    const parts = docenteStr.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return docenteStr.substring(0, 2).toUpperCase();
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
  // Ahora Docente puede ser int (SECUENCIAL) o string (nombre completo). Usar NOMBRE_DOCENTE si existe
  const docente = courseData?.NOMBRE_DOCENTE || courseData?.Docente || course?.meta?.docente || 'Por asignar';
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

      {/* Header del Curso con Imagen de Fondo */}
      <div
        className="course-detail-header"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="header-overlay">
          <div className="course-tags">
            <span className="tag">{tipo}</span>
            <span className="tag">{modalidad}</span>
            {esPagado && <span className="tag tag-paid">Pago</span>}
            {!esPagado && <span className="tag tag-free">Gratis</span>}
            {hasCareerRestriction && (
              <span className={`tag ${esAptoCarrera ? 'apt-tag' : 'not-apt-tag'}`}>
                {esAptoCarrera ? 'Apto para tu carrera' : 'No apto'}
              </span>
            )}
          </div>

          <h1 className="course-detail-title">{title}</h1>
          <p className="course-detail-description">
            {description.length > 200 ? description.substring(0, 200) + '...' : description}
          </p>

          <div className="teacher-info">
            <span className="teacher-initials">{getDocenteInitials(docente)}</span>
            <span className="teacher-name">{docente === 'Por asignar' ? 'Por asignar' : `Ing. ${docente}`}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="course-detail-content">
        <div className="course-summary-stats">
          <div className="stat-item">
            <FaBook className="stat-icon" />
            <span>Total de temas</span>
            <strong>{totalLessons}</strong>
          </div>
          <div className="stat-item">
            <FaClock className="stat-icon" />
            <span>Horas</span>
            <strong>{horas}</strong>
          </div>
          {esPagado && (
            <div className="stat-item">
              <FaMoneyBillWave className="stat-icon" />
              <span>Costo</span>
              <strong>${parseFloat(costo).toFixed(2)}</strong>
            </div>
          )}
          {isInscrito && totalLessons > 0 && (
            <div className="stat-item">
              <FaChartBar className="stat-icon" />
              <span>Progreso</span>
              <strong>{progressPercentage}%</strong>
            </div>
          )}
        </div>

        {/* Botón de inscripción/compra - Solo si NO está inscrito O pago pendiente */}
        {hasCareerRestriction && !esAptoCarrera ? (
          <div className="not-apt-message">
            <div className="not-apt-title">Solo para carreras habilitadas</div>
            <div className="not-apt-text">Este curso no está disponible para tu perfil académico.</div>
          </div>
        ) : (
          <>
            {isPublicRoute ? (
              <Link
                to={`/payment/${courseId}`}
                className="btn btn-primary enrollment-btn"
              >
                {esPagado ? 'Comprar Curso' : 'Inscribirse Gratis'}
              </Link>
            ) : (
              (!isInscrito || (isInscrito && esPagado && !pagoAprobado)) && (
                <Link
                  to={`/payment/${courseId}`}
                  className="btn btn-primary enrollment-btn"
                >
                  {isInscrito && esPagado && !pagoAprobado
                    ? 'Completar Pago'
                    : esPagado
                      ? 'Comprar Curso'
                      : 'Inscribirse Gratis'}
                </Link>
              )
            )}
            {!isPublicRoute && isInscrito && (!esPagado || pagoAprobado) && (
              <div className="enrolled-message">
                <FaCheckCircle /> Ya estás inscrito en este curso
              </div>
            )}
          </>
        )}
      </div>

      {/* Sección de Temas/Lecciones */}
      {totalLessons > 0 && (
        <div className="course-lessons-section">
          <div className="lessons-header">
            <div className="lessons-count-box">
              <span className="lessons-icon"><FaBook /></span>
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
                  {lesson.status === 'completed' && <FaCheck className="status-check" />}
                  {lesson.status === 'in-progress' && <FaSync className="status-progress spinning" />}
                  {lesson.status === 'locked' && <FaLock className="status-lock" />}
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
                  <span className="action-icon"><FaEye /></span>
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
