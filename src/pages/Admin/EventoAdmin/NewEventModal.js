import React, { useState, useEffect } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import API_URL from '../../../config/api';
import './EventoAdmin.css';

const NewEventModal = ({ isOpen, onClose }) => {
  const { addCourse } = useCourses();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Curso');
  const [responsableId, setResponsableId] = useState('');
  const [imageFile, setImageFile] = useState(null); // Archivo real
  const [imagePreview, setImagePreview] = useState(null); // Solo preview
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para responsables
  const [responsables, setResponsables] = useState([]);
  const [loadingResponsables, setLoadingResponsables] = useState(false);
  const [tiposEvento, setTiposEvento] = useState([]); // Types for dropdown

  // Cargar responsables cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarResponsables();
    }
  }, [isOpen]);

  const cargarResponsables = async () => {
    setLoadingResponsables(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/responsables`);
      const data = await response.json();
      if (data.success) {
        setResponsables(data.data);
      }
    } catch (err) {
      console.error('Error cargando responsables:', err);
    } finally {
      setLoadingResponsables(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetch(`${API_URL}/api/eventos/tipos`)
            .then(res => res.json())
            .then(data => { if(data.success) setTiposEvento(data.data); })
            .catch(err => console.error('Error loading types', err));
    }
  }, [isOpen]);

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

    const newCourse = {
      title: title.trim(),
      type, // This now holds the CODIGO (e.g. 'CUR')
      responsableId: responsableId || null,
      imageFile // Pasar el archivo real, NO el base64
    };

    try {
      setSaving(true);
      await addCourse(newCourse);
      setSaving(false);
      
      // Limpiar formulario y cerrar
      setTitle('');
      setTitle('');
      setType('CUR'); // Default match
      setResponsableId('');
      setResponsableId('');
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
                      {tiposEvento.length > 0 ? (
                        tiposEvento.map(t => <option key={t.CODIGO} value={t.CODIGO}>{t.NOMBRE}</option>)
                      ) : (
                        <>
                          {/* Fallback if DB types fail to load */}
                          <option value="CUR">Curso</option>
                          <option value="TALL">Taller</option>
                          <option value="SEM">Seminario</option>
                          <option value="CONF">Conferencia</option>
                        </>
                      )}
                    </select>
                  </label>
            </div>

            <label>
              Responsable del curso
              <select 
                value={responsableId} 
                onChange={(e) => setResponsableId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', width: '100%' }}
              >
                <option value="">-- Seleccione un responsable --</option>
                {loadingResponsables ? (
                  <option disabled>Cargando responsables...</option>
                ) : (
                  responsables.map(resp => (
                    <option key={resp.id} value={resp.id}>
                      {resp.NOMBRES} {resp.APELLIDOS} ({resp.CORREO})
                    </option>
                  ))
                )}
              </select>
            </label>

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