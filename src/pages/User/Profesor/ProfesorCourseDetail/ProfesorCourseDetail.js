import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaBook, FaUsers, FaChartBar, FaPlus, FaTimes, FaFileAlt,
  FaUserGraduate, FaCheckCircle, FaExclamationCircle,
  FaClipboardCheck, FaFilePdf, FaFileUpload, FaEdit
} from 'react-icons/fa';
import './ProfesorCourseDetail.css';
import API_URL from '../../../../config/api';

const ProfesorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DE DATOS ---
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tareas y Recursos por Módulo
  const [tasksByModule, setTasksByModule] = useState({});
  const [resourcesByModule, setResourcesByModule] = useState({});

  // --- ESTADOS PARA MODALES ---
  const [showModal, setShowModal] = useState(false);
  const [newModuleData, setNewModuleData] = useState({ titulo: '', descripcion: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null
  });

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResourceData, setNewResourceData] = useState({ titulo: '', descripcion: '', archivo: null });

  // Estados de control UI
  const [creating, setCreating] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModuleForView, setSelectedModuleForView] = useState(null); // Para el overlay del módulo

  // Estados para Notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // --- LÓGICA DE NEGOCIO: TIPOS DE EVENTO ---
  const isEvaluative = course && (course.CODIGOTIPOEVENTO === 'CUR' || course.CODIGOTIPOEVENTO === 'TALL');

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener datos del evento/curso
      const resEvento = await fetch(`${API_URL}/api/eventos/${courseId}`);
      const dataEvento = await resEvento.json();

      if (dataEvento.success && dataEvento.data) {
        // Manejo robusto si devuelve array o objeto
        const cursoData = Array.isArray(dataEvento.data) ? dataEvento.data[0] : dataEvento.data;
        setCourse(cursoData);
      }

      // 2. Módulos
      const resModules = await fetch(`${API_URL}/api/modulos/evento/${courseId}`);
      const dataModules = await resModules.json();

      if (dataModules.success) {
        setModules(dataModules.data);

        // 3. Cargar contenido interno de cada módulo
        dataModules.data.forEach(mod => {
          fetchResources(mod.SECUENCIAL);
          fetchTasks(mod.SECUENCIAL);
        });
      }
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
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
        setTasksByModule(prev => ({ ...prev, [moduloId]: data.data }));
      }
    } catch (error) { console.error(error); }
  };

  // Helper: Cargar Recursos
  const fetchResources = async (moduloId) => {
    try {
      const res = await fetch(`${API_URL}/api/recursos/modulo/${moduloId}`);
      const data = await res.json();
      if (data.success) {
        setResourcesByModule(prev => ({ ...prev, [moduloId]: data.data }));
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // --- HANDLERS (CREAR) ---

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
        triggerNotification('Módulo creado exitosamente', 'success');
        setShowModal(false);
        setNewModuleData({ titulo: '', descripcion: '' });
        fetchData();
      }
    } catch (error) {
      triggerNotification('Error al crear módulo', 'error');
    } finally { setCreating(false); }
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
    if (newTaskData.archivo) formData.append('archivoAdjunto', newTaskData.archivo);

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/tareas/crear`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        triggerNotification('Tarea creada exitosamente', 'success');
        setShowTaskModal(false);
        fetchTasks(selectedModuleId);
        setNewTaskData({ titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null });
      } else {
        triggerNotification('Error: ' + data.message, 'error');
      }
    } catch (error) {
      triggerNotification('Error al subir la tarea', 'error');
    } finally { setCreating(false); }
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
        triggerNotification("Material subido correctamente", 'success');
        setShowResourceModal(false);
        fetchResources(selectedModuleId);
        setNewResourceData({ titulo: '', descripcion: '', archivo: null });
      } else { triggerNotification("Error: " + data.message, 'error'); }
    } catch (error) { triggerNotification("Error al subir recurso", 'error'); } finally { setCreating(false); }
  };

  const triggerNotification = (msg, type) => {
    setNotificationMessage(msg);
    setNotificationType(type);
    setShowNotification(true);
  };


  if (loading) return <div className="loading-state">Cargando contenido...</div>;
  if (!course) return <div className="error-state">No se encontró información del curso.</div>;

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
        style={{ backgroundImage: `url(${course.URL_IMAGEN || 'https://via.placeholder.com/1200x300'})` }}>
        <div className="header-overlay-profesor">
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ backgroundColor: tipoEvento.color, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>
              {tipoEvento.nombre}
            </span>
          </div>
          <h1 className="course-detail-title-profesor">{course.TITULO}</h1>
          <p style={{ color: '#fff', marginTop: '0.5rem' }}>{course.DESCRIPCION}</p>
        </div>
      </div>

      <div className="course-detail-content-profesor">

        {/* Estadísticas */}
        <div className="course-summary-stats-profesor">
          <div className="stat-item-profesor">
            <FaBook className="stat-icon-profesor" />
            <span>Lecciones</span>
            <strong>{course.HORAS || 0}</strong>
          </div>
          <div className="stat-item-profesor">
            <FaUserGraduate className="stat-icon-profesor" />
            <span>Capacidad</span>
            <strong>{course.CAPACIDAD || 0}</strong>
          </div>
        </div>

        <div className="section-title-profesor">
          <FaBook /> Módulos del Curso
        </div>

        {/* LISTA DE MÓDULOS (TARJETAS) */}
        <div className="course-modules-list-profesor">
          {modules.length === 0 ? <p className="no-modules">No hay módulos definidos.</p> :
            modules.map((module) => {
              const taskCount = tasksByModule[module.SECUENCIAL]?.length || 0;
              const resourceCount = resourcesByModule[module.SECUENCIAL]?.length || 0;
              const isSelected = selectedModuleForView?.SECUENCIAL === module.SECUENCIAL;

              return (
                <div
                  key={module.SECUENCIAL}
                  className={`module-card-profesor ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedModuleForView(isSelected ? null : module)}
                >
                  <div className="module-card-icon"><FaBook /></div>
                  <h4 className="module-card-title-centered">{module.TITULO}</h4>
                  <span className="module-task-count-centered">
                    {resourceCount} Materiales • {isEvaluative ? `${taskCount} Tareas` : 'Informativo'}
                  </span>
                </div>
              );
            })}
        </div>

        {/* --- OVERLAY DETALLE MÓDULO --- */}
        {selectedModuleForView && (
          <div className="dark-overlay" onClick={() => setSelectedModuleForView(null)} />
        )}

        {selectedModuleForView && (
          <div className="module-expanded-content">
            {/* CABECERA DEL MÓDULO EXPANDIDO */}
            <div className="expanded-content-header">
              <div className="expanded-header-left">
                <div className="module-modal-icon"><FaBook /></div>
                <div>
                  <h2>{selectedModuleForView.TITULO}</h2>
                  <p className="module-modal-description">{selectedModuleForView.DESCRIPCION}</p>
                </div>
              </div>

              {/* ACCIONES DEL MÓDULO */}
              <div className="expanded-actions" style={{ display: 'flex', gap: '10px' }}>
                {/* 1. Botón MATERIAL (Siempre visible) */}
                <button
                  className="add-task-btn-expanded"
                  style={{ backgroundColor: '#17a2b8' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModuleId(selectedModuleForView.SECUENCIAL);
                    setShowResourceModal(true);
                  }}
                >
                  <FaFileUpload /> Subir Material
                </button>

                {/* 2. Botón TAREA (Solo si es Evaluativo) */}
                {isEvaluative && (
                  <button
                    className="add-task-btn-expanded"
                    style={{ backgroundColor: '#28a745' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModuleId(selectedModuleForView.SECUENCIAL);
                      setShowTaskModal(true);
                    }}
                  >
                    <FaPlus /> Agregar Tarea
                  </button>
                )}
              </div>
            </div>

            <div className="expanded-content-body">

              {/* A. SECCIÓN DE MATERIALES (RECURSOS) */}
              <h3 className="tasks-title" style={{ color: '#17a2b8', marginTop: '0' }}>
                <FaFilePdf /> Material de Apoyo ({resourcesByModule[selectedModuleForView.SECUENCIAL]?.length || 0})
              </h3>

              {resourcesByModule[selectedModuleForView.SECUENCIAL] && resourcesByModule[selectedModuleForView.SECUENCIAL].length > 0 ? (
                <div className="tasks-list-modal">
                  {resourcesByModule[selectedModuleForView.SECUENCIAL].map(res => (
                    <div key={res.SECUENCIAL} className="task-item-modal" style={{ borderLeft: '4px solid #17a2b8' }}>
                      <div className="task-modal-info">
                        <FaFilePdf className="task-modal-icon" style={{ color: '#17a2b8' }} />
                        <div>
                          <h4>{res.TITULO}</h4>
                          <p className="task-modal-date">{res.DESCRIPCION || 'Documento informativo'}</p>
                        </div>
                      </div>
                      <a href={res.URL_RECURSO} target="_blank" rel="noreferrer" className="task-modal-action-btn" style={{ textDecoration: 'none', background: '#e0f7fa', color: '#006064' }}>
                        Ver Archivo
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-tasks-modal">No hay material subido en este módulo.</p>
              )}


              {/* B. SECCIÓN DE TAREAS (Solo Evaluativo) */}
              {isEvaluative && (
                <>
                  <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
                  <h3 className="tasks-title">
                    <FaFileAlt /> Tareas Asignadas ({tasksByModule[selectedModuleForView.SECUENCIAL]?.length || 0})
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALES --- */}

      {/* 1. CREAR MÓDULO */}
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

      {/* 2. CREAR TAREA */}
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
                <label>Archivo Guía (Opcional)</label>
                <input
                  type="file"
                  onChange={e => setNewTaskData({ ...newTaskData, archivo: e.target.files[0] })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'block'
                  }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.png"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CREAR RECURSO */}
      {showResourceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Subir Material de Apoyo</h3>
              <button onClick={() => setShowResourceModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group">
                <label>Título</label>
                <input type="text" placeholder="Ej: Diapositivas 1" onChange={e => setNewResourceData({ ...newResourceData, titulo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="2" onChange={e => setNewResourceData({ ...newResourceData, descripcion: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Archivo</label>
                <input
                  type="file"
                  required
                  onChange={e => setNewResourceData({ ...newResourceData, archivo: e.target.files[0] })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'block'
                  }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.png,.txt"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowResourceModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>Subir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN */}
      {showNotification && (
        <div className="modal-overlay" onClick={() => setShowNotification(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {notificationType === 'success' ? <FaCheckCircle color="#10b981" /> : <FaExclamationCircle color="#ef4444" />}
            </div>
            <h3>{notificationType === 'success' ? '¡Éxito!' : 'Error'}</h3>
            <p>{notificationMessage}</p>
            <button onClick={() => setShowNotification(false)} className="confirm-btn" style={{ width: '100%', marginTop: '1rem' }}>Aceptar</button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="fab-profesor" onClick={() => setShowModal(true)}><FaPlus /></button>

    </div>
  );
};

export default ProfesorCourseDetail;