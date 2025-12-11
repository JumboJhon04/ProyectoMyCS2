import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useUser } from '../../../../context/UserContext';
import API_URL from '../../../../config/api';
import './TakingExam.css';

const TakingExam = () => {
    const { examId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [respuestas, setRespuestas] = useState({}); // { preguntaId: opcionId }
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchExamData = async () => {
            try {
                // 1. Obtener info del examen
                const res = await fetch(`${API_URL}/api/evaluaciones/${examId}`);
                const data = await res.json();

                if (data.success) {
                    setExam(data.data);
                    // Las preguntas vienen anidadas si el backend está bien hecho, sino habría que pedirlas
                    if (data.data.preguntas) {
                        setQuestions(data.data.preguntas);
                    }
                } else {
                    alert("Error cargando el examen");
                    navigate(-1);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExamData();
    }, [examId]);

    const handleSelectOption = (preguntaId, opcionId) => {
        setRespuestas(prev => ({
            ...prev,
            [preguntaId]: opcionId
        }));
    };

    const handleSubmit = async () => {
        // Validar que todas las preguntas tengan respuesta (opcional según reglas)
        const unanswered = questions.filter(q => !respuestas[q.SECUENCIAL]);
        if (unanswered.length > 0) {
            if (!window.confirm(`Te faltan ${unanswered.length} preguntas por responder. ¿Enviar de todas formas?`)) {
                return;
            }
        }

        if (!window.confirm("¿Estás seguro de finalizar el examen? No podrás cambiar tus respuestas.")) return;

        try {
            setSubmitting(true);
            const payload = {
                estudianteId: user.id,
                evaluacionId: examId,
                respuestas: Object.entries(respuestas).map(([pId, oId]) => ({
                    preguntaId: parseInt(pId),
                    opcionId: oId
                }))
            };

            const res = await fetch(`${API_URL}/api/evaluaciones/entregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                alert(`Examen finalizado. Tu calificación: ${data.calificacion}`);
                navigate(-1); // Volver al curso
            } else {
                alert("Error al enviar: " + data.message);
            }
        } catch (error) {
            console.error("Error enviando examen:", error);
            alert("Hubo un error de conexión al enviar el examen.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Cargando examen...</div>;
    if (!exam) return <div className="error-state">No se encontró la información del examen.</div>;

    return (
        <div className="taking-exam-container">
            <div className="exam-header-card">
                <h1 className="exam-title">{exam.TITULO}</h1>
                <div className="exam-meta">
                    <span className="exam-timer"><FaClock /> {exam.DURACION_MINUTOS} minutos</span>
                    <span>Total de preguntas: {questions.length}</span>
                </div>
            </div>

            <div className="questions-container">
                {questions.map((q, idx) => (
                    <div key={q.SECUENCIAL} className="question-card">
                        <div className="question-enunciado">
                            {idx + 1}. {q.ENUNCIADO}
                            <span style={{ float: 'right', fontSize: '0.8rem', color: '#94a3b8' }}>({q.PUNTAJE} pts)</span>
                        </div>
                        <div className="options-list">
                            {q.opciones?.map(opt => (
                                <div
                                    key={opt.SECUENCIAL}
                                    className={`option-item ${respuestas[q.SECUENCIAL] === opt.SECUENCIAL ? 'selected' : ''}`}
                                    onClick={() => handleSelectOption(q.SECUENCIAL, opt.SECUENCIAL)}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${q.SECUENCIAL}`}
                                        className="option-radio"
                                        checked={respuestas[q.SECUENCIAL] === opt.SECUENCIAL}
                                        readOnly
                                    />
                                    <span>{opt.TEXTO_OPCION}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="exam-actions">
                <button className="submit-exam-btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Finalizar y Enviar Examen'} <FaCheckCircle />
                </button>
            </div>
        </div>
    );
};

export default TakingExam;
