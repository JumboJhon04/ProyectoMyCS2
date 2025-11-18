// src/pages/User/Profesor/ProfesorCourseDetail/ProfesorCourseDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBook, FaUsers, FaChartBar, FaUserGraduate, FaCheckCircle, FaEye, FaPlus, FaPencilAlt } from 'react-icons/fa';
import './ProfesorCourseDetail.css';

// --- Datos Mock del Curso (Adaptados de los mockups) ---
const mockCourseData = {
  id: 1,
  title: "Curso Base de Datos",
  description: "Curso de programación en Python",
  tags: ["Programacion", "Intermedio"],
  teacher: { name: "Tamara Mendez", initials: "TM" },
  totalLessons: 20,
  totalStudents: 32,
  imageUrl: 'https://via.placeholder.com/1200x300/1E90FF/FFFFFF?text=DATABASE+BANNER', // Placeholder para la imagen de encabezado
  modules: [
    { id: 1, title: 'Introducción', description: 'Introducción a Base de Datos', status: 'completed', type: 'lesson' },
    { id: 2, title: 'Tablas', description: 'Definición de tablas', status: 'completed', type: 'lesson' },
    { id: 3, title: 'Consultas SQL', description: 'Sentencias SELECT, INSERT, UPDATE, DELETE', status: 'in-progress', type: 'lesson' },
    { id: 4, title: 'Normalización', description: 'Reglas de normalización de bases de datos', status: 'locked', type: 'lesson' },
    { id: 5, title: 'Optimización', description: 'Técnicas de optimización de consultas', status: 'locked', type: 'lesson' },
  ],
};

const ProfesorCourseDetail = () => {
  const { courseId } = useParams(); // Usar si se integra con rutas reales
  const navigate = useNavigate();
  const course = mockCourseData; 
  
  if (!course) {
    return (
        <div className="course-detail-container">
            <div className="error-message">
                <p>Curso no encontrado</p>
                <button onClick={() => navigate('/profesor/modules')}>Volver a Módulos</button>
            </div>
        </div>
    );
  }

  return (
    <div className="professor-course-detail-page">
      {/* 1. Sección de Encabezado (Imagen, Tags, Título) */}
      <div 
        className="course-detail-header-profesor" 
        style={{ backgroundImage: `url(${course.imageUrl})` }}
      >
        <div className="header-overlay-profesor">
            <div className="course-tags-profesor">
                <span className="tag-profesor">{course.tags[0]}</span>
                <span className={`tag-profesor level-${course.tags[1].toLowerCase()}`}>{course.tags[1]}</span>
            </div>

            <h1 className="course-detail-title-profesor">{course.title}</h1>
            <p className="course-detail-description-profesor">{course.description}</p>
            
            <div className="teacher-info-profesor">
                <span className="teacher-initials-profesor">{course.teacher.initials}</span>
                <span className="teacher-name-profesor">Ing. {course.teacher.name}</span>
            </div>
        </div>
      </div>

      {/* 2. Contenido Principal */}
      <div className="course-detail-content-profesor">
        
        {/* 2a. Resumen de Estadísticas (Total de lecciones / Total de estudiantes) */}
        <div className="course-summary-stats-profesor">
            <div className="stat-item-profesor">
                <FaBook className="stat-icon-profesor" />
                <span>Total de lecciones</span>
                <strong>{course.totalLessons}</strong>
            </div>
            <div className="stat-item-profesor">
                <FaUserGraduate className="stat-icon-profesor" />
                <span>Total de estudiantes</span>
                <strong>{course.totalStudents}</strong>
            </div>
            {/* Se puede agregar más aquí, como progreso total, etc. */}
            <div className="stat-item-profesor">
                <FaChartBar className="stat-icon-profesor" />
                <span>Pruebas Activas</span>
                <strong>2</strong>
            </div>
        </div>

        {/* 2b. Navegación por Pestañas (Material, Alumnos, Reportes) */}
        <div className="course-tabs-profesor">
          <button className="tab-button-profesor active"><FaBook /> Material</button>
          <button className="tab-button-profesor"><FaUsers /> Alumnos</button>
          <button className="tab-button-profesor"><FaChartBar /> Reportes</button>
          <button className="tab-button-profesor create-button"><FaPlus /> Crear Lección</button>
        </div>

        {/* 2c. Lista de Módulos/Lecciones */}
        <div className="course-modules-list-profesor">
          {course.modules.map((module) => (
            <div 
              key={module.id} 
              className={`lesson-item-profesor ${module.status}`}
            >
              <div className="lesson-status-icon-profesor">
                <FaCheckCircle className="status-check" />
              </div>

              <div className="lesson-content-profesor">
                <h4 className="lesson-title-profesor">{module.title}</h4>
                <p className="lesson-description-profesor">{module.description}</p>
              </div>

              {/* Acciones para el Profesor */}
              <div className="lesson-actions-profesor">
                <button className="action-btn-profesor edit-button-profesor">
                    <FaEye /> Ver Material
                </button>
                <button className="action-btn-profesor edit-button-profesor">
                    <FaPencilAlt /> Editar
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfesorCourseDetail;