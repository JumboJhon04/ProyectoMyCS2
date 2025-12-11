import React from 'react';
import { FaChartBar, FaTrophy, FaCalendarCheck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './CalificacionesTab.css';

const CalificacionesTab = ({ courseData, eventType }) => {
    const notaAprobacion = courseData?.NOTAAPROBACION || 70;
    const asistenciaMinima = courseData?.ASISTENCIAMINIMA || 80;

    // Mock data de calificaciones
    const mockCalificaciones = [
        {
            id: 1,
            modulo: 'Módulo 1: Introducción',
            nota: 85,
            fecha: '2024-11-15',
            estado: 'aprobado',
        },
        {
            id: 2,
            modulo: 'Módulo 2: Fundamentos',
            nota: 78,
            fecha: '2024-11-22',
            estado: 'aprobado',
        },
        {
            id: 3,
            modulo: 'Módulo 3: Práctica',
            nota: 92,
            fecha: '2024-11-29',
            estado: 'aprobado',
        },
        {
            id: 4,
            modulo: 'Examen Final',
            nota: null,
            fecha: null,
            estado: 'pendiente',
        },
    ];

    const calificacionesCompletadas = mockCalificaciones.filter((c) => c.nota !== null);
    const promedioActual =
        calificacionesCompletadas.length > 0
            ? Math.round(
                calificacionesCompletadas.reduce((sum, c) => sum + c.nota, 0) /
                calificacionesCompletadas.length
            )
            : 0;

    const asistenciaActual = 85; // Mock
    const aprobado = promedioActual >= notaAprobacion && asistenciaActual >= asistenciaMinima;

    const getNotaColor = (nota) => {
        if (nota >= notaAprobacion) return '#10b981';
        if (nota >= notaAprobacion - 10) return '#f59e0b';
        return '#ef4444';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Pendiente';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="calificaciones-tab-container">
            <div className="calificaciones-header">
                <h3>Calificaciones</h3>
            </div>

            {/* Resumen de Calificaciones */}
            <div className="calificaciones-summary">
                <div className="summary-card promedio-card">
                    <FaChartBar className="summary-icon" />
                    <div className="summary-info">
                        <span className="summary-label">Promedio Actual</span>
                        <span
                            className="summary-value"
                            style={{ color: getNotaColor(promedioActual) }}
                        >
                            {promedioActual}%
                        </span>
                    </div>
                </div>

                <div className="summary-card aprobacion-card">
                    <FaTrophy className="summary-icon" />
                    <div className="summary-info">
                        <span className="summary-label">Nota de Aprobación</span>
                        <span className="summary-value">{notaAprobacion}%</span>
                    </div>
                </div>

                <div className="summary-card asistencia-card">
                    <FaCalendarCheck className="summary-icon" />
                    <div className="summary-info">
                        <span className="summary-label">Asistencia</span>
                        <span className="summary-value">{asistenciaActual}%</span>
                    </div>
                </div>

                <div className={`summary-card estado-card ${aprobado ? 'aprobado' : 'pendiente'}`}>
                    {aprobado ? (
                        <FaCheckCircle className="summary-icon" />
                    ) : (
                        <FaTimesCircle className="summary-icon" />
                    )}
                    <div className="summary-info">
                        <span className="summary-label">Estado</span>
                        <span className="summary-value">
                            {aprobado ? 'Aprobado' : 'En Progreso'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Requisitos */}
            <div className="requisitos-section">
                <h4 className="section-title">Requisitos de Aprobación</h4>
                <div className="requisitos-list">
                    <div className="requisito-item">
                        <div className={`requisito-status ${promedioActual >= notaAprobacion ? 'cumplido' : 'pendiente'}`}>
                            {promedioActual >= notaAprobacion ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>
                        <span className="requisito-text">
                            Obtener mínimo {notaAprobacion}% de promedio
                        </span>
                    </div>
                    <div className="requisito-item">
                        <div className={`requisito-status ${asistenciaActual >= asistenciaMinima ? 'cumplido' : 'pendiente'}`}>
                            {asistenciaActual >= asistenciaMinima ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>
                        <span className="requisito-text">
                            Tener mínimo {asistenciaMinima}% de asistencia
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabla de Calificaciones */}
            <div className="calificaciones-table-section">
                <h4 className="section-title">Desglose de Calificaciones</h4>
                <div className="calificaciones-table">
                    <div className="table-header">
                        <div className="table-cell">Módulo/Evaluación</div>
                        <div className="table-cell">Fecha</div>
                        <div className="table-cell">Nota</div>
                        <div className="table-cell">Estado</div>
                    </div>
                    {mockCalificaciones.map((calificacion) => (
                        <div key={calificacion.id} className="table-row">
                            <div className="table-cell">{calificacion.modulo}</div>
                            <div className="table-cell">{formatDate(calificacion.fecha)}</div>
                            <div className="table-cell">
                                {calificacion.nota !== null ? (
                                    <span
                                        className="nota-badge"
                                        style={{
                                            background: `${getNotaColor(calificacion.nota)}20`,
                                            color: getNotaColor(calificacion.nota),
                                        }}
                                    >
                                        {calificacion.nota}%
                                    </span>
                                ) : (
                                    <span className="nota-badge pendiente-badge">-</span>
                                )}
                            </div>
                            <div className="table-cell">
                                {calificacion.estado === 'aprobado' && (
                                    <span className="estado-badge aprobado">Aprobado</span>
                                )}
                                {calificacion.estado === 'pendiente' && (
                                    <span className="estado-badge pendiente">Pendiente</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Visual */}
            <div className="progreso-visual-section">
                <h4 className="section-title">Progreso de Aprobación</h4>
                <div className="progreso-visual">
                    <div className="progreso-bar-large">
                        <div
                            className="progreso-fill-large"
                            style={{
                                width: `${(promedioActual / 100) * 100}%`,
                                background: getNotaColor(promedioActual),
                            }}
                        />
                    </div>
                    <div className="progreso-labels">
                        <span>0%</span>
                        <span className="meta-aprobacion" style={{ left: `${notaAprobacion}%` }}>
                            Meta: {notaAprobacion}%
                        </span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalificacionesTab;
