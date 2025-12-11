import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useCourses } from '../../../../context/CoursesContext';
import { useUser } from '../../../../context/UserContext';
import PublicHeader from '../../../../components/PublicHeader/PublicHeader';
import CourseNavigationTabs from '../../../../components/CourseNavigationTabs/CourseNavigationTabs';
import MaterialTab from '../../../../components/CourseTabs/MaterialTab';
import ParticipantesTab from '../../../../components/CourseTabs/ParticipantesTab';
import CalificacionesTab from '../../../../components/CourseTabs/CalificacionesTab';
import { getEventTheme } from '../../../../config/eventThemes';
import {
  FaClock, FaMoneyBill,
  FaClipboardCheck, FaCheckCircle, FaChartBar,
  FaBook, FaCheck
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
  // const [inscripcionId, setInscripcionId] = useState(null);
  const [activeTab, setActiveTab] = useState('material');
  const [entregas, setEntregas] = useState([]); // Estado para entregas del estudiante
  const [intentos, setIntentos] = useState([]); // Estado para intentos de exámenes

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

  /* const mapEstado = (estado) => {
    const estados = {
      'DISPONIBLE': 'Disponible',
      'CERRADO': 'Cerrado',
      'CANCELADO': 'Cancelado',
      'EN CURSO': 'En Curso',
      'FINALIZADO': 'Finalizado',
      'CREADO': 'Creado'
    };
    return estados[estado] || estado;
  }; */

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
                // setInscripcionId(idInscripcion); // Removed unused state update

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

  // Fetch Modulos y Tareas
  // Fetch Modulos y Tareas
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    const fetchModulesAndTasks = async () => {
      const userId = user?.id || user?.ID || user?.SECUENCIAL || user?.secuencial || user?.usuarioId;
      if (!courseId || !userId) return;

      try {
        setModulesLoading(true);
        // 1. Obtener módulos
        const modRes = await fetch(`${API_URL}/api/modulos/evento/${courseId}`);
        const modJson = await modRes.json();

        if (!modRes.ok) throw new Error(modJson.message || 'Error fetching modules');

        const mods = modJson.data || [];
        console.log('Modules fetched:', mods);

        // 2. Para cada módulo, obtener tareas y recursos
        const modulesWithContent = await Promise.all(mods.map(async (mod) => {
          let tareas = [];
          let recursos = [];

          // Fetch Tareas con status
          try {
            const taskRes = await fetch(`${API_URL}/api/tareas/modulo/${mod.SECUENCIAL}/estudiante/${userId}`);
            const taskJson = await taskRes.json();
            tareas = taskJson.data || [];
          } catch (err) {
            console.warn(`Error cargando tareas para modulo ${mod.SECUENCIAL}`, err);
          }

          // Fetch Recursos
          try {
            // Reutilizamos el endpoint de recursos por módulo
            const resRes = await fetch(`${API_URL}/api/recursos/modulo/${mod.SECUENCIAL}`);
            const resJson = await resRes.json();
            recursos = resJson.data || [];
          } catch (err) {
            console.warn(`Error cargando recursos para modulo ${mod.SECUENCIAL}`, err);
          }

          return { ...mod, tareas, recursos };
        }));

        setModules(modulesWithContent);
      } catch (e) {
        console.error('Error cargando módulos:', e);
      } finally {
        setModulesLoading(false);
      }
    };

    if (courseId && (user?.id || user?.SECUENCIAL)) {
      fetchModulesAndTasks();
    }
  }, [courseId, user]);

  // Cargar entregas del estudiante
  useEffect(() => {
    const fetchEntregas = async () => {
      if (!user?.id || !courseId) return;
      try {
        const response = await fetch(`${API_URL}/api/tareas/estudiante/${user.id}/evento/${courseId}`);
        const data = await response.json();
        if (data.success) {
          setEntregas(data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar entregas:', error);
      }
    };

    // Cargar intentos de exámenes
    const fetchIntentos = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_URL}/api/evaluaciones/intentos/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setIntentos(data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar intentos:', error);
      }
    };

    if (courseId && user?.id) {
      fetchEntregas();
      fetchIntentos();
    }
  }, [courseId, user]);

  // Calcular actividades totales y completadas dinámicamente (después de declarar modules y entregas)
  const totalActivities = useMemo(() => {
    if (!modules || modules.length === 0) return 0;
    let total = 0;
    modules.forEach(modulo => {
      // Contar tareas
      total += modulo.tareas?.length || 0;
    });
    return total;
  }, [modules]);

  const completedActivities = useMemo(() => {
    if (!modules || modules.length === 0) return 0;
    let completed = 0;
    modules.forEach(modulo => {
      // Contar tareas entregadas
      modulo.tareas?.forEach(tarea => {
        const entrega = entregas.find(e => e.tareaId === tarea.SECUENCIAL);
        if (entrega) completed++;
      });
    });
    return completed;
  }, [modules, entregas]);

  // Aplicar tema dinámico con CSS variables
  useEffect(() => {
    if (courseData?.CODIGOTIPOEVENTO) {
      const eventTheme = getEventTheme(courseData.CODIGOTIPOEVENTO);
      if (eventTheme) {
        document.documentElement.style.setProperty('--event-primary-color', eventTheme.primaryColor);
        document.documentElement.style.setProperty('--event-secondary-color', eventTheme.secondaryColor);
        document.documentElement.style.setProperty('--event-accent-color', eventTheme.accentColor);
        document.documentElement.style.setProperty('--event-light-bg', eventTheme.lightBg);
      }
    }
  }, [courseData]);

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

  // Formatear fecha (Removed unused formatDate function)

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
  // const capacidad = courseData?.CAPACIDAD || course?.meta?.capacity || 'No especificada';
  // const notaAprobacion = courseData?.NOTAAPROBACION || course?.meta?.passingGrade;
  // const asistenciaMinima = courseData?.ASISTENCIAMINIMA || course?.meta?.attendanceRequired;
  // const fechaInicio = courseData?.FECHAINICIO || course?.meta?.startDate;
  // const fechaFin = courseData?.FECHAFIN || course?.meta?.endDate;
  // const estado = mapEstado(courseData?.ESTADO || 'DISPONIBLE');
  const esPagado = courseData?.ES_PAGADO === 1 || course?.meta?.isPaid;
  // const carreras = courseData?.CARRERAS || [];
  const topics = parseTopics(courseData?.CONTENIDO || '');

  // Obtener tema del evento
  const eventTheme = getEventTheme(courseData?.CODIGOTIPOEVENTO || 'CUR');
  const showGrades = eventTheme.showGrades;

  const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

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
          {/* Layout de dos columnas */}
          <div className="header-content-grid">
            {/* Columna izquierda: Tags, Título y Docente */}
            <div className="header-left">
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

              <div className="teacher-info">
                <span className="teacher-initials">{getDocenteInitials(docente)}</span>
                <span className="teacher-name">{docente === 'Por asignar' ? 'Por asignar' : `Ing. ${docente}`}</span>
              </div>
            </div>

            {/* Columna derecha: Descripción */}
            <div className="header-right">
              <p className="course-detail-description">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="course-detail-content">
        <div className="course-summary-stats">
          <div className="stat-item">
            <FaBook className="stat-icon" />
            <span>Total de actividades</span>
            <strong>{totalActivities}</strong>
          </div>
          <div className="stat-item">
            <FaClock className="stat-icon" />
            <span>Horas</span>
            <strong>{horas}</strong>
          </div>
          {esPagado && (
            <div className="stat-item">
              <FaMoneyBill className="stat-icon" />
              <span>Costo</span>
              <strong>${parseFloat(costo).toFixed(2)}</strong>
            </div>
          )}
          {isInscrito && totalActivities > 0 && (
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
            {/* Mensaje de inscripción eliminado - el estudiante inscrito simplemente accede al material */}
            {false && !isPublicRoute && isInscrito && (!esPagado || pagoAprobado) && (
              <div className="enrolled-message">
                <FaCheckCircle /> Ya estás inscrito en este curso
              </div>
            )}
          </>
        )}
      </div>

      {/* Navegación por Tabs - Solo visible para estudiantes inscritos */}
      {!isPublicRoute && isInscrito && pagoAprobado && (
        <>
          <CourseNavigationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            eventType={courseData?.CODIGOTIPOEVENTO || 'CUR'}
            showGrades={showGrades}
          />

          {/* Contenido de los Tabs */}
          <div className="tab-content-container">
            {activeTab === 'material' && (
              <MaterialTab
                topics={topics}
                modules={modules} // Pasamos los módulos reales
                loading={modulesLoading}
                eventType={courseData?.CODIGOTIPOEVENTO || 'CUR'}
                courseData={courseData}
              />
            )}
            {activeTab === 'participantes' && (
              <ParticipantesTab
                courseData={courseData}
                eventType={courseData?.CODIGOTIPOEVENTO || 'CUR'}
              />
            )}
            {activeTab === 'calificaciones' && showGrades && (
              <CalificacionesTab
                courseData={courseData}
                eventType={courseData?.CODIGOTIPOEVENTO || 'CUR'}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EstudianteCourseDetail;
