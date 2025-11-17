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

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchCourses();
  }, []);

  // Función para obtener todos los eventos
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/eventos');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar eventos');
      }

      // Mapear los datos de la BD al formato que usa el frontend
      const mappedCourses = data.data.map(evento => ({
        id: evento.SECUENCIAL,
        title: evento.TITULO,
        description: evento.DESCRIPCION || 'Sin descripción',
        imageUrl: evento.URL_IMAGEN 
          ? `http://localhost:5000/${evento.URL_IMAGEN}`
          : '/placeholder-course.jpg',
        price: parseFloat(evento.COSTO) || 0,
        rating: 3, // Por defecto, puedes cambiarlo según tu lógica
        meta: {
          type: mapCodigoToType(evento.CODIGOTIPOEVENTO),
          attendanceRequired: evento.ASISTENCIAMINIMA || '',
          passingGrade: evento.NOTAAPROBACION || null,
          isPaid: evento.ES_PAGADO === 1
        }
      }));

      setCourses(mappedCourses);
      setError(null);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Mapear código de tipo a nombre
  const mapCodigoToType = (codigo) => {
    const tipos = {
      'CUR': 'Curso',
      'TALL': 'Taller',
      'SEM': 'Seminario',
      'CONF': 'Conferencia'
    };
    return tipos[codigo] || 'Curso';
  };

  // Función para agregar un nuevo evento
  const addCourse = async (newCourse) => {
    try {
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('title', newCourse.title);
      formData.append('type', newCourse.type);
      formData.append('attendanceRequired', newCourse.attendanceRequired || '');
      formData.append('passingGrade', newCourse.passingGrade || '');
      
      // Agregar la imagen
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

      // Recargar la lista de eventos después de crear uno nuevo
      await fetchCourses();
      
      return data;
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  };

  // Función para eliminar un evento (opcional)
  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar evento');
      }

      // Actualizar el estado local
      setCourses(courses.filter(course => course.id !== id));
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  };

  // Función para actualizar un evento (opcional)
  const updateCourse = async (id, updatedData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar evento');
      }

      // Recargar eventos
      await fetchCourses();
    } catch (error) {
      console.error('Error al actualizar evento:', error);
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
    fetchCourses // Para recargar manualmente si es necesario
  };

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
};