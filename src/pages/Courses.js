import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader/PublicHeader';
import API_URL from '../config/api';
import { useUser } from '../context/UserContext';
import './CoursesFilters.css';

const tipoOptions = [
  { label: 'Todo', value: '' },
  { label: 'Curso', value: 'CUR' },
  { label: 'Taller', value: 'TALL' },
  { label: 'Seminario', value: 'SEM' },
  { label: 'Conferencia', value: 'CONF' }
];

export default function CoursesFilters() {
  // 1. Estados necesarios que faltaban en tu código
  const [courses, setCourses] = useState([]); // Lista cruda de cursos
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('');
  const [costo, setCosto] = useState('');
  const [disponibilidad, setDisponibilidad] = useState('todos'); // 'todos' | 'aptos' | 'noaptos'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useUser();
  const inputRef = useRef(null);

  // Carreras del usuario (si existen)
  const userCareerIds = useMemo(() => {
    if (!user) return [];
    const raw = user.carreras || user.CARRERAS || [];
    return raw
      .map(c => c?.SECUENCIAL || c?.id || c?.ID || c?.sec || c?.secId)
      .filter(Boolean)
      .map(Number);
  }, [user]);

  // 2. Carga de datos desde la API real
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construir URL con parámetros de filtro
        let url = `${API_URL}/api/eventos/`;
        const params = [];
        
        if (tipo) params.push(`tipo=${tipo}`);
        if (costo === 'pagado') params.push('pagado=1');
        if (costo === 'gratis') params.push('pagado=0');
        
        if (params.length > 0) {
          url = `${API_URL}/api/eventos/filtrar?` + params.join('&');
        }
        
        console.log('📡 Fetching from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Data received:', data);
        
        setCourses(data.data || []); 
        setLoading(false);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('Error al cargar los eventos: ' + err.message);
        setLoading(false);
      }
    };

    fetchCourses();
  }, [tipo, costo]);

  // 3. Lógica de Filtrado (useMemo para optimizar)
  const filtered = useMemo(() => {
    return courses.filter(c => {
      // Filtro por Buscador (Query)
      const matchesQuery = query === '' || 
        c.TITULO.toLowerCase().includes(query.toLowerCase()) ||
        (c.DESCRIPCION && c.DESCRIPCION.toLowerCase().includes(query.toLowerCase()));

      // Filtro por Tipo
      const matchesTipo = tipo === '' || c.CODIGOTIPOEVENTO === tipo;

      // Filtro por Costo (basado en ES_PAGADO, no en el valor del costo)
      let matchesCosto = true;
      if (costo === 'pagado') matchesCosto = c.ES_PAGADO === 1 || c.ES_PAGADO === true;
      if (costo === 'gratis') matchesCosto = c.ES_PAGADO === 0 || c.ES_PAGADO === false;

      // Filtro por aptitud carrera (solo aplica cuando el usuario tiene carreras)
      const eventoCarreras = (c.CARRERAS || []).map(cc => cc.SECUENCIAL || cc.id || cc.ID).filter(Boolean).map(Number);
      const tieneCarrerasAsociadas = eventoCarreras.length > 0;
      const esApto = !tieneCarrerasAsociadas || eventoCarreras.some(id => userCareerIds.includes(id));

      // Filtro por disponibilidad según carrera del usuario
      // Si el usuario tiene carreras y activa el filtro "Cursos de mi Carrera", mostrar SOLO cursos de su carrera
      let matchesDisponibilidad = true;
      if (userCareerIds.length > 0 && disponibilidad === 'aptos') {
        // Solo mostrar si el curso tiene carreras asociadas Y el usuario es apto
        matchesDisponibilidad = tieneCarrerasAsociadas && esApto;
      }

      return matchesQuery && matchesTipo && matchesCosto && matchesDisponibilidad;
    });
  }, [courses, query, tipo, costo, disponibilidad, userCareerIds]);

  // Nombre de la sección activa
  const sectionName = tipoOptions.find(opt => opt.value === tipo)?.label || 'Todos los eventos';

  return (
    <div>
      <PublicHeader />
      <div style={{ padding: '18px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          
          {/* Cabecera y Buscador */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h2 style={{ margin:0 }}>{sectionName}</h2>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cursos..."
                style={{ padding:'8px 10px', borderRadius:6, border:'1px solid #dfe6ea' }}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const q = query.trim();
                  if (!q) inputRef.current && inputRef.current.focus();
                  else setQuery(q);
                }}
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Filtros visuales */}
          <div className="filters-bar">
            <div className="filters-group">
              <span className="filters-label">Tipo:</span>
              {tipoOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-chip${tipo === opt.value ? ' selected' : ''}`}
                  onClick={() => setTipo(opt.value)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="filters-group">
              <span className="filters-label">Costo:</span>
              <button
                className={`filter-chip${costo === 'pagado' ? ' selected' : ''}`}
                onClick={() => setCosto(costo === 'pagado' ? '' : 'pagado')}
                type="button"
              >
                Pagado
              </button>
              <button
                className={`filter-chip${costo === 'gratis' ? ' selected' : ''}`}
                onClick={() => setCosto(costo === 'gratis' ? '' : 'gratis')}
                type="button"
              >
                Gratis
              </button>
            </div>
            {userCareerIds.length > 0 && (
              <div className="filters-group">
                <span className="filters-label">Mi Carrera:</span>
                <button
                  className={`filter-chip${disponibilidad === 'aptos' ? ' selected' : ''}`}
                  onClick={() => setDisponibilidad(disponibilidad === 'aptos' ? 'todos' : 'aptos')}
                  type="button"
                  title="Mostrar solo cursos disponibles para mi carrera"
                >
                  Cursos de mi Carrera
                </button>
              </div>
            )}
          </div>

          {/* Estados de Carga y Error */}
          {loading && <div className="courses-loading">Cargando eventos...</div>}
          {error && <div className="courses-error">Error: {error}</div>}

          {/* Grid de Resultados */}
          <div className="courses-grid">
            {filtered && filtered.length > 0 ? filtered.map(c => {
              const eventoCarreras = (c.CARRERAS || []).map(cc => cc.SECUENCIAL || cc.id || cc.ID).filter(Boolean).map(Number);
              const tieneCarrerasAsociadas = eventoCarreras.length > 0;
              const esApto = !tieneCarrerasAsociadas || eventoCarreras.some(id => userCareerIds.includes(id));

              return (
                <article className="course-card" key={c.SECUENCIAL}>
                  <div className="course-image-wrap">
                    <img src={c.URL_IMAGEN} alt={c.TITULO} />
                  </div>
                  <div className="course-body">
                    <h4 className="course-title">{c.TITULO}</h4>
                    <p className="course-desc">{c.DESCRIPCION}</p>
                    <div className="course-meta">
                      <div className="course-meta-top">
                        <div className="course-type">
                            {tipoOptions.find(t => t.value === c.CODIGOTIPOEVENTO)?.label || 'Evento'}
                        </div>
                        {tieneCarrerasAsociadas && (
                          <span className={`course-apt-badge${esApto ? '' : ' not-eligible'}`}>
                            {esApto ? 'Apto para tu carrera' : 'No apto'}
                          </span>
                        )}
                      </div>
                      <div className="course-meta-bottom">
                        <div className="course-price">
                            {c.ES_PAGADO ? `$${parseFloat(c.COSTO || 0).toFixed(2)}` : 'Gratis'}
                        </div>
                        <div className="course-actions">
                          <Link to={`/courses/${c.SECUENCIAL}`} className="btn small">Leer más</Link>
                          {esApto && (
                            <Link to={`/payment/${c.SECUENCIAL}`} className="btn small primary">Entrar ahora</Link>
                          )}
                          {!esApto && (
                            <span className="not-apt-note">Solo para carreras habilitadas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }) : (!loading && <div className="no-courses">No se encontraron eventos.</div>)}
          </div>

        </div>
      </div>
    </div>
  );
}