import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
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

 const fetchCourses = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:5000/api/eventos');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar eventos');
    }

    const mappedCourses = data.data.map(evento => {
      let contenidoData = {
        topics: []
      };

      if (evento.CONTENIDO) {
        const contenido = evento.CONTENIDO.trim();
        
        if (contenido.startsWith('{') && contenido.endsWith('}')) {
          try {
            const parsed = JSON.parse(contenido);
            
            let topicsParsed = [];
            if (parsed.topics) {
              if (Array.isArray(parsed.topics)) {
                topicsParsed = parsed.topics;
              } else if (typeof parsed.topics === 'string') {
                try {
                  topicsParsed = JSON.parse(parsed.topics);
                  if (!Array.isArray(topicsParsed)) {
                    topicsParsed = [];
                  }
                } catch {
                  topicsParsed = [];
                }
              }
            }

            contenidoData = {
              topics: topicsParsed
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
          ? `http://localhost:5000/${evento.URL_IMAGEN}`
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
          startDate: formatDate(evento.FECHAINICIO),
          endDate: formatDate(evento.FECHAFIN),
          carreras: carreras
        }
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
      formData.append('attendanceRequired', newCourse.attendanceRequired || '');
      formData.append('passingGrade', newCourse.passingGrade || '');
      formData.append('capacity', newCourse.capacity || '');
      formData.append('hours', newCourse.hours || '');
      formData.append('modality', newCourse.modality || '');
      formData.append('cost', newCourse.cost || 0);
      formData.append('career', newCourse.career || '');
      formData.append('teacher', newCourse.teacher || '');
      formData.append('objective', newCourse.objective || '');
      
      const topicsArray = Array.isArray(newCourse.topics) 
        ? newCourse.topics.filter(t => t && t.trim())
        : [];
      formData.append('topics', JSON.stringify(topicsArray));
      
      if (newCourse.imageFile) {
        formData.append('image', newCourse.imageFile);
      }

      const response = await fetch('http://localhost:5000/api/eventos', {
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
    formData.append('docente', updatedData.meta?.docente || ''); // ✅ DOCENTE
    formData.append('objective', updatedData.meta?.objective || '');
    formData.append('startDate', updatedData.meta?.startDate || '');
    formData.append('endDate', updatedData.meta?.endDate || '');
    
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

    const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
      method: 'PUT',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar evento');
    }

    await fetchCourses();
    return data;
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    throw error;
  }
};
  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
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