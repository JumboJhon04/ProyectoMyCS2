import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaSave, FaCheckCircle } from 'react-icons/fa';
import API_URL from '../../../../config/api';
import './ProfesorGrading.css';

const ProfesorGrading = () => {
  const { taskId } = useParams(); // ID de la tarea que viene por URL
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState([]);
  const [taskInfo, setTaskInfo] = useState(null); // Para mostrar el título de la tarea
  const [loading, setLoading] = useState(true);

  // Estados para guardar notas temporalmente antes de enviar
  const [grades, setGrades] = useState({}); 
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetchSubmissions();
  }, [taskId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // 1. Obtener lista de entregas
      const res = await fetch(`${API_URL}/api/tareas/${taskId}/entregas`);
      const data = await res.json();
      
      if (data.success) {
        setSubmissions(data.data);
        // Inicializar estados locales con los valores actuales
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
    try {
        const gradeValue = grades[entregaId];
        const feedbackValue = feedback[entregaId];

        if(gradeValue === '' || gradeValue < 0 || gradeValue > 10) {
            return alert("Por favor ingresa una nota válida (0-10)");
        }

        const res = await fetch(`${API_URL}/api/tareas/calificar/${entregaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calificacion: gradeValue,
                retroalimentacion: feedbackValue
            })
        });

        const data = await res.json();
        if(data.success) {
            alert("Nota guardada correctamente");
            fetchSubmissions(); // Recargar para actualizar estado visual
        }
    } catch (error) {
        console.error("Error guardando nota:", error);
        alert("Error al guardar");
    }
  };

  return (
    <div className="grading-container">
      <div className="grading-header">
        <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Volver al Curso
        </button>
        <h1>Calificación de Tarea</h1>
        <p className="task-id-label">ID Tarea: {taskId}</p>
      </div>

      <div className="grading-content">
        {loading ? <p>Cargando entregas...</p> : 
         submissions.length === 0 ? (
            <div className="empty-submissions">
                <p>Aún no hay entregas para esta tarea.</p>
            </div>
         ) : (
            <table className="grading-table">
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Fecha Entrega</th>
                        <th>Archivo</th>
                        <th>Nota (0/10)</th>
                        <th>Retroalimentación</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((item) => (
                        <tr key={item.entregaId}>
                            <td>
                                <div className="student-info">
                                    <strong>{item.NOMBRES} {item.APELLIDOS}</strong>
                                    <span>{item.CORREO}</span>
                                </div>
                            </td>
                            <td>{new Date(item.FECHA_ENTREGA).toLocaleString()}</td>
                            <td>
                                <a 
                                    href={item.URL_ARCHIVO} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="download-link"
                                >
                                    <FaDownload /> Ver Deber
                                </a>
                            </td>
                            <td>
                                <input 
                                    type="number" 
                                    min="0" max="10" step="0.1"
                                    value={grades[item.entregaId]}
                                    onChange={(e) => setGrades({...grades, [item.entregaId]: e.target.value})}
                                    className="grade-input"
                                />
                            </td>
                            <td>
                                <textarea 
                                    value={feedback[item.entregaId]}
                                    onChange={(e) => setFeedback({...feedback, [item.entregaId]: e.target.value})}
                                    className="feedback-input"
                                    placeholder="Comentario..."
                                />
                            </td>
                            <td>
                                <button 
                                    className="save-grade-btn"
                                    onClick={() => handleGradeSubmit(item.entregaId)}
                                >
                                    <FaSave /> Guardar
                                </button>
                                {item.ESTADO === 'CALIFICADO' && <FaCheckCircle color="green" title="Calificado" style={{marginLeft:'10px'}}/>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         )}
      </div>
    </div>
  );
};

export default ProfesorGrading;