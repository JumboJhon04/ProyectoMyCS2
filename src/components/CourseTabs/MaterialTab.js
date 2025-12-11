import React from 'react';
import { FaBook, FaCheck, FaSync, FaLock, FaEye, FaFilePdf, FaVideo, FaLink } from 'react-icons/fa';
import './MaterialTab.css';

const MaterialTab = ({ topics, eventType }) => {
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
