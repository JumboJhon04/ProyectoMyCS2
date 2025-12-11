import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import API_URL from '../../../../config/api';
import {
  FaClock, FaCalendarAlt, FaCheck, FaClipboardList,
  FaLaptopCode, FaJava, FaJs, FaCheckDouble, FaExclamationTriangle
} from 'react-icons/fa';
import './EstudianteTest.css';

const EstudianteTests = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch Tests
  React.useEffect(() => {
    const fetchTests = async () => {
      if (!user || !user.id) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/evaluaciones/estudiante/${user.id}`);
        const data = await res.json();
        if (data.success) {
          // Filtrar duplicados por SECUENCIAL
          const uniqueTests = Object.values(data.data.reduce((acc, current) => {
            if (!acc[current.SECUENCIAL]) acc[current.SECUENCIAL] = current;
            return acc;
          }, {}));
          setTests(uniqueTests);
        }
      } catch (error) {
        console.error("Error cargando evaluaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user]);

  // Helpers
  const getDaysLeft = (dateStr) => {
    const due = new Date(dateStr);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatus = (test) => {
    if (test.IntentoId) return 'completed';
    const now = new Date();
    const start = new Date(test.FECHA_INICIO);
    const end = new Date(test.FECHA_FIN);

    if (now < start) return 'future'; // Aún no inicia
    if (now > end) return 'expired'; // Ya pasó
    return 'pending'; // Disponible para tomar
  };

  // Procesar datos para la UI
  const processedTests = tests.map(t => {
    const status = getStatus(t);
    const daysLeft = getDaysLeft(t.FECHA_FIN);

    return {
      ...t,
      status: status === 'expired' ? 'pending' : status, // Para efectos de filtro simple 'pending' agrupa disponibles y expirados visualmente por ahora, o ajustamos
      uiStatus: status, // status real interno
      daysLeft
    };
  });

  const filteredTests = processedTests.filter(test => {
    if (filter === 'all') return true;
    if (filter === 'pending') return test.uiStatus === 'pending';
    if (filter === 'completed') return test.uiStatus === 'completed';
    return true;
  });

  const pendingCount = processedTests.filter(t => t.uiStatus === 'pending').length;
  const completedCount = processedTests.filter(t => t.uiStatus === 'completed').length;
  const todayCount = processedTests.filter(t => t.daysLeft === 0 && t.uiStatus === 'pending').length;

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
          <div className="stat-icon"><FaExclamationTriangle /></div>
          <div className="stat-content">
            <div className="stat-number">{todayCount}</div>
            <div className="stat-label">Hoy</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><FaCalendarAlt /></div>
          <div className="stat-content">
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon"><FaCheckDouble /></div>
          <div className="stat-content">
            <div className="stat-number">{completedCount}</div>
            <div className="stat-label">Completados</div>
          </div>
        </div>
      </div>

      {/* Lista de Tests */}
      <div className="tests-list">
        {loading ? <p>Cargando evaluaciones...</p> : filteredTests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaClipboardList /></div>
            <p>No hay evaluaciones {filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completadas' : 'disponibles'}</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div key={test.SECUENCIAL} className={`test-card ${test.uiStatus === 'completed' ? 'completed' : 'pending'}`}>
              {/* Badge de urgencia */}
              {test.uiStatus === 'pending' && test.daysLeft === 0 && (
                <div className="urgency-badge">¡HOY!</div>
              )}
              {test.uiStatus === 'pending' && test.daysLeft > 0 && test.daysLeft <= 3 && (
                <div className="warning-badge">En {test.daysLeft} días</div>
              )}

              <div className="test-card-content">
                {/* Icono */}
                <div className="test-icon-wrapper">
                  <div className={`test-icon ${test.uiStatus === 'completed' ? 'completed' : 'pending'}`}>
                    {test.uiStatus === 'completed' ? <FaCheck /> : <FaLaptopCode />}
                  </div>
                </div>

                {/* Información principal */}
                <div className="test-info">
                  <div className="test-main-info">
                    <h3 className="test-title">{test.TITULO}</h3>
                    <p className="test-course">{test.CursoNombre} | {test.ModuloNombre}</p>
                  </div>

                  <div className="test-details">
                    <div className="detail-item">
                      <span className="detail-icon"><FaCalendarAlt /></span>
                      <span className="detail-text">
                        {new Date(test.FECHA_INICIO).toLocaleDateString()} {new Date(test.FECHA_INICIO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon"><FaClock /></span>
                      <span className="detail-text">{test.DURACION_MINUTOS} min</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon"><FaClipboardList /></span>
                      <span className="detail-text">{test.questionsCount} preguntas</span>
                    </div>
                  </div>

                  {/* Score si está completado */}
                  {test.uiStatus === 'completed' && (
                    <div className="test-score">
                      <span className="score-label">Calificación:</span>
                      <span className={`score-value ${test.CALIFICACION_FINAL >= 7 ? 'passed' : 'failed'}`}>
                        {test.CALIFICACION_FINAL}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="test-actions">
                  {test.uiStatus === 'pending' ? (
                    <button
                      className="btn-primary-test"
                      onClick={() => navigate(`/user/taking-exam/${test.SECUENCIAL}`)}
                    >
                      {test.daysLeft <= 0 ? (test.daysLeft === 0 ? 'Iniciar Ahora' : 'Vencido') : 'Iniciar'}
                    </button>
                  ) : test.uiStatus === 'completed' ? (
                    <button className="btn-secondary-test" disabled style={{ cursor: 'default', opacity: 0.7 }}>
                      Entregado
                    </button>
                  ) : (
                    <button className="btn-secondary-test" disabled>
                      No disponible
                    </button>
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