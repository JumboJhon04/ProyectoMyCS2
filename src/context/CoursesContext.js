import React, { createContext, useContext, useEffect, useState } from "react";

const CoursesContext = createContext(null);

export const CoursesProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mockMode, setMockMode] = useState(true); // Cambiar a false cuando tengas backend

  // Datos mock para desarrollo sin backend
  const MOCK_COURSES = [
    {
      id: 1,
      title: "Curso de Python",
      description: "Comprender los principios y fundamentos de python",
      imageUrl: "https://via.placeholder.com/200/FFDD00/000000?text=Python",
      price: 50.5,
      rating: 3,
    },
    {
      id: 2,
      title: "Curso de Java",
      description: "Comprender los principios y fundamentos de Java",
      imageUrl: "https://via.placeholder.com/200/FF0000/FFFFFF?text=Java",
      price: 45.5,
      rating: 3,
    },
    {
      id: 3,
      title: "Curso de JavaScript",
      description: "Comprender los principios y fundamentos de python",
      imageUrl: "https://via.placeholder.com/200/F0DB4F/000000?text=JS",
      price: 28.3,
      rating: 3,
    },
    {
      id: 4,
      title: "Curso de HTML",
      description: "Comprender los principios y fundamentos de python",
      imageUrl: "https://via.placeholder.com/200/E34C26/FFFFFF?text=HTML",
      price: 45.5,
      rating: 3,
    },
    {
      id: 5,
      title: "Curso de PHP",
      description: "Comprender los principios y fundamentos de python",
      imageUrl: "https://via.placeholder.com/200/777BB4/FFFFFF?text=PHP",
      price: 45.5,
      rating: 3,
    },
    {
      id: 6,
      title: "Curso de TypeScript",
      description: "Comprender los principios y fundamentos de python",
      imageUrl: "https://via.placeholder.com/200/3178C6/FFFFFF?text=TS",
      price: 28.3,
      rating: 3,
    },
  ];

  useEffect(() => {
    loadCourses();
  }, [mockMode]);

  const loadCourses = async () => {
    if (mockMode) {
      // Modo mock: usar datos locales
      setCourses(MOCK_COURSES);
      setError(null);
      return;
    }

    // Modo API: cargar desde backend
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error("Error al cargar cursos");
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando cursos desde API:", err);
      setError("No se pudieron cargar los cursos desde el backend.");
      // Fallback automático a mock
      setCourses(MOCK_COURSES);
      setMockMode(true);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (newCourse) => {
    if (mockMode) {
      // Modo mock: añadir localmente
      const course = { id: Date.now(), ...newCourse };
      setCourses((prev) => [...prev, course]);
      return course;
    }

    // Modo API: enviar al backend
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      if (!response.ok) throw new Error("Error al crear curso");
      const course = await response.json();
      setCourses((prev) => [...prev, course]);
      return course;
    } catch (err) {
      console.error("Error creando curso:", err);
      throw err;
    }
  };

  const updateCourse = async (id, updatedData) => {
    if (mockMode) {
      // Modo mock: actualizar localmente
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
      );
      return { id, ...updatedData };
    }

    // Modo API: enviar al backend
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error("Error al actualizar curso");
      const course = await response.json();
      setCourses((prev) => prev.map((c) => (c.id === id ? course : c)));
      return course;
    } catch (err) {
      console.error("Error actualizando curso:", err);
      throw err;
    }
  };

  const deleteCourse = async (id) => {
    if (mockMode) {
      // Modo mock: eliminar localmente
      setCourses((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    // Modo API: enviar al backend
    const previousCourses = [...courses];
    setCourses((prev) => prev.filter((c) => c.id !== id)); // Optimistic UI

    try {
      const response = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar curso");
    } catch (err) {
      console.error("Error eliminando curso:", err);
      setCourses(previousCourses); // Rollback
      throw err;
    }
  };

  const toggleMockMode = () => {
    setMockMode((prev) => !prev);
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        loading,
        error,
        mockMode,
        loadCourses,
        addCourse,
        updateCourse,
        deleteCourse,
        toggleMockMode,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => useContext(CoursesContext);
