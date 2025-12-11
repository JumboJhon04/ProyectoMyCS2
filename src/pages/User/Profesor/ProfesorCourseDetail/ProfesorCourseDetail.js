import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBook, FaUsers, FaChartBar, FaPlus, FaTimes, FaFileAlt, FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaClipboardCheck, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './ProfesorCourseDetail.css';
import API_URL from '../../../../config/api';

const ProfesorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Estados de datos
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tareas y Recursos por Módulo
  const [tasksByModule, setTasksByModule] = useState({}); 
  const [resourcesByModule, setResourcesByModule] = useState({});

  // --- ESTADOS PARA MODALES ---
  // 1. Crear Módulo
  const [showModal, setShowModal] = useState(false);
  const [newModuleData, setNewModuleData] = useState({ titulo: '', descripcion: '' });

  // Estados Modal TAREA
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null
  });

  const [creating, setCreating] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  console.log("Datos del curso:", course);
  // --- LÓGICA DE NEGOCIO: TIPOS DE EVENTO ---
  // Si el curso ya cargó, verificamos si es Evaluativo (Curso/Taller) o solo Informativo
  const isEvaluative = course && (course.CODIGOTIPOEVENTO === 'CUR' || course.CODIGOTIPOEVENTO === 'TALL');

  // Estados para Modal de Notificación
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success' o 'error'

  // Estado para modal de visualización de módulo
  const [selectedModuleForView, setSelectedModuleForView] = useState(null);

  // --- CARGA DE DATOS ---
  // --- CARGA DE DATOS CORREGIDA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 ProfesorCourseDetail: Cargando datos del curso ID:', courseId);

      // 1. Obtener datos del evento/curso
      const resEvento = await fetch(`${API_URL}/api/eventos/${courseId}`);
      const dataEvento = await resEvento.json();

      console.log('📦 ProfesorCourseDetail: Respuesta del evento:', dataEvento);

      if (dataEvento.success && dataEvento.data) {
        console.log('✅ ProfesorCourseDetail: Curso cargado:', dataEvento.data.TITULO);
        setCourse(dataEvento.data);
      } else {
        console.error('❌ ProfesorCourseDetail: No se encontraron datos del curso');
      }

      // 2. Módulos
      const resModules = await fetch(`${API_URL}/api/modulos/evento/${courseId}`);
      const dataModules = await resModules.json();

      if (dataModules.success) {
        console.log('✅ ProfesorCourseDetail: Módulos cargados:', dataModules.data.length);
        setModules(dataModules.data);
        
        // 3. Cargar contenido interno de cada módulo
        dataModules.data.forEach(mod => {
            fetchResources(mod.SECUENCIAL); 
            fetchTasks(mod.SECUENCIAL);     
        });
      }
    } catch (error) {
      console.error("❌ ProfesorCourseDetail: Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Cargar Tareas
  const fetchTasks = async (moduloId) => {
    try {
      const res = await fetch(`${API_URL}/api/tareas/modulo/${moduloId}`);
      const data = await res.json();
      if (data.success) {
        setTasksByModule(prev => ({
          ...prev,
          [moduloId]: data.data
        }));
      }
    } catch (error) {
      console.error("Error cargando tareas del módulo " + moduloId, error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // --- HANDLERS DE CREACIÓN ---

  // 1. Crear Módulo
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleData.titulo) return alert("El título es obligatorio");

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/modulos/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId: courseId,
          titulo: newModuleData.titulo,
          descripcion: newModuleData.descripcion
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMessage('Módulo creado exitosamente');
        setNotificationType('success');
        setShowNotification(true);
        setShowModal(false);
        setNewModuleData({ titulo: '', descripcion: '' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
      setNotificationMessage('Error al crear el módulo');
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setCreating(false);
    }
  };

  // 2. Crear Tarea
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('moduloId', selectedModuleId);
    formData.append('titulo', newTaskData.titulo);
    formData.append('descripcion', newTaskData.descripcion);
    formData.append('fechaApertura', newTaskData.fechaApertura);
    formData.append('fechaLimite', newTaskData.fechaLimite);
    formData.append('puntos', newTaskData.puntos);
    if (newTaskData.archivo) {
      formData.append('archivoAdjunto', newTaskData.archivo);
    }

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/tareas/crear`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setNotificationMessage('Tarea creada exitosamente');
        setNotificationType('success');
        setShowNotification(true);
        setShowTaskModal(false);
        fetchTasks(selectedModuleId);
        setNewTaskData({ titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null });
      } else {
        setNotificationMessage('Error: ' + data.message);
        setNotificationType('error');
        setShowNotification(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setNotificationMessage('Error al subir la tarea');
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setCreating(false);
    }
  };

  // 3. Crear Recurso
  const handleCreateResource = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('moduloId', selectedModuleId);
    formData.append('titulo', newResourceData.titulo);
    formData.append('descripcion', newResourceData.descripcion);
    if (newResourceData.archivo) formData.append('archivoRecurso', newResourceData.archivo);

    try {
        setCreating(true);
        const res = await fetch(`${API_URL}/api/recursos/crear`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            alert("Material subido correctamente");
            setShowResourceModal(false);
            fetchResources(selectedModuleId);
            setNewResourceData({ titulo: '', descripcion: '', archivo: null });
        } else { alert("Error: " + data.message); }
    } catch (error) { alert("Error al subir recurso"); } finally { setCreating(false); }
  };


  if (loading) return <div className="loading-state">Cargando contenido...</div>;
  if (!course) return <div className="error-state">No se encontró información del curso.</div>;

  // Mapeo de tipos de evento
  const tipoEventoMap = {
    'CUR': { nombre: 'Curso', color: '#3b82f6' },
    'TALL': { nombre: 'Taller', color: '#8b5cf6' },
    'SEM': { nombre: 'Seminario', color: '#10b981' },
    'CONF': { nombre: 'Conferencia', color: '#f59e0b' }
  };

  const tipoEvento = tipoEventoMap[course.CODIGOTIPOEVENTO] || { nombre: 'Evento', color: '#6b7280' };

  return (
    <div className="professor-course-detail-page">
      {/* HEADER */}
      <div className="course-detail-header-profesor"
        style={{ backgroundImage: `url(${course.URL_IMAGEN || 'https://res.cloudinary.com/dpedmnwrd/image/upload/v1765413406/eventos/rwrbqwirdaghmsjwacpm.webp'})` }}>
        <div className="header-overlay-profesor">
          {/* Tipo de Evento Badge */}
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              backgroundColor: tipoEvento.color,
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {tipoEvento.nombre}
            </span>
          </div>
          <h1 className="course-detail-title-profesor">{course.TITULO}</h1>
          <p style={{ color: '#fff', marginTop: '0.5rem', fontSize: '1.1rem' }}>{course.DESCRIPCION}</p>
        </div>
      </div>

      <div className="course-detail-content-profesor">

        {/* 2a. Resumen de Estadísticas (Total de lecciones / Total de estudiantes) */}
        <div className="course-summary-stats-profesor">
          <div className="stat-item-profesor">
            <FaBook className="stat-icon-profesor" />
            <span>Total de lecciones</span>
            <strong>{course.totalLessons}</strong>
          </div>
          <div className="stat-item-profesor">
            <FaUserGraduate className="stat-icon-profesor" />
            <span>Total de estudiantes</span>
            <strong>{course.totalStudents}</strong>
          </div>
          {/* Se puede agregar más aquí, como progreso total, etc. */}
          <div className="stat-item-profesor">
            <FaChartBar className="stat-icon-profesor" />
            <span>Pruebas Activas</span>
            <strong>2</strong>
          </div>
        </div>

        {/* Título de Sección */}
        <div className="section-title-profesor">
          <FaBook /> Módulos del Curso
        </div>

        {/* LISTA DE MÓDULOS */}
        <div className="course-modules-list-profesor">
          {modules.length === 0 ? <p className="no-modules">No hay módulos definidos.</p> :
            modules.map((module, index) => {
              const taskCount = tasksByModule[module.SECUENCIAL]?.length || 0;
              const isSelected = selectedModuleForView?.SECUENCIAL === module.SECUENCIAL;

              return (
                <div
                  key={module.SECUENCIAL}
                  className={`module-card-profesor ${isSelected ? 'selected' : ''} ${selectedModuleForView && !isSelected ? 'dimmed' : ''}`}
                  onClick={() => setSelectedModuleForView(isSelected ? null : module)}
                  style={{ position: 'relative', zIndex: isSelected ? 10 : selectedModuleForView ? 1 : 2 }}
                >
                  {/* Ícono del módulo */}
                  <div className="module-card-icon">
                    <FaBook />
                  </div>

                  {/* Título del módulo */}
                  <h4 className="module-card-title-centered">{module.TITULO}</h4>

                  {/* Contador de tareas */}
                  <span className="module-task-count-centered">
                    {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
                  </span>
                </div>
              );
            })}
        </div>

        {/* --- OVERLAY OSCURO --- */}
        {selectedModuleForView && (
          <div
            className="dark-overlay"
            onClick={() => setSelectedModuleForView(null)}
          />
        )}

        {/* --- CONTENIDO EXPANDIDO INLINE --- */}
        {selectedModuleForView && (
          <div className="module-expanded-content">
            <div className="expanded-content-header">
              <div className="expanded-header-left">
                <div className="module-modal-icon">
                  <FaBook />
                </div>
                <div>
                  <h2>{selectedModuleForView.TITULO}</h2>
                  {selectedModuleForView.DESCRIPCION && (
                    <p className="module-modal-description">{selectedModuleForView.DESCRIPCION}</p>
                  )}
                </div>
              </div>
              <button
                className="add-task-btn-expanded"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedModuleId(selectedModuleForView.SECUENCIAL);
                  setShowTaskModal(true);
                }}
              >
                <FaPlus /> Agregar Tarea
              </button>
            </div>

            <div className="expanded-content-body">
              <h3 className="tasks-title">
                <FaFileAlt /> Tareas del Módulo ({tasksByModule[selectedModuleForView.SECUENCIAL]?.length || 0})
              </h3>

              {tasksByModule[selectedModuleForView.SECUENCIAL] && tasksByModule[selectedModuleForView.SECUENCIAL].length > 0 ? (
                <div className="tasks-list-modal">
                  {tasksByModule[selectedModuleForView.SECUENCIAL].map(task => (
                    <div key={task.SECUENCIAL} className="task-item-modal">
                      <div className="task-modal-info">
                        <FaFileAlt className="task-modal-icon" />
                        <div>
                          <h4>{task.TITULO}</h4>
                          <p className="task-modal-date">
                            Vence: {task.FECHA_LIMITE ? new Date(task.FECHA_LIMITE).toLocaleDateString() : 'Sin fecha'}
                          </p>
                        </div>
                      </div>
                      <button
                        className="task-modal-action-btn"
                        onClick={() => navigate(`/profesor/grading/${task.SECUENCIAL}`)}
                      >
                        <FaClipboardCheck /> Calificar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-tasks-modal">No hay tareas en este módulo.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: CREAR MÓDULO --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nuevo Módulo</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateModule}>
              <div className="form-group">
                <label>Título</label>
                <input type="text" value={newModuleData.titulo} onChange={(e) => setNewModuleData({ ...newModuleData, titulo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={newModuleData.descripcion} onChange={(e) => setNewModuleData({ ...newModuleData, descripcion: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREAR TAREA --- */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Nueva Tarea</h3>
              <button onClick={() => setShowTaskModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Título</label>
                <input type="text" required onChange={e => setNewTaskData({ ...newTaskData, titulo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Instrucciones</label>
                <textarea rows="3" onChange={e => setNewTaskData({ ...newTaskData, descripcion: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Apertura</label>
                  <input type="datetime-local" required onChange={e => setNewTaskData({ ...newTaskData, fechaApertura: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Límite</label>
                  <input type="datetime-local" required onChange={e => setNewTaskData({ ...newTaskData, fechaLimite: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Puntaje</label>
                <input type="number" defaultValue="10" onChange={e => setNewTaskData({ ...newTaskData, puntos: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Archivo Guía (PDF/Doc/Imagen)</label>
                <input type="file" onChange={e => setNewTaskData({ ...newTaskData, archivo: e.target.files[0] })} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>{creating ? 'Guardando...' : 'Guardar Tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREAR RECURSO (NUEVO) --- */}
      {showResourceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Subir Material de Apoyo</h3>
              <button onClick={() => setShowResourceModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group">
                <label>Título del Material</label>
                <input type="text" placeholder="Ej: Diapositivas Clase 1" onChange={e => setNewResourceData({...newResourceData, titulo: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Descripción (Opcional)</label>
                <textarea rows="2" onChange={e => setNewResourceData({...newResourceData, descripcion: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Archivo (PDF, Imagen, Zip)</label>
                <input type="file" required onChange={e => setNewResourceData({...newResourceData, archivo: e.target.files[0]})} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowResourceModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>{creating ? 'Subiendo...' : 'Subir Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE NOTIFICACIÓN --- */}
      {showNotification && (
        <div className="modal-overlay" onClick={() => setShowNotification(false)}>
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {notificationType === 'success' ? (
                <FaCheckCircle style={{ color: '#10b981' }} />
              ) : (
                <FaExclamationCircle style={{ color: '#ef4444' }} />
              )}
            </div>
            <h3 style={{
              color: notificationType === 'success' ? '#10b981' : '#ef4444',
              marginBottom: '0.5rem',
              fontSize: '1.5rem'
            }}>
              {notificationType === 'success' ? '¡Éxito!' : 'Error'}
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {notificationMessage}
            </p>
            <button
              onClick={() => setShowNotification(false)}
              className="confirm-btn"
              style={{ width: '100%' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* --- FAB (Floating Action Button) para Nuevo Módulo --- */}
      <button
        className="fab-profesor"
        onClick={() => setShowModal(true)}
        title="Crear nuevo módulo"
      >
        <FaPlus />
      </button>

    </div>
  );
};

export default ProfesorCourseDetail;