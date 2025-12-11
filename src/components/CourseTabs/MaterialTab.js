import React, { useState, useEffect } from 'react';
import { FaBook, FaCheck, FaSync, FaLock, FaEye, FaFilePdf, FaVideo, FaLink, FaUpload, FaClipboardList, FaClock, FaTrophy } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import API_URL from '../../config/api';
import './MaterialTab.css';

const MaterialTab = ({ topics, eventType, courseData, modules, loading }) => {
    const { user } = useUser();
    const modulos = modules || [];
    const [entregas, setEntregas] = useState([]);
    const [selectedTarea, setSelectedTarea] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadComment, setUploadComment] = useState('');
    const [uploading, setUploading] = useState(false);

    // Nuevo estado para módulo seleccionado (similar al profesor)
    const [selectedModule, setSelectedModule] = useState(null);

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
        };

        fetchEntregas();
    }, [user, courseData]);

    // Verificar si una tarea ya fue entregada
    const getEntregaStatus = (tareaId) => {
        return entregas.find(e => e.tareaId === tareaId);
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
                    const taskCount = modulo.tareas?.length || 0;
                    const resourceCount = modulo.recursos?.length || 0;

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
                                {resourceCount} Materiales • {taskCount} Tareas
                            </span>
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
                                            <a
                                                href={recurso.URL_RECURSO}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="recurso-btn-expandido"
                                            >
                                                <FaEye /> Ver
                                            </a>
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
                                                        <a href={tarea.URL_ADJUNTO} target="_blank" rel="noopener noreferrer">
                                                            <FaFilePdf /> Ver consigna del profesor
                                                        </a>
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
                                                        <a
                                                            href={entrega.URL_ARCHIVO}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="tarea-btn-expandido view-btn"
                                                        >
                                                            <FaEye /> Ver mi entrega
                                                        </a>
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

                        {(!selectedModule.tareas || selectedModule.tareas.length === 0) && (!selectedModule.recursos || selectedModule.recursos.length === 0) && (
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
        </div>
    );
};

export default MaterialTab;
