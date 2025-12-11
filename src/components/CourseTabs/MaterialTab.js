import React from 'react';
import { FaBook, FaCheck, FaSync, FaLock, FaEye, FaFilePdf, FaVideo, FaLink, FaClipboardCheck } from 'react-icons/fa';
import './MaterialTab.css';

const MaterialTab = ({ topics, eventType, modules, loading }) => {
    // Convertir topics a lecciones con estado mock
    const lessons = topics && topics.length > 0
        ? topics.map((topic, index) => ({
            id: index + 1,
            title: typeof topic === 'string' ? topic : topic.title || `Tema ${index + 1}`,
            description: typeof topic === 'string' ? '' : topic.description || '',
            status: index === 0 ? 'in-progress' : index < 3 ? 'locked' : 'locked', // Mock status
            materials: [
                { type: 'pdf', name: 'Presentación.pdf', size: '2.3 MB' },
                { type: 'video', name: 'Video de clase', duration: '45 min' },
                { type: 'link', name: 'Recursos adicionales', url: '#' },
            ].slice(0, Math.floor(Math.random() * 3) + 1), // Mock materials aleatorios
        }))
        : [];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <FaCheck className="status-check" />;
            case 'in-progress':
                return <FaSync className="status-progress spinning" />;
            case 'locked':
                return <FaLock className="status-lock" />;
            default:
                return <FaLock className="status-lock" />;
        }
    };

    const getMaterialIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <FaFilePdf className="material-icon-pdf" />;
            case 'video':
                return <FaVideo className="material-icon-video" />;
            case 'link':
                return <FaLink className="material-icon-link" />;
            default:
                return <FaBook />;
        }
    };

    if (lessons.length === 0) {
        return (
            <div className="material-tab-container">
                <div className="empty-state">
                    <FaBook className="empty-icon" />
                    <p>Este curso no tiene material definido aún.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="material-tab-container">
                <div className="empty-state">
                    <FaSync className="status-progress spinning" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                    <p>Cargando contenido del curso...</p>
                </div>
            </div>
        );
    }
    // Si tenemos módulos reales (Estructura nueva con tareas)
    if (modules && modules.length > 0) {
        return (
            <div className="material-tab-container">
                <div className="material-header">
                    <h3>Contenido del Curso</h3>
                </div>
                <div className="modules-list">
                    {modules.map((mod) => (
                        <div key={mod.SECUENCIAL} className="module-section">
                            <h4 className="module-title">{mod.TITULO}</h4>
                            {mod.DESCRIPCION && <p className="module-desc">{mod.DESCRIPCION}</p>}

                            <div className="module-tasks">
                                {mod.tasks && mod.tasks.length > 0 ? (
                                    mod.tasks.map(task => (
                                        <div key={task.SECUENCIAL} className="task-card">
                                            <div className="task-icon-col">
                                                <FaClipboardCheck className="task-icon-type" />
                                            </div>
                                            <div className="task-info">
                                                <h5>{task.TITULO}</h5>
                                                <p>{task.DESCRIPCION}</p>
                                                <div className="task-meta">
                                                    <span className="task-date">
                                                        Vence: {new Date(task.FECHA_LIMITE).toLocaleDateString()}
                                                    </span>
                                                    {task.PUNTOS_MAXIMOS &&
                                                        <span className="task-pts">({task.PUNTOS_MAXIMOS} pts)</span>
                                                    }
                                                </div>
                                                {/* Estado de entrega */}
                                                <div className="task-status-row">
                                                    {task.ESTADO_ENTREGA ? (
                                                        <span className={`status-badge status-${task.ESTADO_ENTREGA.toLowerCase()}`}>
                                                            {task.ESTADO_ENTREGA === 'ENVIADO' ? 'Enviado' : task.ESTADO_ENTREGA}
                                                            {task.CALIFICACION && ` - Nota: ${task.CALIFICACION}`}
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge status-pending">Pendiente</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="task-actions">
                                                <button className="btn-view-task">
                                                    {task.ESTADO_ENTREGA ? <FaEye /> : <FaCheck />}
                                                    {task.ESTADO_ENTREGA ? ' Ver Entrega' : ' Entregar'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-tasks-msg">No hay tareas en este módulo.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Sección Legacy de Topics (si existen) */}
                {topics && topics.length > 0 && (
                    <div className="legacy-topics">
                        <h4>Temario Adicional</h4>
                        {/* Reutilizar lógica anterior si se desea, o simplificar */}
                        <div className="lessons-list">
                            {lessons.map((lesson) => (
                                <div key={lesson.id} className={`lesson-card ${lesson.status}`}>
                                    <div className="lesson-content">
                                        <h4>{lesson.title}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Fallback: Lógica anterior (Solo Topics)
    if (lessons.length === 0) {
        return (
            <div className="material-tab-container">
                <div className="empty-state">
                    <FaBook className="empty-icon" />
                    <p>Este curso no tiene material definido aún.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="material-tab-container">
            <div className="material-header">
                <h3>Material del Curso</h3>
                <p className="material-subtitle">
                    {lessons.length} tema{lessons.length !== 1 ? 's' : ''} disponible{lessons.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="lessons-list">
                {lessons.map((lesson) => (
                    <div key={lesson.id} className={`lesson-card ${lesson.status}`}>
                        <div className="lesson-status-icon">
                            {getStatusIcon(lesson.status)}
                        </div>

                        <div className="lesson-content">
                            <div className="lesson-header">
                                <h4 className="lesson-title">
                                    <span className="lesson-number">Tema {lesson.id}:</span> {lesson.title}
                                </h4>
                                {lesson.status === 'completed' && (
                                    <span className="lesson-badge completed-badge">Completado</span>
                                )}
                                {lesson.status === 'in-progress' && (
                                    <span className="lesson-badge progress-badge">En Progreso</span>
                                )}
                            </div>

                            {lesson.description && (
                                <p className="lesson-description">{lesson.description}</p>
                            )}

                            {/* Material adjunto */}
                            {lesson.materials && lesson.materials.length > 0 && (
                                <div className="lesson-materials">
                                    {lesson.materials.map((material, idx) => (
                                        <div key={idx} className="material-item">
                                            {getMaterialIcon(material.type)}
                                            <span className="material-name">{material.name}</span>
                                            {material.size && (
                                                <span className="material-meta">{material.size}</span>
                                            )}
                                            {material.duration && (
                                                <span className="material-meta">{material.duration}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="lesson-action-btn"
                                disabled={lesson.status === 'locked'}
                            >
                                <FaEye />
                                <span>Ver</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MaterialTab;
