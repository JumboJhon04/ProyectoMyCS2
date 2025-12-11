import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBook, FaUsers, FaChartBar, FaPlus, FaTimes, FaFileAlt } from 'react-icons/fa';
import './ProfesorCourseDetail.css';
import API_URL from '../../../../config/api';

const ProfesorCourseDetail = () => {
  const { courseId } = useParams(); 
  const navigate = useNavigate();
  
  // Estados de datos
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [tasksByModule, setTasksByModule] = useState({}); // Almacena tareas por ID de módulo
  const [loading, setLoading] = useState(true);

  // Estados Modal MÓDULO
  const [showModal, setShowModal] = useState(false);
  const [newModuleData, setNewModuleData] = useState({ titulo: '', descripcion: '' });
  
  // Estados Modal TAREA
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [newTaskData, setNewTaskData] = useState({
      titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null
  });
  
  const [creating, setCreating] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Curso
      const resCourse = await fetch(`${API_URL}/api/docentes/${courseId}/mis-cursos`); // O tu endpoint de detalle evento
      // NOTA: Si usas el endpoint de lista, filtra o ajusta. 
      // Por simplicidad, asumo que tienes un endpoint para ver 1 evento o reusamos la lógica de lista.
      // Si no tienes endpoint de "ver 1 evento", usaremos el de modulos para pintar titulo si viene.
      
      // 2. Módulos
      const resModules = await fetch(`${API_URL}/api/modulos/evento/${courseId}`);
      const dataModules = await resModules.json();
      
      if (dataModules.success) {
        setModules(dataModules.data);
        // 3. Cargar tareas para cada módulo encontrado
        dataModules.data.forEach(mod => fetchTasks(mod.SECUENCIAL));
      }
      
      // Simulación de datos del curso si no tienes endpoint específico de detalle
      // (Idealmente deberías tener un endpoint GET /api/eventos/:id público o protegido)
      const resEvento = await fetch(`${API_URL}/api/eventos/${courseId}`); // Asegúrate de tener esta ruta
      const dataEvento = await resEvento.json();
      if(dataEvento) setCourse(dataEvento[0] || dataEvento);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para cargar tareas de un módulo
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

  // --- CREAR MÓDULO ---
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
        alert("Módulo creado");
        setShowModal(false);
        setNewModuleData({ titulo: '', descripcion: '' });
        fetchData(); 
      }
    } catch (error) { console.error(error); } finally { setCreating(false); }
  };

  // --- CREAR TAREA ---
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
            alert("Tarea creada exitosamente");
            setShowTaskModal(false);
            fetchTasks(selectedModuleId); // Recargar solo las tareas de este módulo
            setNewTaskData({ titulo: '', descripcion: '', fechaApertura: '', fechaLimite: '', puntos: 10, archivo: null });
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error al subir la tarea");
    } finally {
        setCreating(false);
    }
  };

  if (loading) return <div className="loading-state">Cargando contenido...</div>;
  if (!course) return <div className="error-state">No se encontró información del curso.</div>;

  return (
    <div className="professor-course-detail-page">
      
      {/* HEADER */}
      <div className="course-detail-header-profesor" 
           style={{ backgroundImage: `url(${course.URL_IMAGEN || 'https://res.cloudinary.com/dpedmnwrd/image/upload/v1765413406/eventos/rwrbqwirdaghmsjwacpm.webp'})` }}>
        <div className="header-overlay-profesor">
            <h1 className="course-detail-title-profesor">{course.TITULO}</h1>
            <p style={{color: '#fff'}}>{course.DESCRIPCION}</p>
        </div>
      </div>

      <div className="course-detail-content-profesor">
        
        {/* TABS & ACCIONES */}
        <div className="course-tabs-profesor">
          <button className="tab-button-profesor active"><FaBook /> Contenido</button>
          <button className="tab-button-profesor create-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Nuevo Módulo
          </button>
        </div>

        {/* LISTA DE MÓDULOS Y SUS TAREAS */}
        <div className="course-modules-list-profesor">
        {modules.length === 0 ? <p className="no-modules">No hay módulos definidos.</p> : 
          modules.map((module) => (
            <div key={module.SECUENCIAL} className="lesson-item-profesor" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
              
              {/* Cabecera del Módulo */}
              <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <div>
                    <h4 className="lesson-title-profesor">{module.TITULO}</h4>
                    <p className="lesson-description-profesor">{module.DESCRIPCION}</p>
                  </div>
                  <button 
                    className="action-btn-profesor secondary"
                    style={{backgroundColor: '#28a745', color: 'white'}}
                    onClick={() => { setSelectedModuleId(module.SECUENCIAL); setShowTaskModal(true); }}
                  >
                    <FaPlus /> Agregar Tarea
                  </button>
              </div>

              {/* Lista de Tareas dentro del Módulo */}
              <div className="tasks-container" style={{width: '100%', paddingLeft: '20px', borderLeft: '3px solid #eee'}}>
                  {tasksByModule[module.SECUENCIAL] && tasksByModule[module.SECUENCIAL].length > 0 ? (
                      tasksByModule[module.SECUENCIAL].map(task => (
                          <div key={task.SECUENCIAL} style={{background: '#f9f9f9', padding: '10px', marginBottom: '5px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between'}}>
                              <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                                  <FaFileAlt color="#555"/>
                                  <div>
                                      <strong>{task.TITULO}</strong>
                                      <div style={{fontSize: '0.8rem', color: '#777'}}>
                                        Vence: {task.FECHA_LIMITE ? new Date(task.FECHA_LIMITE).toLocaleDateString() : 'Sin fecha'}
                                      </div>
                                  </div>
                              </div>
                              <button 
                                    className="action-btn-profesor" 
                                    style={{fontSize: '0.8rem'}}
                                    onClick={() => navigate(`/profesor/grading/${task.SECUENCIAL}`)} // <--- ESTO ES LO NUEVO
                                >
                                    Calificar
                              </button>
                          </div>
                      ))
                  ) : (
                      <p style={{fontSize: '0.9rem', color: '#999', fontStyle: 'italic'}}>No hay tareas en este módulo.</p>
                  )}
              </div>

            </div>
        ))}
        </div>
      </div>

      {/* --- MODAL CREAR MÓDULO --- */}
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
                <input type="text" value={newModuleData.titulo} onChange={(e) => setNewModuleData({...newModuleData, titulo: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={newModuleData.descripcion} onChange={(e) => setNewModuleData({...newModuleData, descripcion: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR TAREA --- */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3>Nueva Tarea</h3>
              <button onClick={() => setShowTaskModal(false)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Título</label>
                <input type="text" required onChange={e => setNewTaskData({...newTaskData, titulo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Instrucciones</label>
                <textarea rows="3" onChange={e => setNewTaskData({...newTaskData, descripcion: e.target.value})} />
              </div>
              <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label>Apertura</label>
                    <input type="datetime-local" required onChange={e => setNewTaskData({...newTaskData, fechaApertura: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label>Límite</label>
                    <input type="datetime-local" required onChange={e => setNewTaskData({...newTaskData, fechaLimite: e.target.value})} />
                  </div>
              </div>
              <div className="form-group">
                <label>Puntaje</label>
                <input type="number" defaultValue="10" onChange={e => setNewTaskData({...newTaskData, puntos: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Archivo Guía (PDF/Doc/Imagen)</label>
                <input type="file" onChange={e => setNewTaskData({...newTaskData, archivo: e.target.files[0]})} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="cancel-btn">Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={creating}>{creating ? 'Subiendo...' : 'Guardar Tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfesorCourseDetail;