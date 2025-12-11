import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

const CoursesContext = createContext();

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses debe usarse dentro de CoursesProvider');
  }
  return context;
};

export const CoursesProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responsableFilter, setResponsableFilter] = useState(null);

  useEffect(() => {
    // Leer usuario guardado para decidir el alcance inicial de la carga
    const storedUserRaw = localStorage.getItem('user');
    if (storedUserRaw) {
      try {
        const storedUser = JSON.parse(storedUserRaw);
        const isResponsable = storedUser?.codigoRol === 'RES' || storedUser?.CODIGOROL === 'RES';
        const responsableId = storedUser?.id || storedUser?.SECUENCIAL;

        if (isResponsable && responsableId) {
          fetchCourses(responsableId);
          return;
        }
      } catch (e) {
        console.warn('No se pudo parsear usuario en localStorage:', e);
      }
    }

    // Por defecto, cargar todos los eventos
    fetchCourses();
  }, []);

  const mapCodigoToType = (codigo) => {
    const tipos = {
      'CUR': 'Curso',
      'TALL': 'Taller',
      'SEM': 'Seminario',
      'CONF': 'Conferencia'
    };
    return tipos[codigo] || 'Curso';
  };

  const mapCodigoToModalidad = (codigo) => {
    const modalidades = {
      'PRES': 'Presencial',
      'VIRT': 'Virtual',
      'HIB': 'Híbrido'
    };
    return modalidades[codigo] || 'Presencial';
  };

 const fetchCourses = async (responsableId) => {
  try {
    setLoading(true);
    const targetId = responsableId ?? responsableFilter;
    setResponsableFilter(targetId ?? null);

    const endpoint = targetId
      ? `${API_URL}/api/eventos/responsable/${targetId}`
      : `${API_URL}/api/eventos`;

    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar eventos');
    }

    const eventos = data.data || [];

    const mappedCourses = eventos.map(evento => {
      let contenidoData = {
        topics: []
      };

      if (evento.CONTENIDO) {
        const contenido = evento.CONTENIDO.trim();
        
        if (contenido.startsWith('{') && contenido.endsWith('}')) {
          try {
            const parsed = JSON.parse(contenido);
            
            // Extract topics
            let topicsParsed = [];
            if (parsed.topics) {
              if (Array.isArray(parsed.topics)) {
                topicsParsed = parsed.topics;
              } else if (typeof parsed.topics === 'string') {
                try {
                    const t = JSON.parse(parsed.topics);
                    if (Array.isArray(t)) topicsParsed = t;
                } catch {}
              }
            }

            contenidoData = {
              topics: topicsParsed,
              modules: parsed.modules || [] // Extract modules
            };
          } catch (e) {
            console.warn(`⚠️ Error parseando CONTENIDO del evento ${evento.SECUENCIAL}`);
          }
        }
      }

      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const carreras = Array.isArray(evento.CARRERAS) 
        ? evento.CARRERAS.map(c => c.SECUENCIAL)
        : [];

      return {
        id: evento.SECUENCIAL,
        title: evento.TITULO,
        description: evento.DESCRIPCION || 'Sin descripción',
        imageUrl: evento.URL_IMAGEN 
          ? evento.URL_IMAGEN  // Ya viene con URL completa del backend
          : '/placeholder-course.jpg',
        price: parseFloat(evento.COSTO) || 0,
        rating: 3,
        meta: {
          type: mapCodigoToType(evento.CODIGOTIPOEVENTO),
          attendanceRequired: evento.ASISTENCIAMINIMA || '',
          passingGrade: evento.NOTAAPROBACION || null,
          capacity: evento.CAPACIDAD || '',
          hours: evento.HORAS || '',
          modality: mapCodigoToModalidad(evento.CODIGOMODALIDAD),
          isPaid: evento.ES_PAGADO === 1,
          docente: evento.Docente || '', // ✅ DOCENTE
          objective: evento.DESCRIPCION || '',
          topics: contenidoData.topics,
          modules: contenidoData.modules, // Pass modules
          startDate: formatDate(evento.FECHAINICIO),
          endDate: formatDate(evento.FECHAFIN),
          carreras: carreras
        },
        // Top level fields needed by Modal
        CODIGOTIPOEVENTO: evento.CODIGOTIPOEVENTO,
        NOMBRE_TIPO_EVENTO: evento.NOMBRE_TIPO_EVENTO,
        CONTENIDO: evento.CONTENIDO, // Pass raw content for Modal parsing if needed
        categoryId: evento.SECUENCIALCATEGORIA, // Alias for consistencym
        REQUISITOS: evento.REQUISITOS || [], // Pass Requirements properly
        ESTADO: evento.ESTADO, // ✅ Pass ESTADO explicitly
        NOMBRE_DOCENTE: evento.NOMBRE_DOCENTE,
        PROMEDIO_GENERAL: evento.PROMEDIO_GENERAL
      };
    });

    const uniqueCourses = [];
    const seenIds = new Set();
    
    for (const course of mappedCourses) {
      if (!seenIds.has(course.id)) {
        uniqueCourses.push(course);
        seenIds.add(course.id);
      }
    }

    setCourses(uniqueCourses);
    setError(null);
  } catch (err) {
    console.error('Error al cargar eventos:', err);
    setError(err.message);
    setCourses([]);
  } finally {
    setLoading(false);
  }
};

  const addCourse = async (newCourse) => {
    try {
      const formData = new FormData();
      formData.append('title', newCourse.title);
      formData.append('type', newCourse.type);
      formData.append('capacity', newCourse.capacity || '');
      formData.append('hours', newCourse.hours || '');
      formData.append('modality', newCourse.modality || '');
      formData.append('cost', newCourse.cost || 0);
      formData.append('career', newCourse.career || '');
      formData.append('teacher', newCourse.teacher || '');
      formData.append('objective', newCourse.objective || '');
      
      // Nuevos campos
      if (newCourse.categoriaId) formData.append('categoriaId', newCourse.categoriaId);
      if (newCourse.docente) formData.append('docente', newCourse.docente);
      
      const requirements = newCourse.requirements || [];
      formData.append('requirements', JSON.stringify(requirements));

      // Agregar responsableId si está presente
      if (newCourse.responsableId) {
        formData.append('responsableId', newCourse.responsableId);
      }
      
      const topicsArray = Array.isArray(newCourse.topics) 
        ? newCourse.topics.filter(t => t && t.trim())
        : [];
      formData.append('topics', JSON.stringify(topicsArray));
      
      if (newCourse.imageFile) {
        formData.append('image', newCourse.imageFile);
      }

      const response = await fetch(`${API_URL}/api/eventos`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear evento');
      }

      await fetchCourses();
      return data;
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  };


  
const updateCourse = async (id, updatedData) => {
  try {
    const formData = new FormData();
    
    // Attempt to get current responsable ID to preserve ownership
    const storedUserRaw = localStorage.getItem('user');
    let currentResponsableId = null;
    if (storedUserRaw) {
        try {
            const storedUser = JSON.parse(storedUserRaw);
            // Only use if role is RESPONSABLE or ADMIN?
            // Actually, if I am the one updating, I must be the one responsible or admin.
            // If I am admin, I might be editing someone else's course?
            // If I am admin, `currentResponsableId` would be me. If I assign it to me, I might steal it from the original responsible?
            // Ideally, we should only re-send `responsableId` if it was intended to be changed OR if we want to preserve it.
            // But the backend `DELETE`s it unconditionally.
            // If I am Admin editing, `updatedData` might not have `responsableId`.
            // If I don't send it, it's deleted.
            // The logic in backend is flawed: "If responsableId provided -> Insert. Else -> Do nothing (just delete)".
            // So if I am Admin and I edit an event but don't select a responsible, the event becomes "orphan" (no responsible).
            // That might be intended behavior for Admin?
            // But for "Responsable" user, they definitely want to keep it.
            
            // Let's use `updatedData.responsableId` if present.
            // If NOT present, and I am a Responsable (not Admin), I should append myself.
            // If I am Admin, and I don't send it, it implies orphan/unchanged? NO, backend deletes it.
            // So Admin MUST send it if they want to keep it.
            
            // Safer fix: Backend should NOT delete if `responsableId` is undefined.
            // But I cannot easily change backend logic that might be relied upon (clearing responsible).
            // However, the user is a "Responsable" (context is `EventoResponsable`).
            // So for this user, we must send their ID.
            
            if (storedUser?.codigoRol === 'RES' || storedUser?.CODIGOROL === 'RES') {
                currentResponsableId = storedUser?.id || storedUser?.SECUENCIAL;
            }
        } catch {}
    }

    if (updatedData.responsableId || currentResponsableId) {
        formData.append('responsableId', updatedData.responsableId || currentResponsableId);
    }
    
    formData.append('title', updatedData.title);
    formData.append('type', updatedData.meta?.type || 'Curso');
    formData.append('description', updatedData.description || '');
    formData.append('attendanceRequired', updatedData.meta?.attendanceRequired || '');
    formData.append('passingGrade', updatedData.meta?.passingGrade || '');
    formData.append('capacity', updatedData.meta?.capacity || '');
    formData.append('hours', updatedData.meta?.hours || '');
    formData.append('modality', updatedData.meta?.modality || '');
    formData.append('cost', updatedData.price || 0);
    formData.append('isPaid', updatedData.meta?.isPaid ? '1' : '0');
    formData.append('docente', updatedData.meta?.docente || ''); 
    formData.append('objective', updatedData.meta?.objective || '');
    formData.append('startDate', updatedData.meta?.startDate || '');
    formData.append('endDate', updatedData.meta?.endDate || '');



    // Pass Modules
    if (updatedData.modules) {
        formData.append('modules', JSON.stringify(updatedData.modules));
    }

    // Pass Codigo Tipo Evento
    if (updatedData.meta?.codigoTipoEvento) {
        formData.append('codigoTipoEvento', updatedData.meta.codigoTipoEvento);
    }
    
    // Nuevos campos update
    if (updatedData.categoriaId) formData.append('categoriaId', updatedData.categoriaId);
    
    const requirements = updatedData.requirements || updatedData.meta?.requirements || [];
    formData.append('requirements', JSON.stringify(requirements));
    
    const carrerasArray = Array.isArray(updatedData.meta?.carreras) 
      ? updatedData.meta.carreras
      : [];
    formData.append('carreras', JSON.stringify(carrerasArray));
    
    const topicsArray = Array.isArray(updatedData.meta?.topics) 
      ? updatedData.meta.topics.filter(t => t && t.trim())
      : [];
    formData.append('topics', JSON.stringify(topicsArray));

    if (updatedData.imageFile) {
      formData.append('image', updatedData.imageFile);
    }

    const response = await fetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar evento');
    }

    await fetchCourses(currentResponsableId);
    return data;
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    throw error;
  }
};
  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/eventos/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar evento');
      }

      setCourses(courses.filter(course => course.id !== id));
      return data;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  };

  const value = {
    courses,
    loading,
    error,
    addCourse,
    deleteCourse,
    updateCourse,
    fetchCourses
  };

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
};