import React from 'react';
import { FaUsers, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import './ParticipantesTab.css';

const ParticipantesTab = ({ courseData, eventType }) => {
    const docente = courseData?.NOMBRE_DOCENTE || courseData?.Docente || 'Por asignar';
    const capacidad = courseData?.CAPACIDAD || 'No especificada';

    // Mock data de participantes (estudiantes)
    const mockParticipantes = [
        {
            id: 1,
            nombre: 'Ana García Pérez',
            progreso: 75,
            iniciales: 'AG',
        },
        {
            id: 2,
            nombre: 'Carlos Mendoza López',
            progreso: 60,
            iniciales: 'CM',
        },
        {
            id: 3,
            nombre: 'María Rodríguez Silva',
            progreso: 90,
            iniciales: 'MR',
        },
        {
            id: 4,
            nombre: 'Jorge Hernández Torres',
            progreso: 45,
            iniciales: 'JH',
        },
        {
            id: 5,
            nombre: 'Laura Martínez González',
            progreso: 85,
            iniciales: 'LM',
        },
    ];

    const totalInscritos = mockParticipantes.length;

    const getDocenteInitials = (nombre) => {
        if (!nombre || nombre === 'Por asignar') return 'ND';
        const parts = String(nombre).trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return String(nombre).substring(0, 2).toUpperCase();
    };

    const getProgressColor = (progreso) => {
        if (progreso >= 75) return '#10b981';
        if (progreso >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="participantes-tab-container">
            <div className="participantes-header">
                <h3>Participantes del Curso</h3>
                <div className="participantes-stats">
                    <div className="stat-box">
                        <FaUsers className="stat-icon" />
                        <div className="stat-info">
                            <span className="stat-label">Inscritos</span>
                            <span className="stat-value">{totalInscritos}</span>
                        </div>
                    </div>
                    {capacidad !== 'No especificada' && (
                        <div className="stat-box">
                            <FaUserGraduate className="stat-icon" />
                            <div className="stat-info">
                                <span className="stat-label">Capacidad</span>
                                <span className="stat-value">{capacidad}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Docente Section */}
            <div className="docente-section">
                <h4 className="section-title">
                    <FaChalkboardTeacher className="title-icon" />
                    Docente
                </h4>
                <div className="docente-card">
                    <div className="docente-avatar">
                        {getDocenteInitials(docente)}
                    </div>
                    <div className="docente-info">
                        <h5 className="docente-name">
                            {docente === 'Por asignar' ? 'Por asignar' : `Ing. ${docente}`}
                        </h5>
                        <span className="docente-role">Instructor Principal</span>
                    </div>
                </div>
            </div>

            {/* Estudiantes Section */}
            <div className="estudiantes-section">
                <h4 className="section-title">
                    <FaUserGraduate className="title-icon" />
                    Estudiantes ({totalInscritos})
                </h4>
                <div className="estudiantes-list">
                    {mockParticipantes.map((participante) => (
                        <div key={participante.id} className="participante-card">
                            <div className="participante-avatar" style={{ background: `linear-gradient(135deg, var(--event-primary-color, #3b82f6), var(--event-secondary-color, #1d4ed8))` }}>
                                {participante.iniciales}
                            </div>
                            <div className="participante-info">
                                <h5 className="participante-nombre">{participante.nombre}</h5>
                                <div className="progreso-container">
                                    <div className="progreso-bar">
                                        <div
                                            className="progreso-fill"
                                            style={{
                                                width: `${participante.progreso}%`,
                                                background: getProgressColor(participante.progreso),
                                            }}
                                        />
                                    </div>
                                    <span className="progreso-text">{participante.progreso}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParticipantesTab;
