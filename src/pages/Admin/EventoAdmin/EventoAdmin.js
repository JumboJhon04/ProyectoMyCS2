import React, { useState } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import './EventoAdmin.css';
import NewEventModal from './NewEventModal';

/*
  ============================================
  GESTIÓN DE CURSOS
  ============================================
  
  Este componente usa CoursesContext para manejar los cursos.
  
  Por defecto está en MODO MOCK (no requiere backend).
  Para usar API real, cambia mockMode a false en CoursesContext.js
  
  El CoursesContext maneja:
  - Carga de cursos (mock o API)
  - Crear, editar y eliminar cursos
  - Toggle entre modo mock y modo API
  
  ============================================
*/

const EventoAdmin = () => {
  const { courses, loading, error, mockMode, deleteCourse, loadCourses } = useCourses();

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso?')) return;
    
    try {
      await deleteCourse(id);
    } catch (err) {
      alert('No se pudo eliminar el curso');
    }
  };

  const handleEdit = (courseId) => {
    // TODO: Abrir modal o formulario para editar
    console.log('Editar curso:', courseId);
    alert('Función de editar próximamente');
  };

  const [showModal, setShowModal] = useState(false);

  const handleAddNew = () => {
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-message">Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Use the same main wrapper that AdminPanel uses so the sidebar offset (margin-left) applies */}
      <main className="main-content2">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Administración de Cursos</h1>
            <p className="admin-subtitle">Gestiona los cursos disponibles en la plataforma</p>
          </div>

          <div className="header-actions">
            {/* Estadística rápida: Cursos Activos (moved into header actions) */}
            <div className="stats-card" role="region" aria-label="Cursos activos">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div style={{fontSize: '0.95rem', fontWeight: 700, color: '#fff'}}>Cursos Activos</div>
                  <div style={{fontSize: '0.8rem', color: '#e6eefc'}}>Visitantes del mes</div>
                </div>
                <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#fff'}}>{courses.length.toLocaleString()}</div>
              </div>
            </div>

            <button onClick={handleAddNew} className="add-course-btn">
              Agregar Nuevo Curso
            </button>
          </div>
        </div>

        <div className="content-area">
          {courses.length === 0 ? (
            <div className="empty-state">
              <p>No hay cursos disponibles</p>
              <button onClick={handleAddNew} className="add-course-btn">
                Agregar el primer curso
              </button>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-card-header">
                    <img 
                      src={course.imageUrl || '/placeholder-course.png'} 
                      alt={course.title}
                      className="course-logo"
                      onError={(e) => { e.target.src = '/placeholder-course.png'; }}
                    />
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEdit(course.id)}
                      aria-label="Editar curso"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="course-card-body">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    
                    <div className="course-rating">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < (course.rating || 0) ? 'filled' : 'empty'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <div className="course-footer">
                      <span className="course-price">
                        ${Number(course.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showModal && <NewEventModal isOpen={showModal} onClose={() => setShowModal(false)} />}
      </main>
    </div>
  );
};

export default EventoAdmin;
