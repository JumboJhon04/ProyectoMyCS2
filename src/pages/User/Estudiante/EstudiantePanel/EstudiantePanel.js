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
  const coursesWithProgress = courses.map((course, index) => ({
    ...course,
    progress: [70, 40, 20][index % 3] || 50,
    lessons: course.meta?.lessons || 20
  }));

  // Próximas pruebas mock
  const upcomingExams = [
    { id: 1, name: 'Prueba Python', date: '15/11/2025 08:00', icon: '💻' },
    { id: 2, name: 'Prueba Java', date: '15/11/2025 09:00', icon: '☕' },
    { id: 3, name: 'Prueba Álgebra', date: '15/11/2025 10:00', icon: '√' }
  ];

  return (
    <div className="dashboard-user-container">
      
      {/* --- Sección de Bienvenida y Roles --- */}
      <UserPanel userName={firstName} role="Estudiante" message="Continúa aprendiendo" />

      {/* --- Contenido Principal (Cursos y Pruebas) --- */}
      <div className="dashboard-content-grid">
        
        {/* Columna Izquierda: Cursos */}
        <main className="course-list-main">
          
          {/* Tarjeta de Curso 1: Python */}
          <div className="course-card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" alt="Python" className="course-icon" />
            <div className="course-details">
              <h3>Curso Python</h3>
              <p className="course-info">Programación • 20 lecciones</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Curso 2: Java */}
          <div className="course-card">
            <img src="https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg" alt="Java" className="course-icon" />
            <div className="course-details">
              <h3>Curso Java</h3>
              <p className="course-info">Programación • 25 lecciones</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Curso 3: Álgebra */}
          <div className="course-card">
            {/* Reemplaza con un ícono real de álgebra */}
            <div className="course-icon-placeholder">√x</div>
            <div className="course-details">
              <h3>Curso Algebra</h3>
              <p className="course-info">Matemáticas • 10 lecciones</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
          
          <button className="view-all-btn" onClick={() => navigate('/user/events')}>Ver todos los módulos</button>
        </main>

        {/* Columna Derecha: Próximas Pruebas */}
        <aside className="upcoming-exams-sidebar">
          <h3>Próximas Pruebas</h3>
          
          <div className="exam-item">
            <span className="exam-icon">💻</span>
            <div className="exam-details">
              <p>Prueba Python</p>
              <span className="exam-date">15/11/2025 08:00</span>
            </div>
          </div>
          
          <div className="exam-item">
            <span className="exam-icon">💻</span>
            <div className="exam-details">
              <p>Prueba Java</p>
              <span className="exam-date">15/11/2025 09:00</span>
            </div>
          </div>

          <div className="exam-item">
            <span className="exam-icon">√x</span>
            <div className="exam-details">
              <p>Prueba Algebra</p>
              <span className="exam-date">15/11/2025 10:00</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default EstudiantePanel;