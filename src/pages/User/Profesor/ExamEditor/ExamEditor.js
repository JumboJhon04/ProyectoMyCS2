import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaSave, FaCheckCircle } from 'react-icons/fa';
import API_URL from '../../../../config/api'; // <--- RUTA CORREGIDA (4 niveles atrás)
import './ExamEditor.css'; 

const ExamEditor = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para la NUEVA PREGUNTA que se está escribiendo
  const [questionText, setQuestionText] = useState('');
  const [questionScore, setQuestionScore] = useState(1);
  const [options, setOptions] = useState([
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false } // Mínimo 2 opciones por defecto
  ]);

  // Lista de preguntas ya guardadas (visualización)
  const [savedQuestions, setSavedQuestions] = useState([]);

  // 1. Cargar información del Examen
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`${API_URL}/api/evaluaciones/${examId}`);
        const data = await res.json();
        if (data.success) {
            setExamInfo(data.data);
            if(data.data.preguntas) setSavedQuestions(data.data.preguntas);
        }
      } catch (error) {
        console.error("Error cargando examen:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // --- MANEJO DE OPCIONES ---
  const handleOptionChange = (index, value) => {
      const newOptions = [...options];
      newOptions[index].texto = value;
      setOptions(newOptions);
  };

  const handleCorrectSelect = (index) => {
      const newOptions = options.map((opt, i) => ({
          ...opt,
          esCorrecta: i === index // Solo una puede ser correcta
      }));
      setOptions(newOptions);
  };

  const addOptionField = () => {
      setOptions([...options, { texto: '', esCorrecta: false }]);
  };

  const removeOptionField = (index) => {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
  };

  // --- GUARDAR PREGUNTA ---
  const handleSaveQuestion = async () => {
      // Validaciones
      if (!questionText.trim()) return alert("Escribe el enunciado de la pregunta.");
      if (options.some(opt => !opt.texto.trim())) return alert("Completa el texto de todas las opciones.");
      if (!options.some(opt => opt.esCorrecta)) return alert("Debes marcar cuál es la respuesta correcta.");

      try {
          const payload = {
              evaluacionId: examId,
              enunciado: questionText,
              puntaje: questionScore,
              opciones: options
          };

          const res = await fetch(`${API_URL}/api/evaluaciones/pregunta`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.success) {
              alert("Pregunta guardada");
              // Limpiar formulario
              setQuestionText('');
              setQuestionScore(1);
              setOptions([{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }]);
              // Recargar preguntas
              window.location.reload(); // O hacer un fetch de nuevo
          } else {
              alert("Error: " + data.message);
          }
      } catch (error) {
          console.error("Error guardando pregunta:", error);
      }
  };

  if (loading) return <div className="loading-state">Cargando editor...</div>;
  if (!examInfo) return <div className="error-state">Examen no encontrado</div>;

  return (
    <div className="exam-editor-container">
      {/* HEADER */}
      <div className="editor-header">
          <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /> Volver</button>
          <div>
              <h1>Editando: {examInfo.TITULO}</h1>
              <p className="subtitle">Duración: {examInfo.DURACION_MINUTOS} mins | Preguntas actuales: {savedQuestions.length}</p>
          </div>
      </div>

      <div className="editor-layout">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="editor-form-card">
              <h3><FaPlus /> Nueva Pregunta</h3>
              
              <div className="form-group">
                  <label>Enunciado de la pregunta</label>
                  <textarea 
                    rows="3" 
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ej: ¿Cuál es la capital de Francia?"
                  />
              </div>

              <div className="form-group">
                  <label>Puntaje</label>
                  <input 
                    type="number" 
                    value={questionScore}
                    onChange={(e) => setQuestionScore(e.target.value)}
                    min="0.5" step="0.5"
                    style={{width: '80px'}}
                  />
              </div>

              <div className="options-section">
                  <label>Opciones de respuesta (Marca la correcta)</label>
                  {options.map((opt, index) => (
                      <div key={index} className="option-row">
                          <input 
                            type="radio" 
                            name="correctOption" 
                            checked={opt.esCorrecta}
                            onChange={() => handleCorrectSelect(index)}
                          />
                          <input 
                            type="text" 
                            value={opt.texto} 
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Opción ${index + 1}`}
                            className={opt.esCorrecta ? 'input-correct' : ''}
                          />
                          {options.length > 2 && (
                              <button onClick={() => removeOptionField(index)} className="delete-opt-btn"><FaTrash /></button>
                          )}
                      </div>
                  ))}
                  <button onClick={addOptionField} className="add-opt-btn">+ Agregar Opción</button>
              </div>

              <div className="form-actions">
                  <button className="save-question-btn" onClick={handleSaveQuestion}>
                      <FaSave /> Guardar Pregunta
                  </button>
              </div>
          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA */}
          <div className="questions-preview-list">
              <h3>Preguntas Guardadas</h3>
              {savedQuestions.length === 0 ? (
                  <p className="empty-msg">No has agregado preguntas todavía.</p>
              ) : (
                  savedQuestions.map((q, idx) => (
                      <div key={q.SECUENCIAL} className="preview-card">
                          <div className="preview-header">
                              <strong>{idx + 1}. {q.ENUNCIADO}</strong>
                              <span className="badge-score">{q.PUNTAJE} pts</span>
                          </div>
                          <ul className="preview-options">
                              {q.opciones && q.opciones.map(opt => (
                                  <li key={opt.SECUENCIAL} className={opt.ES_CORRECTA ? 'correct' : ''}>
                                      {opt.TEXTO_OPCION} {opt.ES_CORRECTA && <FaCheckCircle />}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))
              )}
          </div>

      </div>
    </div>
  );
};

export default ExamEditor;