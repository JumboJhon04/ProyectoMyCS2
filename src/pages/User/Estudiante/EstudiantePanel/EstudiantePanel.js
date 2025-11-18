import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useCourses } from '../../../../context/CoursesContext';
import UserPanel from '../../UserPanel';
import './EstudiantePanel.css';

const EstudiantePanel = () => {
  const { user } = useUser();
  const { courses } = useCourses();
  const navigate = useNavigate();

  // Obtener el primer nombre para el saludo
  const firstName = user?.name ? user.name.split(' ')[0] : 'Fulanito';

  // Calcular progreso mock para cada curso
  const coursesWithProgress = courses.slice(0, 3).map((course, index) => ({
    ...course,
    progress: [70, 40, 90][index % 3] || 50,
    lessons: course.meta?.lessons || 20
  }));

  // Próximas pruebas mock - vinculadas a los cursos del contexto
  const upcomingExams = [
    { id: 1, name: 'Prueba Python - Variables y Funciones', courseId: 1, date: '15/11/2025 08:00', icon: '💻' },
    { id: 2, name: 'Examen Java - POO', courseId: 2, date: '15/11/2025 09:00', icon: '☕' },
    { id: 3, name: 'Prueba JavaScript - Fundamentos', courseId: 3, date: '15/11/2025 10:00', icon: '📜' }
  ].filter(exam => courses.some(c => c.id === exam.courseId));

  return (
    <div className="dashboard-user-container">
      
      {/* --- Sección de Bienvenida y Roles --- */}
      <UserPanel userName={firstName} role="Estudiante" message="Continúa aprendiendo" />

      {/* --- Contenido Principal (Cursos y Pruebas) --- */}
      <div className="dashboard-content-grid">
        
        {/* Columna Izquierda: Cursos */}
        <main className="course-list-main">
          {coursesWithProgress.map((course) => (
            <div 
              key={course.id} 
              className="course-card" 
              onClick={() => navigate(`/user/course/${course.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={course.imageUrl || 'https://via.placeholder.com/50'} 
                alt={course.title} 
                className="course-icon"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
              />
              <div className="course-details">
                <h3>{course.title}</h3>
                <p className="course-info">Programación • {course.lessons} lecciones</p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
          
          <button className="view-all-btn" onClick={() => navigate('/user/events')}>Ver todos los módulos</button>
        </main>

        {/* Columna Derecha: Próximas Pruebas */}
        <aside className="upcoming-exams-sidebar">
          <h3>Próximas Pruebas</h3>
          
          {upcomingExams.map((exam) => {
            const course = courses.find(c => c.id === exam.courseId);
            return (
              <div key={exam.id} className="exam-item">
                <span className="exam-icon">{exam.icon}</span>
                <div className="exam-details">
                  <p>{exam.name}</p>
                  <span className="exam-date">{exam.date}</span>
                </div>
              </div>
            );
          })}
        </aside>

      </div>
    </div>
  );
};

export default EstudiantePanel;