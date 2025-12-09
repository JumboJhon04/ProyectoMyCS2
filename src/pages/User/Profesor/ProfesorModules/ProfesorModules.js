// src/pages/User/Profesor/ProfesorModules/ProfesorModules.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookOpen, FaUserFriends, FaSearch, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { useUser } from '../../../../context/UserContext';
import './ProfesorModules.css';
import API_URL from '../../../../config/api';

const ProfesorModules = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMateria, setSelectedMateria] = useState('Todas');
    const [selectedDificultad, setSelectedDificultad] = useState('Dificultad');
    const [professorEvents, setProfessorEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar eventos reales del profesor
    useEffect(() => {
        const fetchEvents = async () => {
            if (!user || !user.id) {
                setProfessorEvents([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/api/docentes/${user.id}/eventos`);
                if (!res.ok) {
                    console.warn('No se pudieron cargar los eventos del docente');
                    setProfessorEvents([]);
                    return;
                }
                const json = await res.json();
                setProfessorEvents(json.data || []);
            } catch (e) {
                console.error('Error cargando eventos del docente:', e.message);
                setProfessorEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    // Mapear eventos del backend al formato de módulos
    const modules = professorEvents.map(ev => ({
        id: ev.eventoId || ev.SECUENCIAL,
        title: ev.TITULO || ev.title || 'Sin título',
        type: ev.CODIGOTIPOEVENTO === 'CUR' ? 'Curso' : ev.CODIGOTIPOEVENTO === 'TALL' ? 'Taller' : ev.CODIGOTIPOEVENTO === 'SEM' ? 'Seminario' : 'Evento',
        level: 'Intermedio', // Podría venir del backend si está disponible
        lessons: ev.HORAS || 0,
        students: ev.TOTAL_INSCRITOS || 0, // Si el backend lo provee
        imageUrl: ev.URL_IMAGEN || 'https://via.placeholder.com/150/007bff/FFFFFF?text=Curso',
        description: ev.DESCRIPCION || ''
    }));

    // role switching by subRole removed; navigation should be based on actual codigoRol

    // Adaptamos el CourseCard del estudiante para el profesor (usamos un componente sencillo por ahora)
    const ModuleCard = ({ module }) => {
        const handleViewCourse = () => {
            navigate(`/profesor/course/${module.id}`);
        };

        return (
            <div className="module-card">
                <div className="card-image-container">
                    <img src={module.imageUrl} alt={module.title} className="card-image" />
                    <span className={`course-level ${module.level.toLowerCase()}`}>{module.level}</span>
                </div>
                <div className="card-body-modulos">
                    <h3>{module.title}</h3>
                    <p className="module-description">Comprende los fundamentos y principios de {module.title}</p>
                    <div className="module-meta">
                        <span className="module-type">{module.type}</span>
                        <span className="module-lessons">{module.lessons} lecciones</span>
                    </div>
                    <div className="module-actions">
                        <button className="action-btn-students">
                            <FaUserFriends /> Estudiantes ({module.students})
                        </button>
                        <button className="action-btn-view" onClick={handleViewCourse}>
                            Ver Curso
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="user-modules-container">
            <div className="events-header"> {/* Reutilizamos la clase de EstudianteEvents */}
                <div className="header-content">
                    <h1 className="events-title">Módulos de enseñanza</h1>
                    <p className="events-subtitle">Explora y mejora tus cursos con los siguientes módulos</p>
                </div>

                {/* role switcher removed: roles now come from backend via codigoRol */}

                {/* Resumen de estadísticas (similar a la segunda imagen del estudiante) */}
                <div className="modules-summary">
                    <div className="summary-card">
                        <FaBookOpen />
                        <p>Total de cursos</p>
                        <strong>{modules.length}</strong>
                    </div>
                    <div className="summary-card">
                        <FaUserFriends />
                        <p>Estudiantes</p>
                        <strong>{modules.reduce((acc, c) => acc + c.students, 0)}</strong>
                    </div>
                    <div className="summary-card">
                        <span className="icon">⏱</span>
                        <p>Total de lecciones</p>
                        <strong>{modules.reduce((acc, c) => acc + c.lessons, 0)}</strong>
                    </div>
                </div>

                {/* Filtros */}
                <div className="modules-filters-row">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar curso"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-module"
                        />
                    </div>
                    <select value={selectedMateria} onChange={(e) => setSelectedMateria(e.target.value)} className="filter-select-module">
                        <option>Todas las materias</option>
                    </select>
                    <select value={selectedDificultad} onChange={(e) => setSelectedDificultad(e.target.value)} className="filter-select-module">
                        <option>Dificultad</option>
                    </select>
                </div>
            </div>

            {/* Grid de Módulos */}
            <div className="modules-grid">
                {loading ? (
                    <div className="empty-state">
                        <p>Cargando módulos...</p>
                    </div>
                ) : modules.length === 0 ? (
                    <div className="empty-state">
                        <p>No tienes cursos asignados actualmente</p>
                    </div>
                ) : (
                    modules.map(module => (
                        <ModuleCard key={module.id} module={module} />
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfesorModules;