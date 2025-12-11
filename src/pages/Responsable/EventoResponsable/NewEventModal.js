  import React, { useState, useEffect } from 'react';
  import { useCourses } from '../../../context/CoursesContext';
  import './EventoResponsable.css';

  import API_URL from '../../../config/api';

  const NewEventModal = ({ isOpen, onClose, course }) => {
    const { updateCourse } = useCourses();
    
    // Estados del formulario
    const [title, setTitle] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [attendanceRequired, setAttendanceRequired] = useState('');
    const [passingGrade, setPassingGrade] = useState('');
    const [capacity, setCapacity] = useState('');
    const [hours, setHours] = useState('');
    const [modality, setModality] = useState('Presencial');
    const [cost, setCost] = useState('');
    const [docente, setDocente] = useState(''); 
    const [objective, setObjective] = useState('');
    const [modules, setModules] = useState([]); // New Modules support
    const [tiposEvento, setTiposEvento] = useState([]); // Event Types from DB
    
    // Searchable Docente State
    const [docenteSearch, setDocenteSearch] = useState('');

    
    // Requirements Logic
    const [allRequirements, setAllRequirements] = useState([]); // From API
    const [selectedRequirements, setSelectedRequirements] = useState([]); // User selection
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Estados de datos externos
    const [carrerasDisponibles, setCarrerasDisponibles] = useState([]);
    const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [docentes, setDocentes] = useState([]);
    
    // Buscador y UI
    const [buscarCarrera, setBuscarCarrera] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); 
    
    // ✅ Detectar cambios sin guardar
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
      const fetchData = async () => {
        try {
          const [carrerasRes, categoriasRes, docentesRes, requisitosRes] = await Promise.all([
            fetch(`${API_URL}/api/carreras`),
            fetch(`${API_URL}/api/eventos/categorias`),
            fetch(`${API_URL}/api/users/docentes`),
            fetch(`${API_URL}/api/requisitos/tipos`) // Fetch types
          ]);

          const carrerasData = await carrerasRes.json();
          const categoriasData = await categoriasRes.json();
          const docentesData = await docentesRes.json();
          const requisitosData = await requisitosRes.json();
          
          try {
            const tiposRes = await fetch(`${API_URL}/api/eventos/tipos`);
            const tiposData = await tiposRes.json();
            if (tiposData.success) setTiposEvento(tiposData.data);
          } catch (e) { console.error('Error loading types', e); }

          if (carrerasData.success) setCarrerasDisponibles(carrerasData.data);
          if (categoriasData.success) setCategorias(categoriasData.data);
          if (docentesData.success) setDocentes(docentesData.data);
          if (requisitosData.success) setAllRequirements(requisitosData.data);
        } catch (err) {
          console.error('Error cargando datos:', err);
        }
      };

      fetchData();
    }, []);

    // Cargar datos del curso a editar
    useEffect(() => {
      if (course) {
        console.log('📝 MODAL RECEIVED COURSE:', course);
        console.log('✅ REQUISITOS:', course.REQUISITOS);
        
        let parsedContent = {};
        try {
          const rawContent = course.CONTENIDO || course.content;
          parsedContent = typeof rawContent === 'string' ? JSON.parse(rawContent) : (rawContent || {});
        } catch (e) {
          console.warn('Error parsing content JSON', e);
        }

        // Process requirements: prefers REQUISITOS array from DB, fallback to content JSON
        let reqs = [];
        if (course.REQUISITOS && Array.isArray(course.REQUISITOS)) {
            reqs = course.REQUISITOS.map(r => ({
                description: r.DESCRIPCION,
                required: r.ES_OBLIGATORIO === 1
            }));
        } else if (parsedContent.requirements) {
            // Legacy/Fallback parsing
             if (Array.isArray(parsedContent.requirements)) reqs = parsedContent.requirements;
             else if (typeof parsedContent.requirements === 'string') reqs = [{ description: parsedContent.requirements, required: true }];
        }

        const data = {
          title: course.title || '',
          categoriaId: course.categoryId || course.SECUENCIALCATEGORIA || '', 
          attendanceRequired: course.meta?.attendanceRequired || course.ASISTENCIAMINIMA || '',
          passingGrade: course.meta?.passingGrade || course.NOTAAPROBACION || '',
          capacity: course.meta?.capacity || course.CAPACIDAD || '',
          hours: course.meta?.hours || course.HORAS || '',
          modality: course.meta?.modality || course.CODIGOMODALIDAD || 'Presencial',
          cost: course.price != null ? String(course.price) : (course.COSTO != null ? String(course.COSTO) : ''),
          docente: course.meta?.docente || course.teacherId || course.Docente || '', 
          objective: course.description || course.DESCRIPCION || '',
          startDate: (course.meta?.startDate || course.startDate || course.FECHAINICIO || '').split('T')[0],
          endDate: (course.meta?.endDate || course.endDate || course.FECHAFIN || '').split('T')[0],
          carreras: course.meta?.carreras || [],

          // Load modules if present, else migrate topics to a "General" module or empty
          modules: (parsedContent.modules && parsedContent.modules.length > 0) 
            ? parsedContent.modules 
            : (parsedContent.topics && parsedContent.topics.length > 0 
                ? [{ name: 'General', topics: parsedContent.topics }] 
                : [{ name: '', topics: [] }]),
          codeType: course.CODIGOTIPOEVENTO, // Store the code (e.g. 'CUR')
          requirements: reqs
        };

        // Si categoriaId viene vacío, tratar de mapear
        if (!data.categoriaId && course.meta?.type && categorias.length > 0) {
           const found = categorias.find(c => c.NOMBRE.toLowerCase().includes(course.meta.type.toLowerCase()));
           if (found) data.categoriaId = found.SECUENCIAL;
        }

        setTitle(data.title);
        setCategoriaId(data.categoriaId);
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

        setModules(data.modules);

        setSelectedRequirements(data.requirements);
        
        setImagePreview(course.imageUrl || course.URL_IMAGEN || '');
        setImageFile(null);
        setError(null);
        setHasChanges(false);
        setActiveTab('general');
        
        setOriginalData(data);
      }
    }, [course, categorias]); 

    // Sync Docente Search Input
    useEffect(() => {
        if (docente && docentes.length > 0) {
            const d = docentes.find(doc => doc.id == docente);
            if (d) setDocenteSearch(`${d.NOMBRES} ${d.APELLIDOS} (${d.CORREO})`);
        }
    }, [docente, docentes]); 

    // Detectar cambios
    useEffect(() => {
      if (originalData) {
        const changed = 
          title !== originalData.title ||
          String(categoriaId) !== String(originalData.categoriaId) ||
          String(attendanceRequired) !== String(originalData.attendanceRequired) ||
          String(passingGrade) !== String(originalData.passingGrade) ||
          String(capacity) !== String(originalData.capacity) ||
          String(hours) !== String(originalData.hours) ||
          modality !== originalData.modality ||
          String(cost) !== String(originalData.cost) ||
          String(docente) !== String(originalData.docente) ||
          objective !== originalData.objective ||
          startDate !== originalData.startDate ||
          endDate !== originalData.endDate ||
          JSON.stringify(selectedRequirements) !== JSON.stringify(originalData.requirements) ||
          JSON.stringify(carrerasSeleccionadas.sort()) !== JSON.stringify(originalData.carreras.sort()) ||
          JSON.stringify(carrerasSeleccionadas.sort()) !== JSON.stringify(originalData.carreras.sort()) ||
          JSON.stringify(modules) !== JSON.stringify(originalData.modules) ||
          imageFile !== null;
        
        setHasChanges(changed);
      }
    }, [title, categoriaId, attendanceRequired, passingGrade, capacity, hours, modality, cost, 
        docente, objective, startDate, endDate, carrerasSeleccionadas, modules, selectedRequirements, imageFile, originalData]);

    if (!isOpen || !course) return null;

    const selectedCategory = categorias.find(c => String(c.SECUENCIAL) === String(categoriaId));
    const isAcademic = selectedCategory ? selectedCategory.NOMBRE.toLowerCase().includes('curso') : false;
    const showAttendance = true; 

    const handleClose = () => {
      if (hasChanges && !saving) {
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

    // Module Management
    const addModule = () => setModules([...modules, { name: '', topics: [] }]);
    const removeModule = (idx) => setModules(modules.filter((_, i) => i !== idx));
    const updateModuleName = (idx, name) => {
      const newModules = [...modules];
      newModules[idx].name = name;
      setModules(newModules);
    };
    
    // Topic inside Module
    const addTopicToModule = (moduleIdx) => {
      const newModules = [...modules];
      if (!newModules[moduleIdx].topics) newModules[moduleIdx].topics = [];
      newModules[moduleIdx].topics.push('');
      setModules(newModules);
    };
    const removeTopicFromModule = (moduleIdx, topicIdx) => {
      const newModules = [...modules];
      newModules[moduleIdx].topics = newModules[moduleIdx].topics.filter((_, i) => i !== topicIdx);
      setModules(newModules);
    };
    const updateTopicInModule = (moduleIdx, topicIdx, val) => {
      const newModules = [...modules];
      newModules[moduleIdx].topics[topicIdx] = val;
      setModules(newModules);
    };

    const toggleCarrera = (carreraId) => {
      setCarrerasSeleccionadas(prev => {
        if (prev.includes(carreraId)) return prev.filter(id => id !== carreraId);
        else return [...prev, carreraId];
      });
    };
    
    // Toggle requirements logic
    const toggleRequirement = (reqName) => {
        setSelectedRequirements(prev => {
            const exists = prev.find(r => r.description === reqName);
            if (exists) {
                return prev.filter(r => r.description !== reqName);
            } else {
                return [...prev, { description: reqName, required: true }];
            }
        });
    };

    const carrerasFiltradas = carrerasDisponibles.filter(carrera =>
      carrera.NOMBRE_CARRERA.toLowerCase().includes(buscarCarrera.toLowerCase())
    );

    const carrerasPorFacultad = carrerasFiltradas.reduce((acc, carrera) => {
      const facultad = carrera.NOMBRE_FACULTAD || 'Sin Facultad';
      if (!acc[facultad]) acc[facultad] = [];
      acc[facultad].push(carrera);
      return acc;
    }, {});

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      if(!title.trim()) return setError('El nombre del evento es obligatorio');
      // Removed category validation as requested
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return setError('La fecha de inicio no puede ser posterior a la fecha de fin');
      }
      
      const updated = {
        title: title.trim(),
        description: objective || '',
        price: cost ? Number(cost) : 0,
        imageFile: imageFile,
        meta: {
          // Send specific type code. If editing, preserve existing. If new, default to CUR (or handle selection if added)
          codigoTipoEvento: course ? course.CODIGOTIPOEVENTO : 'CUR',
          type: selectedCategory?.NOMBRE || 'Curso', // Legacy fallback
          categoriaId: categoriaId,
          attendanceRequired,
          passingGrade: passingGrade ? Number(passingGrade) : null,
          capacity,
          hours,
          modality,
          docente: docente, 
          objective,
          requirements: selectedRequirements, // Send array of objects
          modules: modules, // Send Modules structure
          isPaid: cost && Number(cost) > 0,
          startDate,
          endDate,
          carreras: carrerasSeleccionadas
        },
        // Campos directos
        categoriaId,
        categoriaId,
        requirements: selectedRequirements,
        modules: modules // Pass modules at top level for context
      };

      try {
        setSaving(true);
        await updateCourse(course.id, updated); // context method
        setSaving(false);
        setHasChanges(false);
        onClose();
      } catch (err) {
        console.error(err);
        setSaving(false);
        setError(err.message || 'Error guardando cambios.');
      }
    };

    const renderTabs = () => (
      <div className="modal-tabs">
        <button type="button" className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
        <button type="button" className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Detalles</button>
        <button type="button" className={`tab-btn ${activeTab === 'target' ? 'active' : ''}`} onClick={() => setActiveTab('target')}>Acceso y Público</button>
      </div>
    );

    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div 
          className="modal edit-modal" 
          onClick={(e) => e.stopPropagation()}
          style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <button className="modal-close" onClick={handleClose}>×</button>
          <h3 className="modal-title">EDITAR EVENTO {hasChanges && <span className="unsaved-badge">● Sin guardar</span>}</h3>
          
          <form className="modal-form" onSubmit={handleSubmit}>
            {renderTabs()}
            <div className="modal-content" style={{ marginTop: '20px' }}>
              
              {/* TAB GENERAL */}
              {activeTab === 'general' && (
                <>
                  <div className="two-col-grid">
                     <div className="form-group">
                      <label>Imagen:</label>
                      <div className="image-preview-container">
                        {imagePreview ? <img src={imagePreview} alt="Preview" /> : <div className="placeholder-image">Sin imagen</div>}
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{marginTop: '15px'}}>Nombre:</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} required />
                      
                      {course ? (
                        <div style={{marginTop: '15px'}}>
                           <label>Tipo de Evento:</label>
                           <input 
                             value={course.NOMBRE_TIPO_EVENTO || tiposEvento.find(t => t.CODIGO === course.CODIGOTIPOEVENTO)?.NOMBRE || course.CODIGOTIPOEVENTO || 'Desconocido'} 
                             readOnly 
                             disabled 
                             style={{background: '#f0f0f0', color: '#666', cursor: 'not-allowed'}}
                           />
                        </div>
                      ) : (
                        <>
                          <label style={{marginTop: '15px'}}>Categoría:</label>
                          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                            <option value="">Seleccione...</option>
                            {categorias.map(cat => <option key={cat.SECUENCIAL} value={cat.SECUENCIAL}>{cat.NOMBRE}</option>)}
                          </select>
                        </>
                      )}

                      {selectedCategory && !course && (
                        <small style={{display:'block', marginTop:'5px', color:'#666'}}>
                          {selectedCategory.DESCRIPCION}
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Objetivo:</label>
                    <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows="3" placeholder="Describe de qué trata el evento..." />
                  </div>
                  <div className="form-group">
                    <label>Módulos y Temas:</label>
                    <div className="modules-container">
                      {modules.map((mod, mIdx) => (
                        <div key={mIdx} className="module-box">
                           <div className="module-header">
                             <input 
                                placeholder="Nombre del Módulo (Ej. Introducción)" 
                                value={mod.name} 
                                onChange={(e) => updateModuleName(mIdx, e.target.value)}
                                className="module-title-input"
                             />
                             <button type="button" className="btn-icon danger" onClick={() => removeModule(mIdx)} title="Eliminar Módulo">🗑️</button>
                           </div>
                           
                           <div className="topics-list">
                              {mod.topics && mod.topics.map((t, tIdx) => (
                                <div key={tIdx} className="topic-row">
                                  <input 
                                    value={t} 
                                    onChange={(e) => updateTopicInModule(mIdx, tIdx, e.target.value)} 
                                    placeholder={`Tema ${tIdx + 1}`} 
                                  />
                                  <button type="button" className="btn-icon danger" onClick={() => removeTopicFromModule(mIdx, tIdx)}>×</button>
                                </div>
                              ))}
                              <button type="button" className="btn-text" onClick={() => addTopicToModule(mIdx)}>+ Agregar Tema</button>
                           </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn-secondary" style={{marginTop:'10px', width:'100%'}} onClick={addModule}>+ Agregar Nuevo Módulo</button>
                  </div>
                </>
              )}

              {/* TAB DETAILS */}
              {activeTab === 'details' && (
                <>
                  <div className="section-title">Información del Docente</div>
                  <div className="form-group">
                    <label>Docente (Estudiante):</label>
                    <input 
                        list="docentes-list"
                        type="text" 
                        placeholder="Buscar estudiante..." 
                        value={docenteSearch}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDocenteSearch(val);
                            const match = docentes.find(d => `${d.NOMBRES} ${d.APELLIDOS} (${d.CORREO})` === val);
                            if (match) setDocente(match.id);
                            else setDocente('');
                        }}
                    />
                    <datalist id="docentes-list">
                        {docentes.map(d => (
                            <option key={d.id} value={`${d.NOMBRES} ${d.APELLIDOS} (${d.CORREO})`} />
                        ))}
                    </datalist>
                  </div>
                  <div className="section-title">Logística</div>
                  <div className="two-col-grid">
                    <div className="form-group"><label>Inicio:</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            max={endDate}
                            onChange={(e) => {
                                const newStart = e.target.value;
                                setStartDate(newStart);
                                if (endDate && newStart > endDate) {
                                    setEndDate(newStart); // Auto-correct EndDate
                                }
                            }} 
                        />
                    </div>
                    <div className="form-group"><label>Fin:</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            min={startDate}
                            onChange={(e) => {
                                const newEnd = e.target.value;
                                setEndDate(newEnd);
                                if (startDate && newEnd < startDate) {
                                    setStartDate(newEnd); // Auto-correct StartDate
                                }
                            }} 
                        />
                    </div>
                  </div>
                  <div className="two-col-grid">
                    <div className="form-group"><label>Modalidad:</label>
                      <select value={modality} onChange={(e) => setModality(e.target.value)}>
                        <option>Presencial</option><option>Virtual</option><option>Híbrido</option>
                      </select>
                    </div>
                    <div className="form-group">
                        <label>Horas / Capacidad:</label>
                        <div className="flex-gap">
                             <input type="number" min="0" placeholder="Horas" value={hours} onChange={(e)=>setHours(Math.max(0, e.target.value))} title="Duración en horas"/>
                             <input type="number" min="0" placeholder="Cap." value={capacity} onChange={(e)=>setCapacity(Math.max(0, e.target.value))} title="Capacidad Máxima"/>
                        </div>
                    </div>
                  </div>
                  {isAcademic && (
                    <>
                      <div className="section-title">Requisitos de Aprobación</div>
                      <div className="two-col-grid">
                        <div className="form-group"><label>Nota Min (0-10):</label><input type="number" step="0.1" min="0" max="10" value={passingGrade} onChange={(e)=>setPassingGrade(e.target.value)}/></div>
                        <div className="form-group"><label>Asistencia (%):</label><input type="number" min="0" max="100" value={attendanceRequired} onChange={(e)=>setAttendanceRequired(e.target.value)}/></div>
                      </div>
                    </>
                  )}
                  {!isAcademic && showAttendance && (
                     <div className="form-group">
                        <label>Asistencia Mínima (%):</label>
                        <input 
                          type="number" min="0" max="100"
                          value={attendanceRequired} onChange={(e) => setAttendanceRequired(e.target.value)} 
                        />
                     </div>
                  )}
                </>
              )}

              {/* TAB ACCESS */}
              {activeTab === 'target' && (
                <>
                  <div className="form-group">
                    <label>Requisitos (Seleccionables):</label>
                    <div className="requirements-list">
                        {allRequirements.filter(req => {
                            const allowed = [
                                "cedula o pasaporte", "cédula o pasaporte",
                                "titulo de tercer nivel", "título de tercer nivel",
                                "comprobante de pago",
                                "carta de motivacion", "carta de motivación",
                                "certificado de votacion", "certificado de votación"
                            ];
                            return allowed.includes(req.nombre.toLowerCase());
                        }).map(reqType => {
                            const isSelected = selectedRequirements.some(r => r.description === reqType.nombre);
                            return (
                                <label key={reqType.id} className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected} 
                                        onChange={() => toggleRequirement(reqType.nombre)}
                                    />
                                    <span>{reqType.nombre}</span>
                                </label>
                            );
                        })}

                        {allRequirements.length === 0 && <span className="empty-msg">Cargando o sin requisitos...</span>}
                    </div>
                  </div>

                  <div className="form-group">
                     <label>Costo ($):</label>
                     <input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00 (Gratis)"/>
                  </div>

                  <div className="form-group career-selector">
                    <label>Carreras (Público Objetivo):</label>
                    <input type="text" placeholder="🔍 Buscar carrera..." value={buscarCarrera} onChange={(e) => setBuscarCarrera(e.target.value)} className="search-input"/>
                    <div className="careers-list">
                      {Object.keys(carrerasPorFacultad).map(facultad => (
                        <div key={facultad} className="faculty-group">
                          <div className="faculty-name">{facultad}</div>
                          {carrerasPorFacultad[facultad].map(c => (
                            <label key={c.SECUENCIAL} className="career-item">
                              <input type="checkbox" checked={carrerasSeleccionadas.includes(c.SECUENCIAL)} onChange={() => toggleCarrera(c.SECUENCIAL)} />
                              <span>{c.NOMBRE_CARRERA}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {error && <div className="error-msg">{error}</div>}
            </div>
            
            <div className="modal-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Guardar'}</button>
              <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
 
  export default NewEventModal;