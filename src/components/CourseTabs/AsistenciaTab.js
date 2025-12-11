import React, { useState, useEffect } from 'react';
import './AsistenciaTab.css';
import API_URL from '../../config/api';
import { useUser } from '../../context/UserContext';
import { FaCheckCircle, FaTimesCircle, FaCalendarCheck } from 'react-icons/fa';

const AsistenciaTab = ({ courseData }) => {
    const { user } = useUser();
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user || !courseData) return;

            try {
                setLoading(true);
                const userId = user.id || user.SECUENCIAL;
                const eventId = courseData.SECUENCIAL;

                const response = await fetch(`${API_URL}/api/estudiantes/${userId}/evento/${eventId}/asistencia`);
                const result = await response.json();

                if (result.success) {
                    setAttendanceData(result.data);
                } else {
                    // Si falla o no hay datos, manejamos como null o error silencioso
                    console.warn('No attendance data found or API error');
                }
            } catch (err) {
                console.error('Error fetching attendance:', err);
                setError('No se pudo cargar la información de asistencia.');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user, courseData]);

    const handleRegisterAttendance = async () => {
        if (!user || !courseData) return;
        try {
            setLoading(true);
            const userId = user.id || user.SECUENCIAL;
            const eventId = courseData.SECUENCIAL;

            const response = await fetch(`${API_URL}/api/estudiantes/${userId}/evento/${eventId}/asistencia`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                alert('¡Asistencia registrada con éxito!');
                // Recargar datos
                window.location.reload();
            } else {
                alert(result.error || 'Error al registrar asistencia');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="asistencia-loading">Cargando asistencia...</div>;
    }

    if (error) {
        return <div className="asistencia-error">{error}</div>;
    }

    if (!attendanceData) {
        return (
            <div className="asistencia-empty">
                <p>No hay registro de asistencia aún.</p>
                <button
                    className="btn-register-attendance"
                    onClick={handleRegisterAttendance}
                    disabled={loading}
                >
                    {loading ? 'Registrando...' : '📍 Registrar Mi Asistencia Aquí'}
                </button>
            </div>
        );
    }

    const { porcentajeAsistencia, asistio, asistenciaMinima, observacion } = attendanceData;
    const isApproved = parseFloat(porcentajeAsistencia) >= parseFloat(asistenciaMinima);

    return (
        <div className="asistencia-tab-container">
            <div className="asistencia-card">
                <div className="asistencia-header">
                    <FaCalendarCheck className="asistencia-icon" />
                    <h3>Resumen de Asistencia</h3>
                </div>

                <div className="asistencia-stats">
                    <div className="stat-box">
                        <span className="stat-label">Tu Asistencia</span>
                        <span className={`stat-value ${isApproved ? 'success' : 'warning'}`}>
                            {porcentajeAsistencia}%
                        </span>
                    </div>

                    <div className="stat-box">
                        <span className="stat-label">Mínimo Requerido</span>
                        <span className="stat-value neutral">
                            {asistenciaMinima}%
                        </span>
                    </div>
                </div>

                <div className={`asistencia-status ${isApproved ? 'status-approved' : 'status-failed'}`}>
                    {isApproved ? (
                        <>
                            <FaCheckCircle /> <span>Cumples con el requisito de asistencia</span>
                        </>
                    ) : (
                        <>
                            <FaTimesCircle /> <span>No cumples con el requisito de asistencia</span>
                        </>
                    )}
                </div>

                {!asistio && (
                    <div style={{ marginTop: '20px' }}>
                        <button
                            className="btn-register-attendance"
                            onClick={handleRegisterAttendance}
                            disabled={loading}
                        >
                            {loading ? 'Registrando...' : '📍 Registrar Mi Asistencia'}
                        </button>
                    </div>
                )}

                {observacion && (
                    <div className="asistencia-observation">
                        <strong>Observación:</strong>
                        <p>{observacion}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsistenciaTab;
