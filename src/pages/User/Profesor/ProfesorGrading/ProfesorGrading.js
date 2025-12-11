import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaSave, FaCheckCircle, FaUser, FaClock } from 'react-icons/fa';
import API_URL from '../../../../config/api';
import './ProfesorGrading.css';

const ProfesorGrading = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados locales para manejar los inputs de cada fila
    const [grades, setGrades] = useState({});
    const [feedback, setFeedback] = useState({});

    useEffect(() => {
        fetchSubmissions();
    }, [taskId]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/tareas/${taskId}/entregas`);
            const data = await res.json();

            if (data.success) {
                setSubmissions(data.data);
                // Pre-cargar notas existentes en los inputs
                const initialGrades = {};
                const initialFeedback = {};
                data.data.forEach(sub => {
                    initialGrades[sub.entregaId] = sub.CALIFICACION || '';
                    initialFeedback[sub.entregaId] = sub.RETROALIMENTACION || '';
                });
                setGrades(initialGrades);
                setFeedback(initialFeedback);
            }
        } catch (error) {
            console.error("Error cargando entregas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmit = async (entregaId) => {
        const gradeValue = grades[entregaId];
        const feedbackValue = feedback[entregaId];

        if (gradeValue === '' || gradeValue < 0 || gradeValue > 10) {
            return alert("Por favor ingresa una nota válida (0-10)");
        }

        try {
            const res = await fetch(`${API_URL}/api/tareas/calificar/${entregaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calificacion: gradeValue,
                    retroalimentacion: feedbackValue
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Nota guardada correctamente");
                fetchSubmissions(); // Recargar para ver el check verde actualizado
            } else {
                alert("Error al guardar: " + data.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión al guardar nota");
        }
    };

    return (
        <div className="grading-container">
            {/* HEADER */}
            <div className="grading-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <FaArrowLeft /> Volver al Curso
                </button>
                <div>
                    <h1>Calificación de Tarea</h1>
                    <p className="task-id-label">Gestionando entregas de la tarea #{taskId}</p>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="grading-content">
                {loading ? <p>Cargando estudiantes...</p> :
                    submissions.length === 0 ? (
                        <div className="empty-state-grading">
                            <div style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}>📂</div>
                            <h3>No hay entregas aún</h3>
                            <p>Ningún estudiante ha enviado esta tarea todavía.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="grading-table">
                                <thead>
                                    <tr>
                                        <th>Estudiante</th>
                                        <th>Entregado</th>
                                        <th>Archivo</th>
                                        <th style={{ width: '100px' }}>Nota / 10</th>
                                        <th>Retroalimentación</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((item) => (
                                        <tr key={item.entregaId} className={item.ESTADO === 'CALIFICADO' ? 'row-graded' : ''}>
                                            <td>
                                                <div className="student-info">
                                                    <div className="student-icon"><FaUser /></div>
                                                    <div>
                                                        <strong>{item.NOMBRES} {item.APELLIDOS}</strong>
                                                        <span>{item.CORREO}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-info">
                                                    <FaClock /> {new Date(item.FECHA_ENTREGA).toLocaleDateString()}
                                                    <small>{new Date(item.FECHA_ENTREGA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <a
                                                    href={item.URL_ARCHIVO}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="download-link"
                                                >
                                                    <FaDownload /> Descargar
                                                </a>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0" max="10" step="0.01"
                                                    value={grades[item.entregaId]}
                                                    onChange={(e) => setGrades({ ...grades, [item.entregaId]: e.target.value })}
                                                    className="grade-input"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td>
                                                <textarea
                                                    value={feedback[item.entregaId]}
                                                    onChange={(e) => setFeedback({ ...feedback, [item.entregaId]: e.target.value })}
                                                    className="feedback-input"
                                                    placeholder="Escribe un comentario..."
                                                    rows="2"
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    className={`save-grade-btn ${item.ESTADO === 'CALIFICADO' ? 'updated' : ''}`}
                                                    onClick={() => handleGradeSubmit(item.entregaId)}
                                                >
                                                    <FaSave /> {item.ESTADO === 'CALIFICADO' ? 'Actualizar' : 'Guardar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default ProfesorGrading;