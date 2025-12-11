// src/pages/User/Profesor/ProfesorTest/ProfesorTest.js
import React, { useState } from 'react';
import {
  FaPlus, FaCheckCircle, FaClock, FaBookOpen, FaChartBar,
  FaClipboardList, FaUsers, FaCalendarAlt
} from 'react-icons/fa'; // Iconos de gestión
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import API_URL from '../../../../config/api';
import './ProfesorTest.css';

const ProfesorTest = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Tests
  React.useEffect(() => {
    const fetchTests = async () => {
      if (!user || !user.id) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/evaluaciones/profesor/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setTests(data.data);
        }
      } catch (error) {
        console.error("Error cargando evaluaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user]);

  // Lógica para determinar status "Calculado" en frontend si no viene de DB
  // Asumiremos que el backend puede no traer status, así que lo inferimos por fechas
  const getStatus = (test) => {
    const now = new Date();
    const start = new Date(test.FECHA_INICIO);
    const end = new Date(test.FECHA_FIN);

    if (now < start) return 'Pendiente';
    if (now >= start && now <= end) return 'Activa';
    return 'Finalizada';
  };

  const filteredTests = tests.filter(test => {
    const status = getStatus(test);
    if (filter === 'all') return true;
    if (filter === 'active' && status === 'Activa') return true;
    if (filter === 'inactive' && status === 'Finalizada') return true; // Mapear Inactiva a Finalizada para filtro
    if (filter === 'pending' && status === 'Pendiente') return true;
    return false;
  }).filter(test => test.TITULO.toLowerCase().includes(searchTerm.toLowerCase()));

  // Contadores para Stats
  const pendingCount = tests.filter(t => getStatus(t) === 'Pendiente').length;
  const activeCount = tests.filter(t => getStatus(t) === 'Activa').length; // Usaremos esto para "Por Calificar" o similar si se quiere
  const finishedCount = tests.filter(t => getStatus(t) === 'Finalizada').length;

  return (
    <div className="professor-test-container">
      <div className="tests-header-profesor">
        <div className="header-content">
          <h1 className="tests-title">Gestión de Evaluaciones</h1>
          <p className="tests-subtitle">Administra, crea y califica las pruebas de tus cursos</p>
        </div>



        {/* Filtros */}
        <div className="tests-filters-profesor">
          <button
            className={`filter-btn-profesor ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({tests.length})
          </button>
          <button
            className={`filter-btn-profesor ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Activas ({activeCount})
          </button>
          <button
            className={`filter-btn-profesor ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({pendingCount})
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
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card-profesor warning-profesor">
          <FaCheckCircle className="stat-icon-profesor" />
          <div className="stat-content">
            <div className="stat-number">{finishedCount}</div>
            <div className="stat-label">Finalizadas</div>
          </div>
        </div>

        <div className="stat-card-profesor success-profesor">
          <FaBookOpen className="stat-icon-profesor" />
          <div className="stat-content">
            <div className="stat-number">{tests.length}</div>
            <div className="stat-label">Evaluaciones Creadas</div>
          </div>
        </div>
      </div>

      {/* Lista de Tests */}
      <div className="tests-list-profesor">
        {loading ? <p>Cargando evaluaciones...</p> : filteredTests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaClipboardList /></div>
            <p>No hay evaluaciones creadas o que coincidan con el filtro.</p>
          </div>
        ) : (
          filteredTests.map((test) => {
            const status = getStatus(test);
            return (
              <div key={test.SECUENCIAL} className={`test-card-profesor ${status.toLowerCase()}`}>
                <div className="test-card-content-profesor">
                  <div className="test-info-profesor">
                    <div className="test-main-info-profesor">
                      <h3 className="test-title-profesor">{test.TITULO}</h3>
                      <p className="test-course-profesor">Curso: {test.CursoNombre} | Módulo: {test.ModuloNombre}</p>
                    </div>

                    <div className="test-details-profesor">
                      <div className="detail-item">
                        <span><FaClipboardList /> {test.questionsCount} Preguntas</span>
                      </div>
                      <div className="detail-item">
                        <span><FaUsers /> {test.attemptsCount} Intentos</span>
                      </div>
                      <div className="detail-item">
                        <span><FaCalendarAlt /> Fin: {new Date(test.FECHA_FIN).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-actions-profesor">
                    <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
                    <button className="btn-primary-test-profesor">
                      <FaChartBar /> Reportes
                    </button>
                    <button
                      className="btn-secondary-test-profesor"
                      onClick={() => navigate(`/profesor/exam-editor/${test.SECUENCIAL}`)}
                    >
                      Editar Prueba
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default ProfesorTest;