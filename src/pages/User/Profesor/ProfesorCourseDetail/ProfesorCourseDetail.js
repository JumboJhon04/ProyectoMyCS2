import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaBook, FaUsers, FaChartBar, FaPlus, FaTimes, FaFileAlt,
  FaUserGraduate, FaCheckCircle, FaExclamationCircle,
  FaClipboardCheck, FaFilePdf, FaFileUpload, FaEdit, FaClipboardList, FaClock
} from 'react-icons/fa';
import FilePreview from '../../../../components/FilePreview/FilePreview';
import './ProfesorCourseDetail.css';
import API_URL from '../../../../config/api';

const ProfesorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DE DATOS ---
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tareas, Recursos y EXÁMENES por Módulo
  const [tasksByModule, setTasksByModule] = useState({});
  const [resourcesByModule, setResourcesByModule] = useState({});
  const [examsByModule, setExamsByModule] = useState({}); // <--- NUEVO ESTADO

  // --- ESTADOS PARA MODALES ---
  const [showModal, setShowModal] = useState(false);
  const [newModuleData, setNewModuleData] = useState({ titulo: '', descripcion: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null
  });

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResourceData, setNewResourceData] = useState({ titulo: '', descripcion: '', archivo: null });

  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamData, setNewExamData] = useState({
    titulo: '', duracion: 60, fechaInicio: '', fechaFin: ''
  });

  // Estados de control UI
  const [creating, setCreating] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModuleForView, setSelectedModuleForView] = useState(null);

  // Estados para Notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Estados para Preview de Archivos
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState({ url: '', name: '' });

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
          fetchExams(mod.SECUENCIAL); // <--- NUEVO: Cargar exámenes
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

  // Helper: Cargar Exámenes (NUEVO)
  const fetchExams = async (moduloId) => {
    try {
      const res = await fetch(`${API_URL}/api/evaluaciones/modulo/${moduloId}`);
      const data = await res.json();
      if (data.success) {
        setExamsByModule(prev => ({ ...prev, [moduloId]: data.data }));
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // --- HANDLERS (CREAR) ---

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleData.titulo) return alert("El título es obligatorio");
    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/modulos/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId: courseId, ...newModuleData })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Módulo creado exitosamente', 'success');
        setShowModal(false);
        setNewModuleData({ titulo: '', descripcion: '' });
        fetchData();
      }
    } catch (error) { triggerNotification('Error al crear módulo', 'error'); } finally { setCreating(false); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('moduloId', selectedModuleId);
    // ... agregar campos al formData ...
    for (const key in newTaskData) {
      if (key === 'archivo') {
        if (newTaskData.archivo) formData.append('archivoAdjunto', newTaskData.archivo);
      } else {
        formData.append(key, newTaskData[key]);
      }
    }

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/tareas/crear`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Tarea creada exitosamente', 'success');
        setShowTaskModal(false);
        fetchTasks(selectedModuleId);
        setNewTaskData({ titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null });
      } else { triggerNotification('Error: ' + data.message, 'error'); }
    } catch (error) { triggerNotification('Error al subir la tarea', 'error'); } finally { setCreating(false); }
  };

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

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/evaluaciones/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloId: selectedModuleId, ...newExamData })
      });
      const data = await res.json();
      if (data.success) {
        alert("Evaluación creada. Redirigiendo al editor...");
        setShowExamModal(false);
        fetchExams(selectedModuleId); // Actualizar lista por si regresa
        // Redirigir al editor de preguntas
        navigate(`/profesor/exam-editor/${data.id}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) { console.error(error); } finally { setCreating(false); }
  };

  const triggerNotification = (msg, type) => {
    setNotificationMessage(msg);
    setNotificationType(type);
    setShowNotification(true);
  };

  const handleOpenPreview = (url, name) => {
    setPreviewFile({ url, name });
    setShowPreview(true);
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

        {/* LISTA DE MÓDULOS (TARJETAS) - Siempre en el grid */}
        <div className="course-modules-list-profesor">
          {modules.length === 0 ? <p className="no-modules">No hay módulos definidos.</p> :
            modules.map((module, index) => {
              const taskCount = tasksByModule[module.SECUENCIAL]?.length || 0;
              const resourceCount = resourcesByModule[module.SECUENCIAL]?.length || 0;
              const examCount = examsByModule[module.SECUENCIAL]?.length || 0; // Contar exámenes
              const isSelected = selectedModuleForView?.SECUENCIAL === module.SECUENCIAL;

              return (
                <div
                  key={module.SECUENCIAL}
                  className={`module-card-profesor ${isSelected ? 'selected' : ''} ${selectedModuleForView && !isSelected ? 'dimmed' : ''}`}
                  onClick={() => setSelectedModuleForView(isSelected ? null : module)}
                  style={{ position: 'relative', zIndex: isSelected ? 10 : selectedModuleForView ? 6 : 2 }}
                >
                  <div className="module-card-icon"><FaBook /></div>
                  <h4 className="module-card-title-centered">{module.TITULO}</h4>
                  <span className="module-task-count-centered">
                    {resourceCount} Mat. • {isEvaluative ? `${taskCount} Tareas • ${examCount} Tests` : 'Informativo'}
                  </span>
                </div>
              );
            })}
        </div>

        {/* OVERLAY OSCURO */}
        {selectedModuleForView && (
          <div
            className="dark-overlay"
            onClick={() => setSelectedModuleForView(null)}
          />
        )}

        {/* CONTENIDO EXPANDIDO - Aparece DESPUÉS del grid completo */}
        {selectedModuleForView && (
          <div className="module-expanded-content-below-grid">
            {/* CABECERA DEL MÓDULO EXPANDIDO */}
            <div className="expanded-content-header">
              <div className="expanded-header-left">
                <div className="module-modal-icon"><FaBook /></div>
                <div>
                  <h2>{selectedModuleForView.TITULO}</h2>
                  <p className="module-modal-description">{selectedModuleForView.DESCRIPCION}</p>
                </div>
              </div>

              <div className="expanded-actions" style={{ display: 'flex', gap: '10px' }}>
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

                {isEvaluative && (
                  <>
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
                    <button
                      className="add-task-btn-expanded"
                      style={{ backgroundColor: '#ffc107', color: '#000' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleId(selectedModuleForView.SECUENCIAL);
                        setShowExamModal(true);
                      }}
                    >
                      <FaClipboardList /> Crear Prueba
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="expanded-content-body">
              {/* A. MATERIALES */}
              <h3 className="tasks-title" style={{ color: '#17a2b8', marginTop: '0' }}>
                <FaFilePdf /> Material de Apoyo ({resourcesByModule[selectedModuleForView.SECUENCIAL]?.length || 0})
              </h3>
              {resourcesByModule[selectedModuleForView.SECUENCIAL]?.length > 0 ? (
                <div className="tasks-list-modal">
                  {resourcesByModule[selectedModuleForView.SECUENCIAL].map(res => (
                    <div key={res.SECUENCIAL} className="task-item-modal" style={{ borderLeft: '4px solid #17a2b8' }}>
                      <div className="task-modal-info">
                        <FaFilePdf className="task-modal-icon" style={{ color: '#17a2b8' }} />
                        <div>
                          <h4>{res.TITULO}</h4>
                          <p className="task-modal-date">{res.DESCRIPCION}</p>
                        </div>
                      </div>
                      <button onClick={() => handleOpenPreview(res.URL_RECURSO, res.TITULO)} className="task-modal-action-btn" style={{ background: '#e0f7fa', color: '#006064', border: 'none' }}>Ver</button>
                    </div>
                  ))}
                </div>
              ) : <p className="no-tasks-modal">No hay material.</p>}

              {isEvaluative && (
                <>
                  <hr style={{ margin: '20px 0', borderTop: '1px solid #eee' }} />

                  {/* B. TAREAS */}
                  <h3 className="tasks-title"><FaFileAlt /> Tareas ({tasksByModule[selectedModuleForView.SECUENCIAL]?.length || 0})</h3>
                  {tasksByModule[selectedModuleForView.SECUENCIAL]?.length > 0 ? (
                    <div className="tasks-list-modal">
                      {tasksByModule[selectedModuleForView.SECUENCIAL].map(task => (
                        <div key={task.SECUENCIAL} className="task-item-modal">
                          <div className="task-modal-info">
                            <FaFileAlt className="task-modal-icon" />
                            <div>
                              <h4>{task.TITULO}</h4>
                              <p className="task-modal-date">Vence: {new Date(task.FECHA_LIMITE).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button className="task-modal-action-btn" onClick={() => navigate(`/profesor/grading/${task.SECUENCIAL}`)}><FaClipboardCheck /> Calificar</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="no-tasks-modal">No hay tareas.</p>}

                  <hr style={{ margin: '20px 0', borderTop: '1px solid #eee' }} />

                  {/* C. EVALUACIONES (NUEVO) */}
                  <h3 className="tasks-title" style={{ color: '#d97706' }}>
                    <FaClipboardList /> Exámenes ({examsByModule[selectedModuleForView.SECUENCIAL]?.length || 0})
                  </h3>
                  {examsByModule[selectedModuleForView.SECUENCIAL]?.length > 0 ? (
                    <div className="tasks-list-modal">
                      {examsByModule[selectedModuleForView.SECUENCIAL].map(exam => (
                        <div key={exam.SECUENCIAL} className="task-item-modal" style={{ borderLeft: '4px solid #d97706' }}>
                          <div className="task-modal-info">
                            <FaClipboardList className="task-modal-icon" style={{ color: '#d97706' }} />
                            <div>
                              <h4>{exam.TITULO}</h4>
                              <p className="task-modal-date">
                                <FaClock style={{ marginRight: '5px' }} />
                                {exam.DURACION_MINUTOS} mins • Inicio: {new Date(exam.FECHA_INICIO).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            className="task-modal-action-btn"
                            style={{ background: '#fef3c7', color: '#92400e' }}
                            onClick={() => navigate(`/profesor/exam-editor/${exam.SECUENCIAL}`)}
                          >
                            <FaEdit /> Editar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="no-tasks-modal">No hay exámenes creados.</p>}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALES --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nuevo Módulo</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateModule}>
              <div className="form-group"><label>Título</label><input type="text" value={newModuleData.titulo} onChange={(e) => setNewModuleData({ ...newModuleData, titulo: e.target.value })} required /></div>
              <div className="form-group"><label>Descripción</label><textarea value={newModuleData.descripcion} onChange={(e) => setNewModuleData({ ...newModuleData, descripcion: e.target.value })} /></div>
              <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancelar</button><button type="submit" className="confirm-btn" disabled={creating}>Crear</button></div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header"><h3>Nueva Tarea</h3><button onClick={() => setShowTaskModal(false)} className="close-modal-btn"><FaTimes /></button></div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group"><label>Título</label><input type="text" required onChange={e => setNewTaskData({ ...newTaskData, titulo: e.target.value })} /></div>
              <div className="form-group"><label>Instrucciones</label><textarea rows="3" onChange={e => setNewTaskData({ ...newTaskData, descripcion: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Apertura</label><input type="datetime-local" required onChange={e => setNewTaskData({ ...newTaskData, fechaApertura: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Límite</label><input type="datetime-local" required onChange={e => setNewTaskData({ ...newTaskData, fechaLimite: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Puntaje</label><input type="number" defaultValue="10" onChange={e => setNewTaskData({ ...newTaskData, puntos: e.target.value })} /></div>
              <div className="form-group"><label>Archivo Guía</label><input type="file" onChange={e => setNewTaskData({ ...newTaskData, archivo: e.target.files[0] })} /></div>
              <div className="modal-actions"><button type="button" onClick={() => setShowTaskModal(false)} className="cancel-btn">Cancelar</button><button type="submit" className="confirm-btn" disabled={creating}>Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Subir Material</h3><button onClick={() => setShowResourceModal(false)} className="close-modal-btn"><FaTimes /></button></div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group"><label>Título</label><input type="text" required onChange={e => setNewResourceData({ ...newResourceData, titulo: e.target.value })} /></div>
              <div className="form-group"><label>Descripción</label><textarea rows="2" onChange={e => setNewResourceData({ ...newResourceData, descripcion: e.target.value })} /></div>
              <div className="form-group"><label>Archivo</label><input type="file" required onChange={e => setNewResourceData({ ...newResourceData, archivo: e.target.files[0] })} /></div>
              <div className="modal-actions"><button type="button" onClick={() => setShowResourceModal(false)} className="cancel-btn">Cancelar</button><button type="submit" className="confirm-btn" disabled={creating}>Subir</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR EXAMEN (YA IMPLEMENTADO) */}
      {showExamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Nueva Evaluación</h3><button onClick={() => setShowExamModal(false)} className="close-modal-btn"><FaTimes /></button></div>
            <form onSubmit={handleCreateExam}>
              <div className="form-group"><label>Título</label><input type="text" required onChange={e => setNewExamData({ ...newExamData, titulo: e.target.value })} /></div>
              <div className="form-group"><label>Duración (mins)</label><input type="number" defaultValue="60" onChange={e => setNewExamData({ ...newExamData, duracion: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Inicio</label><input type="datetime-local" required onChange={e => setNewExamData({ ...newExamData, fechaInicio: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Fin</label><input type="datetime-local" required onChange={e => setNewExamData({ ...newExamData, fechaFin: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowExamModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN & PREVIEW */}
      {showNotification && (
        <div className="modal-overlay" onClick={() => setShowNotification(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{notificationType === 'success' ? <FaCheckCircle color="#10b981" /> : <FaExclamationCircle color="#ef4444" />}</div>
            <h3>{notificationType === 'success' ? '¡Éxito!' : 'Error'}</h3>
            <p>{notificationMessage}</p>
            <button onClick={() => setShowNotification(false)} className="confirm-btn" style={{ width: '100%', marginTop: '1rem' }}>Aceptar</button>
          </div>
        </div>
      )}
      {showPreview && <FilePreview fileUrl={previewFile.url} fileName={previewFile.name} onClose={() => setShowPreview(false)} />}

      <button className="fab-profesor" onClick={() => setShowModal(true)}><FaPlus /></button>
    </div>
  );
};

export default ProfesorCourseDetail;