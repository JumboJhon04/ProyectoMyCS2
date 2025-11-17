import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../../../../context/CoursesContext';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const navigate = useNavigate();

  // Encontrar el curso
  const course = courses.find(c => c.id === parseInt(courseId));

  // Mock de lecciones del curso
  const lessons = [
    {
      id: 1,
      title: 'Variables',
      description: 'Uso y definición de variables',
      status: 'completed',
      type: 'lesson'
    },
    {
      id: 2,
      title: 'Parámetros',
      description: 'Uso y definición de variables',
      status: 'in-progress',
      type: 'lesson'
    },
    {
      id: 3,
      title: 'Funciones',
      description: 'Creación y uso de funciones',
      status: 'locked',
      type: 'lesson'
    },
    {
      id: 4,
      title: 'Clases',
      description: 'Programación orientada a objetos',
      status: 'locked',
      type: 'lesson'
    },
    {
      id: 5,
      title: 'Módulos',
      description: 'Importación y exportación',
      status: 'locked',
      type: 'lesson'
    }
  ];

  if (!course) {
    return (
      <div className="course-detail-container">
        <div className="error-message">
          <p>Curso no encontrado</p>
          <button onClick={() => navigate('/user/events')}>Volver a Mis Cursos</button>
        </div>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === 'completed').length;
  const totalLessons = lessons.length;
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="course-detail-container">
      {/* Header del Curso */}
      <div className="course-detail-header">
        <div className="course-header-content">
          {/* Información izquierda */}
          <div className="course-header-left">
            <div className="course-tags">
              <span className="tag">Programación</span>
              <span className="tag">Intermedio</span>
            </div>

            <h1 className="course-detail-title">{course.title}</h1>
            <p className="course-detail-description">{course.description}</p>

            <div className="course-meta-info">
              <div className="meta-item">
                <span className="meta-badge">TM</span>
                <span className="meta-text">Ing. Tamara Mendez</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span className="meta-text">{totalLessons} estudiantes</span>
              </div>
            </div>
          </div>

          {/* Logo del curso */}
          <div className="course-header-right">
            <div className="course-logo-circle">
              <img 
                src={course.imageUrl || 'https://via.placeholder.com/200'} 
                alt={course.title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
              />
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="course-progress-section">
          <div className="progress-header">
            <h3>Progreso</h3>
            <span className="progress-text">{completedLessons} de {totalLessons} lecciones completadas</span>
          </div>
          <div className="progress-bar-large">
            <div 
              className="progress-bar-fill-large" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sección de Lecciones */}
      <div className="course-lessons-section">
        <div className="lessons-header">
          <div className="lessons-count-box">
            <span className="lessons-icon">📚</span>
            <div>
              <div className="lessons-count-label">Total de lecciones</div>
              <div className="lessons-count-number">{totalLessons}</div>
            </div>
          </div>
        </div>

        {/* Lista de Lecciones */}
        <div className="lessons-list">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className={`lesson-item ${lesson.status}`}
            >
              <div className="lesson-status-icon">
                {lesson.status === 'completed' && <span className="status-check">✓</span>}
                {lesson.status === 'in-progress' && <span className="status-progress">⟳</span>}
                {lesson.status === 'locked' && <span className="status-lock">🔒</span>}
              </div>

              <div className="lesson-content">
                <div className="lesson-header-row">
                  <h4 className="lesson-title">{lesson.title}</h4>
                  {lesson.status === 'completed' && (
                    <span className="lesson-badge completed-badge">Completa</span>
                  )}
                  {lesson.status === 'in-progress' && (
                    <span className="lesson-badge progress-badge">Iniciar</span>
                  )}
                </div>
                <p className="lesson-description">{lesson.description}</p>
              </div>

              <button 
                className="lesson-action-btn"
                disabled={lesson.status === 'locked'}
              >
                <span className="action-icon">👁</span>
                Ver
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;