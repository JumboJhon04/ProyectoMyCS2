import React, { useMemo, useState, useRef } from 'react';
import { useCourses } from '../context/CoursesContext';
import { Link } from 'react-router-dom';
import './landing.css';
import PublicHeader from '../components/PublicHeader/PublicHeader';

export default function Courses() {
  const { courses, loading, error } = useCourses();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!courses) return [];
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [courses, query]);

  return (
    <div>
      <PublicHeader />
      <div style={{ padding: '18px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ margin:0 }}>Cursos</h2>
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
                // si no hay texto, enfocamos el input; si hay, aplicamos el trim (el filtrado es reactivo)
                const q = query.trim();
                if (!q) inputRef.current && inputRef.current.focus();
                else setQuery(q);
              }}
            >Buscar</button>
          </div>
        </div>

        {loading && <div className="courses-loading">Cargando cursos...</div>}
        {error && <div className="courses-error">Error: {error}</div>}

        <div className="courses-grid">
          {filtered && filtered.length > 0 ? filtered.map(c => (
            <article className="course-card" key={c.id}>
              <div className="course-image-wrap">
                <img src={c.imageUrl} alt={c.title} />
              </div>
              <div className="course-body">
                <h4 className="course-title">{c.title}</h4>
                <p className="course-desc">{c.description}</p>
                <div className="course-meta">
                  <div className="course-price">${(c.price || 0).toFixed(2)}</div>
                  <div className="course-actions">
                    <Link to={`/courses/${c.id}`} className="btn small">Leer más</Link>
                    <Link to={`/payment/${c.id}`} className="btn small primary">Entrar ahora</Link>
                  </div>
                </div>
              </div>
            </article>
          )) : (!loading && <div className="no-courses">No se encontraron cursos.</div>)}
        </div>
      </div>
      </div>
    </div>
  );
}
