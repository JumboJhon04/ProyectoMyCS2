import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaBook, FaUsers, FaChartBar, FaPlus, FaTimes, FaFileAlt,
  FaFilePdf, FaEdit, FaClipboardList, FaFileUpload, FaCheckCircle, FaExclamationCircle, FaUserGraduate, FaChevronDown, FaChevronRight
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
  // 1. Crear Módulo
  const [showModal, setShowModal] = useState(false);
  const [newModuleData, setNewModuleData] = useState({ titulo: '', descripcion: '' });

  // 2. Crear Tarea
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null
  });

  // 3. Crear Recurso (Material)
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResourceData, setNewResourceData] = useState({ titulo: '', descripcion: '', archivo: null });

  // Estado general de "Cargando/Guardando" para botones
  const [creating, setCreating] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Estados para Modal de Notificación (RESTAURADOS)
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success' o 'error'

  console.log("Datos del curso:", course);
  // --- LÓGICA DE NEGOCIO: TIPOS DE EVENTO ---
  // Si el curso ya cargó, verificamos si es Evaluativo (Curso/Taller) o solo Informativo
  const isEvaluative = course && (course.CODIGOTIPOEVENTO === 'CUR' || course.CODIGOTIPOEVENTO === 'TALL');

  // --- CARGA DE DATOS ---
  // --- CARGA DE DATOS CORREGIDA ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener Info del Curso
      // Nota: Usamos el endpoint que devuelve { success: true, data: ... }
      const resCourse = await fetch(`${API_URL}/api/eventos/${courseId}`);
      const dataCourse = await resCourse.json();

      // --- CORRECCIÓN AQUÍ ---
      if (dataCourse.success && dataCourse.data) {
        // Si 'data' es un array (ej: [{id:1...}]), tomamos el primero [0]
        // Si 'data' es un objeto directo (ej: {id:1...}), lo tomamos directo
        const cursoReal = Array.isArray(dataCourse.data) ? dataCourse.data[0] : dataCourse.data;

        setCourse(cursoReal);
        console.log("✅ Curso cargado correctamente:", cursoReal); // Para verificar en consola
      } else {
        // Fallback por si la estructura es diferente
        setCourse(dataCourse[0] || dataCourse);
      }

      // 2. Obtener Módulos
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
    if (newTaskData.archivo) formData.append('archivoAdjunto', newTaskData.archivo);

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/tareas/crear`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        alert("Tarea creada exitosamente");
        setShowTaskModal(false);
        fetchTasks(selectedModuleId);
        setNewTaskData({ titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null });
      } else { alert("Error: " + data.message); }
    } catch (error) { alert("Error al subir la tarea"); } finally { setCreating(false); }
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
          <h1 className="course-detail-title-profesor">{course.TITULO}</h1>
          <p style={{ color: '#fff' }}>{course.DESCRIPCION}</p>
          {/* Etiqueta de Tipo de Evento */}
          <span className="tag-profesor" style={{ marginTop: '10px', background: isEvaluative ? '#28a745' : '#17a2b8' }}>
            {isEvaluative ? 'Curso Evaluativo' : 'Evento Informativo'}
          </span>
        </div>
      </div>

      <div className="course-detail-content-profesor">

        {/* BARRA DE ACCIONES PRINCIPAL */}
        <div className="course-tabs-profesor">
          <button className="tab-button-profesor active"><FaBook /> Contenido</button>
          <button className="tab-button-profesor create-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Nuevo Módulo
          </button>
        </div>

        {/* LISTA DE MÓDULOS */}
        <div className="course-modules-list-profesor">
          {modules.length === 0 ? <p className="no-modules">No hay módulos definidos. Crea el primero.</p> :
            modules.map((module) => (
              <div key={module.SECUENCIAL} className="lesson-item-profesor" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>

                {/* CABECERA DEL MÓDULO + BOTONES */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ maxWidth: '60%' }}>
                    <h4 className="lesson-title-profesor">{module.TITULO}</h4>
                    <p className="lesson-description-profesor">{module.DESCRIPCION}</p>
                  </div>

                  {/* BOTONES DE ACCIÓN POR MÓDULO */}
                  <div style={{ display: 'flex', gap: '5px' }}>

                    {/* Botón TAREA (Solo si es Evaluativo) */}
                    {isEvaluative && (
                      <button
                        className="action-btn-profesor secondary"
                        style={{ backgroundColor: '#28a745', color: 'white' }}
                        onClick={() => { setSelectedModuleId(module.SECUENCIAL); setShowTaskModal(true); }}
                      >
                        <FaEdit /> Tarea
                      </button>
                    )}

                    {/* Botón PRUEBA (Solo si es Evaluativo - Placeholder) */}
                    {isEvaluative && (
                      <button
                        className="action-btn-profesor secondary"
                        style={{ backgroundColor: '#ffc107', color: '#000' }}
                        onClick={() => alert("Próximamente: Crear Examen")}
                      >
                        <FaClipboardList /> Prueba
                      </button>
                    )}

                    {/* Botón MATERIAL (Siempre visible) */}
                    <button
                      className="action-btn-profesor secondary"
                      style={{ backgroundColor: '#17a2b8', color: 'white' }}
                      onClick={() => { setSelectedModuleId(module.SECUENCIAL); setShowResourceModal(true); }}
                    >
                      <FaFileUpload /> Material
                    </button>
                  </div>
                </div>

                {/* A. LISTA DE RECURSOS (Material de Apoyo) */}
                <div className="resources-container" style={{ width: '100%', marginBottom: '10px' }}>
                  {resourcesByModule[module.SECUENCIAL]?.map(res => (
                    <div key={res.SECUENCIAL} style={{
                      padding: '10px',
                      borderLeft: '4px solid #17a2b8',
                      marginBottom: '8px',
                      background: '#f0faff',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FaFilePdf style={{ marginRight: '10px', color: '#17a2b8', fontSize: '1.2rem' }} />
                      <div>
                        <a href={res.URL_RECURSO} target="_blank" rel="noreferrer" style={{ color: '#0056b3', fontWeight: 'bold', textDecoration: 'none' }}>
                          {res.TITULO}
                        </a>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{res.DESCRIPCION || 'Material de lectura'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* B. LISTA DE TAREAS (Solo si es evaluativo) */}
                {isEvaluative && (
                  <div className="tasks-container" style={{ width: '100%', paddingLeft: '15px', borderLeft: '3px solid #eee' }}>
                    {tasksByModule[module.SECUENCIAL]?.map(task => (
                      <div key={task.SECUENCIAL} style={{
                        background: '#fff',
                        border: '1px solid #eee',
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FaFileAlt color="#555" size={20} />
                          <div>
                            <strong style={{ color: '#333' }}>{task.TITULO}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#777' }}>
                              Vence: {task.FECHA_LIMITE ? new Date(task.FECHA_LIMITE).toLocaleDateString() : 'Sin fecha'}
                            </div>
                          </div>
                        </div>
                        <button
                          className="action-btn-profesor"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          onClick={() => navigate(`/profesor/grading/${task.SECUENCIAL}`)}
                        >
                          Calificar
                        </button>
                      </div>
                    ))}
                    {(!tasksByModule[module.SECUENCIAL] || tasksByModule[module.SECUENCIAL].length === 0) && (
                      <p style={{ fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic', padding: '10px' }}>No hay tareas asignadas.</p>
                    )}
                  </div>
                )}

              </div>
            ))
          }
        </div>
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
                <label>Archivo Guía (Opcional)</label>
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
                <input type="text" placeholder="Ej: Diapositivas Clase 1" onChange={e => setNewResourceData({ ...newResourceData, titulo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción (Opcional)</label>
                <textarea rows="2" onChange={e => setNewResourceData({ ...newResourceData, descripcion: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Archivo (PDF, Imagen, Zip)</label>
                <input type="file" required onChange={e => setNewResourceData({ ...newResourceData, archivo: e.target.files[0] })} />
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