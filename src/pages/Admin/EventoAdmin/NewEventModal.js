import React, { useState } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import './EventoAdmin.css';

const NewEventModal = ({ isOpen, onClose }) => {
  const { addCourse } = useCourses();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Curso');
  const [attendanceRequired, setAttendanceRequired] = useState('');
  const [passingGrade, setPassingGrade] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('El nombre del evento es obligatorio');
    if (!type) return setError('Seleccione un tipo de evento');
    // passingGrade can be empty, but if present ensure numeric
    if (passingGrade && isNaN(Number(passingGrade))) return setError('La nota de aprobación debe ser un número');

    const newCourse = {
      title: title.trim(),
      description: `Tipo: ${type}`,
      imageUrl: imagePreview || '',
      price: 0,
      rating: 0,
      meta: {
        type,
        attendanceRequired,
        passingGrade: passingGrade ? Number(passingGrade) : null,
      },
    };

    try {
      setSaving(true);
      await addCourse(newCourse);
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError('Error creando el evento. Intente de nuevo.');
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Nuevo Evento" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3 className="modal-title">Nuevo Evento</h3>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-left">
            <h4 className="section-title">Detalles de evento</h4>

            <div className="two-col-grid">
              <label>
                Nombre del evento
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del evento" />
              </label>

              <label>
                Tipo de evento
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
                Asistencia de aprobación
                <input value={attendanceRequired} onChange={(e) => setAttendanceRequired(e.target.value)} placeholder="% o condiciones" />
              </label>

              <label>
                Nota de aprobación
                <input value={passingGrade} onChange={(e) => setPassingGrade(e.target.value)} placeholder="Ej. 60" />
              </label>
            </div>

          
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-right">
            <h4 className="section-title">Imagen del curso</h4>
            <div className="image-preview-box">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <div className="image-placeholder">Imagen del curso</div>
              )}
            </div>
            <input type="file" accept="image/*" id="course-image" style={{display: 'none'}} onChange={handleImageChange} />
            <label htmlFor="course-image" className="btn-select">Seleccionar imagen</label>
          </div>

          {/* Actions span full width under both columns */}
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Agregar evento'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal;
