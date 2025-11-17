import React, { useState } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import './EventoResponsable.css';
import NewEventModal from './NewEventModal';

const EventoResponsable = () => {
  const { courses, loading, error, mockMode, deleteCourse, loadCourses } = useCourses();

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      await deleteCourse(id);
    } catch (err) {
      alert('No se pudo eliminar el curso');
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleEdit = (course) => {
    setSelectedCourse(course);
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
      <main className="main-content2">

        <div className="content-area">
          {courses.length === 0 ? (
            <div className="empty-state">
              <p>No hay eventos disponibles</p>
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
                      onClick={() => handleEdit(course)}
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
        {showModal && (
          <NewEventModal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setSelectedCourse(null); }}
            course={selectedCourse}
          />
        )}
      </main>
    </div>
  );
};

export default EventoResponsable;
