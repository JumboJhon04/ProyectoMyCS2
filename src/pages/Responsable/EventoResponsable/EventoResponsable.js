import React, { useEffect, useState } from 'react';
import { useCourses } from '../../../context/CoursesContext';
import { useUser } from '../../../context/UserContext';
import './EventoResponsable.css';
import NewEventModal from './NewEventModal';

import GradesModal from './GradesModal';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventoResponsable = () => {
  const { courses, loading, error, deleteCourse, fetchCourses } = useCourses();
  const { user } = useUser();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const responsableId = user?.id || user?.SECUENCIAL;
    if (responsableId) {
      fetchCourses(responsableId);
    }
  }, [user?.id, user?.SECUENCIAL]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      await deleteCourse(id);
    } catch (err) {
      alert('No se pudo eliminar el curso');
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleGrades = (course) => {
    setSelectedCourse(course);
    setShowGradesModal(true);
  };

  const generateGeneralReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte General de Cursos', 14, 20);
    doc.setFontSize(12);
    doc.text(`Responsable: ${user?.nombres || ''} ${user?.apellidos || ''}`, 14, 30);

    const bodyData = courses.map(c => [
        c.title,
        c.NOMBRE_DOCENTE || 'No asignado',
        c.PROMEDIO_GENERAL ? Number(c.PROMEDIO_GENERAL).toFixed(2) : '0.00'
    ]);

    autoTable(doc, {
        head: [['Nombre del Curso', 'Docente Encargado', 'Nota Promedio']],
        body: bodyData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save('reporte_general_cursos.pdf');
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
          <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
             <button onClick={generateGeneralReport} className="btn-primary" style={{padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
               📄 Generar Reporte General
             </button>
          </div>

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
                      disabled={course.ESTADO === 'FINALIZADO'}
                      style={course.ESTADO === 'FINALIZADO' ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}}
                      title={course.ESTADO === 'FINALIZADO' ? 'El curso está finalizado y no se puede editar' : 'Editar curso'}
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
                      <button 
                        className="btn-text" 
                        onClick={() => handleGrades(course)}
                        style={{fontSize:'0.8rem', marginLeft:'auto', marginRight:'10px'}}
                      >
                        {course.ESTADO === 'FINALIZADO' ? '📜 Reporte' : '📝 Notas'}
                      </button>
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
        {showGradesModal && (
          <GradesModal
            isOpen={showGradesModal}
            onClose={() => { setShowGradesModal(false); setSelectedCourse(null); }}
            course={selectedCourse}
            user={user}
          />
        )}
      </main>
    </div>
  );
};

export default EventoResponsable;
