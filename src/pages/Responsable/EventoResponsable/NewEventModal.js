  import React, { useState, useEffect } from 'react';
  import { useCourses } from '../../../context/CoursesContext';
  import './EventoResponsable.css';

  const NewEventModal = ({ isOpen, onClose, course }) => {
    const { updateCourse } = useCourses();
    
    // Estados del formulario
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Curso');
    const [attendanceRequired, setAttendanceRequired] = useState('');
    const [passingGrade, setPassingGrade] = useState('');
    const [capacity, setCapacity] = useState('');
    const [hours, setHours] = useState('');
    const [modality, setModality] = useState('Presencial');
    const [cost, setCost] = useState('');
    const [docente, setDocente] = useState(''); // ✅ CAMPO SIMPLE
    const [objective, setObjective] = useState('');
    const [topics, setTopics] = useState(['']);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Estados para carreras
    const [carrerasDisponibles, setCarrerasDisponibles] = useState([]);
    const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState([]);
    const [buscarCarrera, setBuscarCarrera] = useState('');
    
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    // ✅ Detectar cambios sin guardar
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    // Cargar carreras
    useEffect(() => {
      const fetchCarreras = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/carreras');
          const data = await response.json();
          if (data.success) {
            setCarrerasDisponibles(data.data);
          }
        } catch (err) {
          console.error('Error cargando carreras:', err);
        }
      };

      fetchCarreras();
    }, []);

    // Cargar datos del curso
    useEffect(() => {
      if (course) {
        const data = {
          title: course.title || '',
          type: course.meta?.type || 'Curso',
          attendanceRequired: course.meta?.attendanceRequired || '',
          passingGrade: course.meta?.passingGrade || '',
          capacity: course.meta?.capacity || '',
          hours: course.meta?.hours || '',
          modality: course.meta?.modality || 'Presencial',
          cost: course.price != null ? String(course.price) : '',
          docente: course.meta?.docente || '',
          objective: course.meta?.objective || '',
          startDate: course.meta?.startDate || '',
          endDate: course.meta?.endDate || '',
          carreras: course.meta?.carreras || [],
          topics: (course.meta?.topics && course.meta.topics.length > 0) ? course.meta.topics : ['']
        };

        setTitle(data.title);
        setType(data.type);
        setAttendanceRequired(data.attendanceRequired);
        setPassingGrade(data.passingGrade);
        setCapacity(data.capacity);
        setHours(data.hours);
        setModality(data.modality);
        setCost(data.cost);
        setDocente(data.docente);
        setObjective(data.objective);
        setStartDate(data.startDate);
        setEndDate(data.endDate);
        setCarrerasSeleccionadas(data.carreras);
        setTopics(data.topics);
        setImagePreview(course.imageUrl || '');
        setImageFile(null);
        setError(null);
        setHasChanges(false);
        
        setOriginalData(data);
      }
    }, [course]);

    // Detectar cambios
    useEffect(() => {
      if (originalData) {
        const changed = 
          title !== originalData.title ||
          type !== originalData.type ||
          attendanceRequired !== originalData.attendanceRequired ||
          passingGrade !== originalData.passingGrade ||
          capacity !== originalData.capacity ||
          hours !== originalData.hours ||
          modality !== originalData.modality ||
          cost !== originalData.cost ||
          docente !== originalData.docente ||
          objective !== originalData.objective ||
          startDate !== originalData.startDate ||
          endDate !== originalData.endDate ||
          JSON.stringify(carrerasSeleccionadas) !== JSON.stringify(originalData.carreras) ||
          JSON.stringify(topics) !== JSON.stringify(originalData.topics) ||
          imageFile !== null;
        
        setHasChanges(changed);
      }
    }, [title, type, attendanceRequired, passingGrade, capacity, hours, modality, cost, 
        docente, objective, startDate, endDate, carrerasSeleccionadas, topics, imageFile, originalData]);

    if (!isOpen || !course) return null;

    // Confirmar antes de cerrar si hay cambios
    const handleClose = () => {
      if (hasChanges) {
        if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?')) {
          onClose();
        }
      } else {
        onClose();
      }
    };

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleTopicChange = (index, value) => {
      setTopics((prev) => {
        const copy = [...prev];
        copy[index] = value;
        return copy;
      });
    };

    const addTopic = () => setTopics((prev) => [...prev, '']);

    const removeTopic = (index) => {
      if (topics.length > 1) {
        setTopics((prev) => prev.filter((_, i) => i !== index));
      }
    };

    // Manejar selección de carreras con checkboxes
    const toggleCarrera = (carreraId) => {
      setCarrerasSeleccionadas(prev => {
        if (prev.includes(carreraId)) {
          return prev.filter(id => id !== carreraId);
        } else {
          return [...prev, carreraId];
        }
      });
    };

    // Filtrar carreras
    const carrerasFiltradas = carrerasDisponibles.filter(carrera =>
      carrera.NOMBRE_CARRERA.toLowerCase().includes(buscarCarrera.toLowerCase())
    );

    // Agrupar carreras por facultad
    const carrerasPorFacultad = carrerasFiltradas.reduce((acc, carrera) => {
      const facultad = carrera.NOMBRE_FACULTAD || 'Sin Facultad';
      if (!acc[facultad]) {
        acc[facultad] = [];
      }
      acc[facultad].push(carrera);
      return acc;
    }, {});

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      
      if (!title.trim()) {
        return setError('El nombre del evento es obligatorio');
      }

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return setError('La fecha de inicio no puede ser posterior a la fecha de fin');
      }

      const updated = {
        title: title.trim(),
        description: objective || '',
        price: cost ? Number(cost) : 0,
        imageFile: imageFile,
        meta: {
          type,
          attendanceRequired,
          passingGrade: passingGrade ? Number(passingGrade) : null,
          capacity,
          hours,
          modality,
          docente,
          objective,
          topics: topics.filter((t) => t && t.trim()),
          isPaid: cost && Number(cost) > 0,
          startDate,
          endDate,
          carreras: carrerasSeleccionadas
        },
      };

      try {
        setSaving(true);
        await updateCourse(course.id, updated);
        setSaving(false);
        setHasChanges(false);
        onClose();
      } catch (err) {
        console.error(err);
        setSaving(false);
        setError(err.message || 'Error guardando cambios. Intente de nuevo.');
      }
    };

    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div 
          className="modal edit-modal" 
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          <button className="modal-close" onClick={handleClose}>×</button>
          <h3 className="modal-title">
            EDITAR EVENTO
            {hasChanges && <span style={{color: '#ff9800', fontSize: '14px', marginLeft: '10px'}}>● Sin guardar</span>}
          </h3>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-content">
              {/* Imagen */}
              <div className="form-group">
                <label>Imagen del evento:</label>
                {imagePreview && (
                  <div style={{ marginBottom: '10px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }} 
                    />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>

              {/* Nombre y Tipo */}
              <div className="two-col-grid">
                <div className="form-group">
                  <label>Nombre del evento: *</label>
                  <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Nombre del evento" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de evento: *</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Curso</option>
                    <option>Taller</option>
                    <option>Seminario</option>
                    <option>Conferencia</option>
                  </select>
                </div>
              </div>

              {/* Fechas */}
              <div className="two-col-grid">
                <div className="form-group">
                  <label>Fecha de inicio:</label>
                  <input 
                    type="date"
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de fin:</label>
                  <input 
                    type="date"
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              </div>

              {/* Asistencia y Nota */}
              <div className="two-col-grid">
                <div className="form-group">
                  <label>Asistencia de aprobación (%):</label>
                  <input 
                    type="number"
                    value={attendanceRequired} 
                    onChange={(e) => setAttendanceRequired(e.target.value)} 
                    placeholder="70" 
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Nota de aprobación:</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={passingGrade} 
                    onChange={(e) => setPassingGrade(e.target.value)} 
                    placeholder="7.00" 
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              {/* Capacidad y Horas */}
              <div className="two-col-grid">
                <div className="form-group">
                  <label>Capacidad máxima:</label>
                  <input 
                    type="number"
                    value={capacity} 
                    onChange={(e) => setCapacity(e.target.value)} 
                    placeholder="30" 
                  />
                </div>
                
                <div className="form-group">
                  <label>Número de horas:</label>
                  <input 
                    type="number"
                    value={hours} 
                    onChange={(e) => setHours(e.target.value)} 
                    placeholder="40" 
                  />
                </div>
              </div>

              {/* Modalidad y Costo */}
              <div className="two-col-grid">
                <div className="form-group">
                  <label>Modalidad:</label>
                  <select value={modality} onChange={(e) => setModality(e.target.value)}>
                    <option>Presencial</option>
                    <option>Virtual</option>
                    <option>Híbrido</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Costo ($):</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={cost} 
                    onChange={(e) => setCost(e.target.value)} 
                    placeholder="0.00" 
                    min="0"
                  />
                </div>
              </div>

              {/* ✅ DOCENTE - Campo simple */}
              <div className="form-group">
                <label>Docente:</label>
                <input 
                  value={docente} 
                  onChange={(e) => setDocente(e.target.value)} 
                  placeholder="Nombre del docente" 
                />
              </div>

              {/* ✅ CARRERAS CON CHECKBOXES */}
              {/* ✅ CARRERAS CON CHECKBOXES - VERSIÓN CORREGIDA */}
<div className="form-group" style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
    Carreras 
    <span style={{ 
      display: 'inline-block',
      marginLeft: '8px',
      padding: '2px 8px',
      background: '#2196F3',
      color: 'white',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700'
    }}>
      {carrerasSeleccionadas.length}
    </span>
  </label>
  
  {/* Buscador */}
  <input 
    type="text"
    placeholder="🔍 Buscar carrera..."
    value={buscarCarrera}
    onChange={(e) => setBuscarCarrera(e.target.value)}
    style={{ 
      width: '100%',
      padding: '10px 12px',
      marginBottom: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s'
    }}
    onFocus={(e) => e.target.style.borderColor = '#2196F3'}
    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
  />

  {/* Contenedor de checkboxes */}
  <div style={{ 
    maxHeight: '280px', 
    overflowY: 'auto', 
    border: '2px solid #e0e0e0', 
    borderRadius: '6px',
    padding: '10px',
    background: 'white',
    boxSizing: 'border-box'
  }}>
    {Object.keys(carrerasPorFacultad).sort().map(facultad => (
      <div key={facultad} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
        {/* Título de facultad */}
        <div style={{ 
          fontWeight: '700', 
          color: '#2196F3', 
          marginBottom: '8px',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '6px 8px',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
          borderRadius: '4px',
          borderLeft: '3px solid #2196F3'
        }}>
          {facultad}
        </div>
        
        {/* Lista de carreras */}
        {carrerasPorFacultad[facultad].map(carrera => {
          const isSelected = carrerasSeleccionadas.includes(carrera.SECUENCIAL);
          return (
            <label 
              key={carrera.SECUENCIAL}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                marginBottom: '2px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                background: isSelected ? '#e3f2fd' : 'transparent',
                border: '1px solid transparent',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#f5f5f5';
                }
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isSelected ? '#e3f2fd' : 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <input 
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCarrera(carrera.SECUENCIAL)}
                style={{ 
                  margin: 0,
                  marginRight: '10px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#2196F3',
                  flexShrink: 0
                }}
              />
              <span style={{ 
                fontSize: '13px',
                color: '#333',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {carrera.NOMBRE_CARRERA}
              </span>
            </label>
          );
        })}
      </div>
    ))}
    
    {/* Estado vacío */}
    {Object.keys(carrerasPorFacultad).length === 0 && (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        color: '#999',
        fontSize: '14px'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
        No se encontraron carreras
      </div>
    )}
  </div>
</div>

              {/* Objetivo */}
              <div className="form-group">
                <label>Objetivo:</label>
                <textarea 
                  value={objective} 
                  onChange={(e) => setObjective(e.target.value)} 
                  placeholder="Describe el objetivo del evento" 
                  rows="3"
                />
              </div>

              {/* Temas */}
              <div className="form-group">
                <label>Temas:</label>
                {Array.isArray(topics) && topics.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      value={t} 
                      onChange={(e) => handleTopicChange(i, e.target.value)} 
                      placeholder={`Tema ${i + 1}`}
                      style={{ flex: 1 }}
                    />
                    {topics.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-danger" 
                        onClick={() => removeTopic(i)}
                        style={{ padding: '8px 12px' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={addTopic}
                  style={{ marginTop: '8px' }}
                >
                  + Agregar tema
                </button>
              </div>

              {error && (
                <div style={{ 
                  color: 'red', 
                  padding: '10px', 
                  backgroundColor: '#ffe6e6',
                  borderRadius: '4px',
                  marginTop: '10px'
                }}>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios ●' : 'Guardar'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default NewEventModal;