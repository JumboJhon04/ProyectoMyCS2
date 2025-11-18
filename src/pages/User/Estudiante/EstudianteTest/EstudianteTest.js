import React, { useState } from 'react';
import { useCourses } from '../../../../context/CoursesContext';
import './EstudianteTest.css';

const EstudianteTests = () => {
  const { courses } = useCourses();
  const [filter, setFilter] = useState('all'); // all, pending, completed

  // Mock de tests/exámenes pendientes - vinculados a los cursos del contexto
  const tests = [
    {
      id: 1,
      title: 'Prueba Python - Variables y Funciones',
      courseId: 1,
      course: 'Curso de Python',
      date: '15/11/2025',
      time: '08:00',
      duration: '60 min',
      questions: 20,
      status: 'pending',
      icon: '💻',
      daysLeft: 0
    },
    {
      id: 2,
      title: 'Examen Java - POO',
      courseId: 2,
      course: 'Curso de Java',
      date: '15/11/2025',
      time: '09:00',
      duration: '90 min',
      questions: 30,
      status: 'pending',
      icon: '☕',
      daysLeft: 0
    },
    {
      id: 3,
      title: 'Prueba JavaScript - Fundamentos',
      courseId: 3,
      course: 'Curso de JavaScript',
      date: '15/11/2025',
      time: '10:00',
      duration: '45 min',
      questions: 15,
      status: 'pending',
      icon: '📜',
      daysLeft: 0
    },
    {
      id: 4,
      title: 'Test Python - Listas y Diccionarios',
      courseId: 1,
      course: 'Curso de Python',
      date: '18/11/2025',
      time: '14:00',
      duration: '45 min',
      questions: 15,
      status: 'pending',
      icon: '💻',
      daysLeft: 3
    },
    {
      id: 5,
      title: 'Examen Final - JavaScript',
      courseId: 3,
      course: 'Curso de JavaScript',
      date: '10/11/2025',
      time: '11:00',
      duration: '120 min',
      questions: 40,
      status: 'completed',
      score: 85,
      icon: '📜',
      daysLeft: -5
    }
  ].filter(test => courses.some(c => c.id === test.courseId));

  // Filtrar tests
  const filteredTests = tests.filter(test => {
    if (filter === 'all') return true;
    if (filter === 'pending') return test.status === 'pending';
    if (filter === 'completed') return test.status === 'completed';
    return true;
  });

  const pendingCount = tests.filter(t => t.status === 'pending').length;
  const completedCount = tests.filter(t => t.status === 'completed').length;

  return (
    <div className="user-tests-container">
      {/* Header */}
      <div className="tests-header">
        <div className="header-content">
          <h1 className="tests-title">Mis Evaluaciones</h1>
          <p className="tests-subtitle">Gestiona tus exámenes y pruebas programadas</p>
        </div>

        {/* Filtros */}
        <div className="tests-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({tests.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completados ({completedCount})
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="tests-stats">
        <div className="stat-card urgent">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{tests.filter(t => t.daysLeft === 0 && t.status === 'pending').length}</div>
            <div className="stat-label">Hoy</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-number">{completedCount}</div>
            <div className="stat-label">Completados</div>
          </div>
        </div>
      </div>

      {/* Lista de Tests */}
      <div className="tests-list">
        {filteredTests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No hay evaluaciones {filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completadas' : 'disponibles'}</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div key={test.id} className={`test-card ${test.status}`}>
              {/* Badge de urgencia */}
              {test.status === 'pending' && test.daysLeft === 0 && (
                <div className="urgency-badge">¡HOY!</div>
              )}
              {test.status === 'pending' && test.daysLeft > 0 && test.daysLeft <= 3 && (
                <div className="warning-badge">En {test.daysLeft} días</div>
              )}

              <div className="test-card-content">
                {/* Icono */}
                <div className="test-icon-wrapper">
                  <div className={`test-icon ${test.status}`}>
                    {test.status === 'completed' ? '✓' : test.icon}
                  </div>
                </div>

                {/* Información principal */}
                <div className="test-info">
                  <div className="test-main-info">
                    <h3 className="test-title">{test.title}</h3>
                    <p className="test-course">{test.course}</p>
                  </div>

                  <div className="test-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{test.date} a las {test.time}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏱</span>
                      <span className="detail-text">{test.duration}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📋</span>
                      <span className="detail-text">{test.questions} preguntas</span>
                    </div>
                  </div>

                  {/* Score si está completado */}
                  {test.status === 'completed' && (
                    <div className="test-score">
                      <span className="score-label">Calificación:</span>
                      <span className={`score-value ${test.score >= 70 ? 'passed' : 'failed'}`}>
                        {test.score}/100
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="test-actions">
                  {test.status === 'pending' ? (
                    <>
                      <button className="btn-primary-test">
                        {test.daysLeft === 0 ? 'Iniciar Ahora' : 'Ver Detalles'}
                      </button>
                      <button className="btn-secondary-test">
                        Preparar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary-test">
                        Ver Resultados
                      </button>
                      <button className="btn-secondary-test">
                        Repasar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EstudianteTests;