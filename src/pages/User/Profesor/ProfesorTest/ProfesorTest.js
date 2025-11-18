// src/pages/User/Profesor/ProfesorTest/ProfesorTest.js
import React, { useState } from 'react';
import { FaPlus, FaCheckCircle, FaClock, FaBookOpen, FaChartBar } from 'react-icons/fa'; // Iconos de gestión
import './ProfesorTest.css';

const mockTests = [
  { id: 1, title: 'Prueba Python', course: 'Base de Datos', status: 'Activa', questions: 20, students: 30, due: '15/11/2025' },
  { id: 2, title: 'Examen Final SQL', course: 'Base de Datos', status: 'Inactiva', questions: 30, students: 30, due: '25/11/2025' },
  { id: 3, title: 'Test 1 - Java', course: 'Análisis de Datos', status: 'Pendiente', questions: 15, students: 25, due: '18/11/2025' },
];

const ProfesorTest = () => {
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTests = mockTests.filter(test => {
    if (filter === 'all') return true;
    if (filter === 'active' && test.status === 'Activa') return true;
    if (filter === 'inactive' && test.status === 'Inactiva') return true;
    if (filter === 'pending' && test.status === 'Pendiente') return true;
    return false;
  }).filter(test => test.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="professor-test-container">
      <div className="tests-header-profesor">
        <div className="header-content">
          <h1 className="tests-title">Gestión de Evaluaciones</h1>
          <p className="tests-subtitle">Administra, crea y califica las pruebas de tus cursos</p>
        </div>

        {/* Botón de acción */}
        <button className="add-test-btn">
          <FaPlus /> Crear Nueva Prueba
        </button>

        {/* Filtros */}
        <div className="tests-filters-profesor">
          <button
            className={`filter-btn-profesor ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({mockTests.length})
          </button>
          <button
            className={`filter-btn-profesor ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Activas ({mockTests.filter(t => t.status === 'Activa').length})
          </button>
          <button
            className={`filter-btn-profesor ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({mockTests.filter(t => t.status === 'Pendiente').length})
          </button>
          
          <input
            type="text"
            placeholder="Buscar evaluación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-test"
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="tests-stats-profesor">
        <div className="stat-card-profesor urgent-profesor">
          <FaClock className="stat-icon-profesor" />
          <div className="stat-content">
            <div className="stat-number">{mockTests.filter(t => t.status === 'Pendiente').length}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card-profesor warning-profesor">
          <FaCheckCircle className="stat-icon-profesor" />
          <div className="stat-content">
            <div className="stat-number">45</div>
            <div className="stat-label">Por Calificar</div>
          </div>
        </div>

        <div className="stat-card-profesor success-profesor">
          <FaBookOpen className="stat-icon-profesor" />
          <div className="stat-content">
            <div className="stat-number">{mockTests.length}</div>
            <div className="stat-label">Evaluaciones Creadas</div>
          </div>
        </div>
      </div>

      {/* Lista de Tests */}
      <div className="tests-list-profesor">
        {filteredTests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No hay evaluaciones creadas o que coincidan con el filtro.</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div key={test.id} className={`test-card-profesor ${test.status.toLowerCase()}`}>
              <div className="test-card-content-profesor">
                <div className="test-info-profesor">
                  <div className="test-main-info-profesor">
                    <h3 className="test-title-profesor">{test.title}</h3>
                    <p className="test-course-profesor">Curso: {test.course}</p>
                  </div>

                  <div className="test-details-profesor">
                    <div className="detail-item">
                      <span>📋 {test.questions} Preguntas</span>
                    </div>
                    <div className="detail-item">
                      <span>👥 {test.students} Estudiantes</span>
                    </div>
                    <div className="detail-item">
                      <span>📅 Entrega: {test.due}</span>
                    </div>
                  </div>
                </div>

                <div className="test-actions-profesor">
                  <span className={`status-badge ${test.status.toLowerCase()}`}>{test.status}</span>
                  <button className="btn-primary-test-profesor">
                    <FaChartBar /> Reportes
                  </button>
                  <button className="btn-secondary-test-profesor">
                    Editar Prueba
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfesorTest;