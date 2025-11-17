import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../../../../context/CoursesContext';
import './EstudianteEvents.css';

const EstudianteEvents = () => {
  const { courses } = useCourses();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  // Mock de progreso y estado de cursos
  const coursesWithStatus = courses.map((course, index) => ({
    ...course,
    progress: [35, 75, 100, 15, 90, 50][index % 6] || 50,
    lessons: course.meta?.lessons || 20,
    completedLessons: Math.floor(((course.meta?.lessons || 20) * ([35, 75, 100, 15, 90, 50][index % 6] || 50)) / 100),
    status: [35, 75, 100, 15, 90, 50][index % 6] >= 100 ? 'completed' : 'in-progress'
  }));

  // Filtrar cursos
  const filteredCourses = coursesWithStatus.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.status === 'in-progress';
    if (filter === 'completed') return course.status === 'completed';
    return true;
  });

  return (
    <div className="user-events-container">
      {/* Header */}
      <div className="events-header">
        <div className="header-content">
          <h1 className="events-title">Mis Cursos</h1>
          <p className="events-subtitle">Gestiona tu progreso de aprendizaje</p>
        </div>

        {/* Filtros */}
        <div className="events-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({coursesWithStatus.length})
          </button>
          <button
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            En Progreso ({coursesWithStatus.filter(c => c.status === 'in-progress').length})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completados ({coursesWithStatus.filter(c => c.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Grid de Cursos */}
      <div className="events-grid">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <p>No hay cursos {filter === 'all' ? 'disponibles' : filter === 'in-progress' ? 'en progreso' : 'completados'}</p>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="event-card">
              {/* Encabezado con imagen */}
              <div className="event-card-header">
                <img
                  src={course.imageUrl || 'https://via.placeholder.com/200/CCCCCC/666666?text=Curso'}
                  alt={course.title}
                  className="event-logo"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200/CCCCCC/666666?text=Curso'; }}
                />
                {course.status === 'completed' && (
                  <div className="completion-badge">
                    <span>✓</span> Completado
                  </div>
                )}
              </div>

              {/* Cuerpo */}
              <div className="event-card-body">
                <h3 className="event-title">{course.title}</h3>
                <p className="event-description">{course.description}</p>

                {/* Información de progreso */}
                <div className="progress-info">
                  <div className="progress-stats">
                    <span className="progress-label">
                      {course.completedLessons} / {course.lessons} lecciones
                    </span>
                    <span className="progress-percentage">{course.progress}%</span>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Estrellas de calificación */}
                <div className="event-rating">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`star ${i < (course.rating || 0) ? 'filled' : 'empty'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Botón de acción */}
                <button 
                  className="continue-btn"
                  onClick={() => navigate(`/user/course/${course.id}`)}
                >
                  {course.status === 'completed' ? 'Revisar' : 'Continuar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EstudianteEvents;