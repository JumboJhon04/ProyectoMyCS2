import React, { useState, useEffect } from 'react';
import { FaBook, FaCheck, FaSync, FaLock, FaEye, FaFilePdf, FaVideo, FaLink, FaUpload, FaClipboardList, FaClock, FaTrophy, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import FilePreview from '../../components/FilePreview/FilePreview';
import API_URL from '../../config/api';
import './MaterialTab.css';

const MaterialTab = ({ topics, eventType, courseData, modules, loading }) => {
    const { user } = useUser();
    const navigate = useNavigate();
    const modulos = modules || [];
    const [entregas, setEntregas] = useState([]);
    const [examsByModule, setExamsByModule] = useState({}); // NUEVO ESTADO PARA EXAMENES
    const [intentos, setIntentos] = useState([]); // NUEVO: Estado para intentos de examenes
    // loading viene de props
    const [selectedTarea, setSelectedTarea] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadComment, setUploadComment] = useState('');
    const [uploading, setUploading] = useState(false);

    // Estados para Preview de Archivos
    const [showPreview, setShowPreview] = useState(false);
    const [previewFile, setPreviewFile] = useState({ url: '', name: '' });

    // Nuevo estado para módulo seleccionado (similar al profesor)
    const [selectedModule, setSelectedModule] = useState(null);

    // Cargar exámenes cuando cambian los módulos
    useEffect(() => {
        if (modulos.length > 0) {
            modulos.forEach(m => fetchExams(m.SECUENCIAL));
        }
    }, [modulos]);

    // Obtener entregas del estudiante
    useEffect(() => {
        const fetchEntregas = async () => {
            if (!user?.id || !courseData?.SECUENCIAL) return;

            try {
                const response = await fetch(`${API_URL}/api/tareas/estudiante/${user.id}/evento/${courseData.SECUENCIAL}`);
                const data = await response.json();

                if (data.success) {
                    setEntregas(data.data || []);
                }
            } catch (error) {
                console.error('Error al cargar entregas:', error);
            }
        }
        fetchEntregas();
        fetchIntentos();
    }, [user, courseData]);

    const fetchIntentos = async () => {
        if (!user || !user.id) return;
        try {
            const res = await fetch(`${API_URL}/api/evaluaciones/intentos/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setIntentos(data.data);
            }
        } catch (error) { console.error(error); }
    };

    const fetchExams = async (moduloId) => {
        try {
            const res = await fetch(`${API_URL}/api/evaluaciones/modulo/${moduloId}`);
            const data = await res.json();
            if (data.success) {
                setExamsByModule(prev => ({ ...prev, [moduloId]: data.data }));
            }
        } catch (error) { console.error(error); }
    };

    // Verificar si una tarea ya fue entregada
    const getEntregaStatus = (tareaId) => {
        return entregas.find(e => e.tareaId === tareaId);
    };

    // Calcular progreso de un módulo basado en tareas entregadas y exámenes completados
    const calculateModuleProgress = (modulo) => {
        const totalTareas = modulo.tareas?.length || 0;
        const examenesModulo = examsByModule[modulo.SECUENCIAL] || [];
        const totalExamenes = examenesModulo.length;
        const totalActividades = totalTareas + totalExamenes;

        if (totalActividades === 0) {
            return { percentage: 0, completed: 0, total: 0, isCompleted: false };
        }

        // Contar tareas entregadas
        const tareasEntregadas = modulo.tareas?.filter(tarea => {
            const entrega = getEntregaStatus(tarea.SECUENCIAL);
            return entrega !== undefined;
        }).length || 0;

        // Contar exámenes completados
        const examenesCompletados = examenesModulo.filter(exam => {
            const intento = intentos.find(i => i.SECUENCIALEVALUACION === exam.SECUENCIAL);
            return !!intento;
        }).length;

        const actividadesCompletadas = tareasEntregadas + examenesCompletados;
        const percentage = Math.round((actividadesCompletadas / totalActividades) * 100);
        // Solo marcar como completado si hay actividades Y todas están completadas
        const isCompleted = totalActividades > 0 && actividadesCompletadas === totalActividades;

        return {
            percentage,
            completed: actividadesCompletadas,
            total: totalActividades,
            isCompleted,
            tareasCompletadas: tareasEntregadas,
            totalTareas,
            examenesCompletados,
            totalExamenes
        };
    };

    // Manejar subida de tarea
    const handleUploadTarea = async () => {
        if (!uploadFile || !selectedTarea) {
            alert('Por favor selecciona un archivo');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('archivoDeber', uploadFile);
            formData.append('tareaId', selectedTarea.SECUENCIAL);
            formData.append('estudianteId', user.id);
            formData.append('comentario', uploadComment);

            const response = await fetch(`${API_URL}/api/tareas/entregar`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Tarea entregada correctamente');
                setShowUploadModal(false);
                setUploadFile(null);
                setUploadComment('');
                setSelectedTarea(null);

                // Recargar entregas
                const entregasRes = await fetch(`${API_URL}/api/tareas/estudiante/${user.id}/evento/${courseData.SECUENCIAL}`);
                const entregasData = await entregasRes.json();
                if (entregasData.success) {
                    setEntregas(entregasData.data || []);
                }
            } else {
                alert('Error al entregar la tarea: ' + data.message);
            }
        } catch (error) {
            console.error('Error al subir tarea:', error);
            alert('Error al entregar la tarea');
        } finally {
            setUploading(false);
        }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Verificar si una tarea está vencida
    const isTareaVencida = (fechaLimite) => {
        return new Date(fechaLimite) < new Date();
    };

    // Función para abrir preview de archivos
    const handleOpenPreview = (url, name) => {
        setPreviewFile({ url, name });
        setShowPreview(true);
    };

    if (loading) {
        return (
            <div className="material-tab-container">
                <div className="empty-state">
                    <FaSync className="empty-icon spinning" />
                    <p>Cargando material del curso...</p>
                </div>
            </div>
        );
    }

    if (modulos.length === 0) {
        return (
            <div className="material-tab-container">
                <div className="empty-state">
                    <FaBook className="empty-icon" />
                    <p>Este curso no tiene módulos definidos aún.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="material-tab-container">
            <div className="material-header">
                <h3>Material del Curso</h3>
                <p className="material-subtitle">
                    {modulos.length} módulo{modulos.length !== 1 ? 's' : ''} disponible{modulos.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* GRID DE TARJETAS DE MÓDULOS */}
            <div className="modulos-grid-estudiante">
                {modulos.map((modulo, index) => {
                    const isSelected = selectedModule?.SECUENCIAL === modulo.SECUENCIAL;
                    const resourceCount = modulo.recursos?.length || 0;
                    const progress = calculateModuleProgress(modulo);

                    return (
                        <div
                            key={modulo.SECUENCIAL}
                            className={`modulo-card-estudiante ${isSelected ? 'selected' : ''} ${selectedModule && !isSelected ? 'dimmed' : ''}`}
                            onClick={() => setSelectedModule(isSelected ? null : modulo)}
                            style={{ position: 'relative', zIndex: isSelected ? 10 : selectedModule ? 6 : 2 }}
                        >
                            <div className="modulo-card-icon-estudiante"><FaBook /></div>
                            <h4 className="modulo-card-title-estudiante">{modulo.TITULO}</h4>
                            <span className="modulo-card-count-estudiante">
                                {resourceCount} Materiales • {progress.total} Actividades
                            </span>
                            {progress.isCompleted && (
                                <span className="modulo-completed-badge">
                                    <FaCheck /> Completado
                                </span>
                            )}
                            {progress.total > 0 && (
                                <>
                                    <div className="modulo-progress-bar">
                                        <div
                                            className="modulo-progress-fill"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                    <span className="modulo-progress-text">
                                        {progress.completed}/{progress.total} completadas
                                    </span>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* OVERLAY OSCURO */}
            {selectedModule && (
                <div
                    className="dark-overlay-estudiante"
                    onClick={() => setSelectedModule(null)}
                />
            )}

            {/* CONTENIDO EXPANDIDO DEBAJO DEL GRID */}
            {selectedModule && (
                <div className="modulo-expanded-estudiante">
                    {/* CABECERA */}
                    <div className="expanded-header-estudiante">
                        <div className="expanded-header-left-estudiante">
                            <div className="expanded-icon-estudiante"><FaBook /></div>
                            <div>
                                <h2>{selectedModule.TITULO}</h2>
                                {selectedModule.DESCRIPCION && (
                                    <p className="expanded-description-estudiante">{selectedModule.DESCRIPCION}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="expanded-body-estudiante">
                        {/* RECURSOS */}
                        {selectedModule.recursos && selectedModule.recursos.length > 0 && (
                            <div className="expanded-section">
                                <h3 className="section-title-estudiante">
                                    <FaFilePdf /> Material de Apoyo ({selectedModule.recursos.length})
                                </h3>
                                <div className="recursos-list-expandido">
                                    {selectedModule.recursos.map((recurso) => (
                                        <div key={recurso.SECUENCIAL} className="recurso-item-expandido">
                                            <div className="recurso-info-expandido">
                                                <FaFilePdf className="recurso-icon-expandido" />
                                                <div>
                                                    <h4>{recurso.TITULO}</h4>
                                                    <p>{recurso.DESCRIPCION || 'Documento informativo'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleOpenPreview(recurso.URL_RECURSO, recurso.TITULO)}
                                                className="recurso-btn-expandido"
                                                style={{ border: 'none', cursor: 'pointer' }}
                                            >
                                                <FaEye /> Ver
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAREAS */}
                        {selectedModule.tareas && selectedModule.tareas.length > 0 && (
                            <div className="expanded-section">
                                <h3 className="section-title-estudiante">
                                    <FaClipboardList /> Tareas ({selectedModule.tareas.length})
                                </h3>
                                <div className="tareas-list-expandido">
                                    {selectedModule.tareas.map((tarea) => {
                                        const entrega = getEntregaStatus(tarea.SECUENCIAL);
                                        const vencida = isTareaVencida(tarea.FECHA_LIMITE);

                                        return (
                                            <div key={tarea.SECUENCIAL} className={`tarea-item-expandido ${entrega ? 'entregada' : ''} ${vencida && !entrega ? 'vencida' : ''}`}>
                                                <div className="tarea-header-expandido">
                                                    <div className="tarea-title-section-expandido">
                                                        <h6 className="tarea-title-expandido">{tarea.TITULO}</h6>
                                                        {entrega && (
                                                            <span className={`tarea-badge ${entrega.ESTADO === 'CALIFICADO' ? 'calificado-badge' : 'enviado-badge'}`}>
                                                                {entrega.ESTADO === 'CALIFICADO' ? (
                                                                    <>
                                                                        <FaTrophy /> Calificado: {entrega.CALIFICACION}/{tarea.PUNTOS_MAXIMOS}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaCheck /> Enviado
                                                                    </>
                                                                )}
                                                            </span>
                                                        )}
                                                        {vencida && !entrega && (
                                                            <span className="tarea-badge vencida-badge">
                                                                <FaClock /> Vencida
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="tarea-puntos-expandido">{tarea.PUNTOS_MAXIMOS} pts</span>
                                                </div>

                                                {tarea.DESCRIPCION && (
                                                    <p className="tarea-description-expandido">{tarea.DESCRIPCION}</p>
                                                )}

                                                <div className="tarea-dates-expandido">
                                                    <span className="tarea-date-expandido">
                                                        <FaClock /> Apertura: {formatDate(tarea.FECHA_APERTURA)}
                                                    </span>
                                                    <span className="tarea-date-expandido">
                                                        <FaClock /> Límite: {formatDate(tarea.FECHA_LIMITE)}
                                                    </span>
                                                </div>

                                                {tarea.URL_ADJUNTO && (
                                                    <div className="tarea-adjunto-expandido">
                                                        <button
                                                            onClick={() => handleOpenPreview(tarea.URL_ADJUNTO, `Consigna - ${tarea.TITULO}`)}
                                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                                        >
                                                            <FaFilePdf /> Ver consigna del profesor
                                                        </button>
                                                    </div>
                                                )}

                                                {entrega && entrega.RETROALIMENTACION && (
                                                    <div className="tarea-retroalimentacion-expandido">
                                                        <strong>Retroalimentación:</strong>
                                                        <p>{entrega.RETROALIMENTACION}</p>
                                                    </div>
                                                )}

                                                <div className="tarea-actions-expandido">
                                                    {entrega ? (
                                                        <button
                                                            onClick={() => handleOpenPreview(entrega.URL_ARCHIVO, `Mi entrega - ${tarea.TITULO}`)}
                                                            className="tarea-btn-expandido view-btn"
                                                            style={{ border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <FaEye /> Ver mi entrega
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="tarea-btn-expandido upload-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTarea(tarea);
                                                                setShowUploadModal(true);
                                                            }}
                                                            disabled={vencida}
                                                        >
                                                            <FaUpload /> {vencida ? 'Tarea vencida' : 'Entregar tarea'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Exámenes del módulo (NUEVO) */}
                        {examsByModule[selectedModule.SECUENCIAL] && examsByModule[selectedModule.SECUENCIAL].length > 0 && (
                            <div className="modulo-section">
                                <h5 className="section-title" style={{ color: '#d97706' }}>
                                    <FaClipboardList /> Evaluaciones
                                </h5>
                                <div className="recursos-list">
                                    {examsByModule[selectedModule.SECUENCIAL].map((exam) => {
                                        const intento = intentos.find(i => i.SECUENCIALEVALUACION === exam.SECUENCIAL);
                                        const isCompleted = !!intento;

                                        return (
                                            <div key={exam.SECUENCIAL} className="recurso-item" style={{ borderLeft: '4px solid #d97706' }}>
                                                <FaClock className="recurso-icon" style={{ color: '#d97706' }} />
                                                <div className="recurso-info">
                                                    <span className="recurso-name">{exam.TITULO}</span>
                                                    <span className="recurso-description">
                                                        Duración: {exam.DURACION_MINUTOS} mins •
                                                        {isCompleted
                                                            ? <span style={{ fontWeight: 'bold', color: '#10b981' }}> Calificación: {intento.CALIFICACION_FINAL}</span>
                                                            : ` Inicio: ${new Date(exam.FECHA_INICIO).toLocaleDateString()} ${new Date(exam.FECHA_INICIO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        }
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => !isCompleted && navigate(`/user/taking-exam/${exam.SECUENCIAL}`)}
                                                    className="recurso-btn"
                                                    disabled={isCompleted}
                                                    style={{
                                                        border: 'none',
                                                        cursor: isCompleted ? 'default' : 'pointer',
                                                        background: isCompleted ? '#e2e8f0' : '#fef3c7',
                                                        color: isCompleted ? '#64748b' : '#92400e',
                                                        opacity: isCompleted ? 0.8 : 1
                                                    }}
                                                >
                                                    {isCompleted ? <><FaCheck /> Completado</> : <><FaEdit /> Realizar prueba</>}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {(!selectedModule.tareas || selectedModule.tareas.length === 0) && (!selectedModule.recursos || selectedModule.recursos.length === 0) && (!examsByModule[selectedModule.SECUENCIAL] || examsByModule[selectedModule.SECUENCIAL].length === 0) && (
                            <div className="empty-modulo-expandido">
                                <p>Este módulo no tiene contenido disponible aún.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de subida de tarea */}
            {showUploadModal && (
                <div className="upload-modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
                    <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Entregar Tarea: {selectedTarea?.TITULO}</h3>

                        <div className="upload-form">
                            <div className="form-group">
                                <label>Archivo (PDF, DOC, DOCX, etc.)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    disabled={uploading}
                                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '8px',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        display: 'block',
                                        marginBottom: '0.5rem'
                                    }}
                                />
                                {uploadFile && (
                                    <span className="file-name">{uploadFile.name}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Comentario (opcional)</label>
                                <textarea
                                    value={uploadComment}
                                    onChange={(e) => setUploadComment(e.target.value)}
                                    placeholder="Agrega un comentario sobre tu entrega..."
                                    disabled={uploading}
                                    rows="4"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-submit"
                                    onClick={handleUploadTarea}
                                    disabled={!uploadFile || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <FaSync className="spinning" /> Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <FaUpload /> Entregar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {showPreview && (
                <FilePreview
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};

export default MaterialTab;
