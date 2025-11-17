import React, { useState } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import './EventoAdmin.css';

const NewEventModal = ({ isOpen, onClose }) => {
  const { addCourse } = useCourses();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Curso');
  const [attendanceRequired, setAttendanceRequired] = useState('');
  const [passingGrade, setPassingGrade] = useState('');
  const [imageFile, setImageFile] = useState(null); // Archivo real
  const [imagePreview, setImagePreview] = useState(null); // Solo preview
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    // Guardar el archivo real
    setImageFile(f);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) return setError('El nombre del evento es obligatorio');
    if (!type) return setError('Seleccione un tipo de evento');
    if (!imageFile) return setError('Debe seleccionar una imagen');
    if (passingGrade && isNaN(Number(passingGrade))) {
      return setError('La nota de aprobación debe ser un número');
    }

    const newCourse = {
      title: title.trim(),
      type,
      attendanceRequired,
      passingGrade: passingGrade ? Number(passingGrade) : null,
      imageFile // Pasar el archivo real, NO el base64
    };

    try {
      setSaving(true);
      await addCourse(newCourse);
      setSaving(false);
      
      // Limpiar formulario y cerrar
      setTitle('');
      setType('Curso');
      setAttendanceRequired('');
      setPassingGrade('');
      setImageFile(null);
      setImagePreview(null);
      
      onClose();
      alert('Evento creado exitosamente');
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError(err.message || 'Error creando el evento. Intente de nuevo.');
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
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Nombre del evento" 
                  required
                />
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
                <input 
                  value={attendanceRequired} 
                  onChange={(e) => setAttendanceRequired(e.target.value)} 
                  placeholder="% o condiciones" 
                />
              </label>

              <label>
                Nota de aprobación
                <input 
                  value={passingGrade} 
                  onChange={(e) => setPassingGrade(e.target.value)} 
                  placeholder="Ej. 60" 
                />
              </label>
            </div>

            {error && <div className="form-error" style={{color: 'red', marginTop: '10px'}}>{error}</div>}
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
            <input 
              type="file" 
              accept="image/*" 
              id="course-image" 
              style={{display: 'none'}} 
              onChange={handleImageChange} 
            />
            <label htmlFor="course-image" className="btn-select">Seleccionar imagen</label>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Agregar evento'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal;