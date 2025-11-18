import React, { useState, useEffect } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import './EventoResponsable.css';

// Este modal ahora funciona como editor (modo edición).
// Props:
// - isOpen: boolean
// - onClose: fn
// - course: objeto del curso a editar
const NewEventModal = ({ isOpen, onClose, course }) => {
  const { updateCourse } = useCourses();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Curso');
  const [attendanceRequired, setAttendanceRequired] = useState('');
  const [passingGrade, setPassingGrade] = useState('');
  const [capacity, setCapacity] = useState('');
  const [hours, setHours] = useState('');
  const [modality, setModality] = useState('');
  const [cost, setCost] = useState('');
  const [career, setCareer] = useState('');
  const [teacher, setTeacher] = useState('');
  const [objective, setObjective] = useState('');
  const [topics, setTopics] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setType((course.meta && course.meta.type) || 'Curso');
      setAttendanceRequired((course.meta && course.meta.attendanceRequired) || '');
      setPassingGrade((course.meta && course.meta.passingGrade) || '');
      setCapacity((course.meta && course.meta.capacity) || '');
      setHours((course.meta && course.meta.hours) || '');
      setModality((course.meta && course.meta.modality) || '');
      setCost(course.price != null ? String(course.price) : '');
      setCareer((course.meta && course.meta.career) || '');
      setTeacher((course.meta && course.meta.teacher) || '');
      setObjective((course.meta && course.meta.objective) || '');
      setTopics((course.meta && course.meta.topics) || ['']);
      setError(null);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleTopicChange = (index, value) => {
    setTopics((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addTopic = () => setTopics((prev) => [...prev, '']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('El nombre del evento es obligatorio');

    const updated = {
      title: title.trim(),
      description: objective || course.description || '',
      imageUrl: course.imageUrl || '',
      price: cost ? Number(cost) : course.price || 0,
      meta: {
        type,
        attendanceRequired,
        passingGrade: passingGrade ? Number(passingGrade) : (course.meta && course.meta.passingGrade) || null,
        capacity,
        hours,
        modality,
        career,
        teacher,
        objective,
          topics: topics.filter((t) => t && t.trim()),
      },
    };

    try {
      setSaving(true);
      await updateCourse(course.id, updated);
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError('Error guardando cambios. Intente de nuevo.');
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal edit-modal" role="dialog" aria-modal="true" aria-label="Editar Evento" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3 className="modal-title">EDITAR</h3>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-left">
            <div className="two-col-grid">
              <label>
                Nombre del evento:
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del evento" />
              </label>

              <label>
                Tipo de evento:
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Curso</option>
                  <option>Taller</option>
                  <option>Seminario</option>
                  <option>Conferencia</option>
                </select>
              </label>
            </div>

            <div className="two-col-grid">
              <label>
                Asistencia de aprobación:
                <input value={attendanceRequired} onChange={(e) => setAttendanceRequired(e.target.value)} placeholder="70%" />
              </label>

              <label>
                Nota de aprobación:
                <input value={passingGrade} onChange={(e) => setPassingGrade(e.target.value)} placeholder="7.00" />
              </label>
            </div>

            <div className="two-col-grid">
              <label>
                Capacidad máxima:
                <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacidad máxima" />
              </label>
              <label>
                Número de horas:
                <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Horas" />
              </label>
            </div>

            <div className="two-col-grid">
              <label>
                Modalidad:
                <input value={modality} onChange={(e) => setModality(e.target.value)} placeholder="Presencial / Online" />
              </label>
              <label>
                Costo:
                <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Costo" />
              </label>
            </div>

            <div className="two-col-grid">
              <label>
                Carrera:
                <input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Carrera" />
              </label>
              <label>
                Docente:
                <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Docente" />
              </label>
            </div>

            <label>
              Objetivo:
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objetivo" />
            </label>

            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <div style={{flex:1}}>
                <label>Temas:</label>
                <div style={{display: 'flex', gap: 8}}>
                  {topics.slice(0,3).map((t, i) => (
                    <input key={i} value={t} onChange={(e) => handleTopicChange(i, e.target.value)} placeholder={`Tema ${i+1}`} />
                  ))}
                </div>
              </div>
              <button type="button" className="btn-select" onClick={addTopic} title="Agregar tema">+</button>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal;
