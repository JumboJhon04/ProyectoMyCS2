import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import './landing.css';
import PublicHeader from '../components/PublicHeader/PublicHeader';

export default function Landing() {
  const { courses, loading, error } = useCourses();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  // Reset index if courses change
  useEffect(() => {
    setIndex(0);
  }, [courses]);

  // Autoplay effect
  useEffect(() => {
    // no autoplay if no multiple courses
    if (!courses || courses.length <= 1) return;

    const interval = 5000; // 5s

    const play = () => {
      timerRef.current = setTimeout(() => {
        // fade out, change index, fade in
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => (i + 1) % courses.length);
          setVisible(true);
        }, 350);
      }, interval);
    };

    if (!paused) play();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [courses, paused, index]);

  const goTo = (i) => {
    if (!courses || courses.length === 0) return;
    setVisible(false);
    setTimeout(() => {
      setIndex(i % courses.length);
      setVisible(true);
    }, 250);
  };

  const prev = () => goTo((index - 1 + (courses?.length || 1)) % (courses?.length || 1));
  const next = () => goTo((index + 1) % (courses?.length || 1));
  return (
    <div className="landing-page">
      <PublicHeader />

      <section className="hero">
        <div
          className="hero-inner"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/** Carousel: mostrar curso en index si existe, sino fallback */}
          {courses && courses.length > 0 ? (
            <>
              <div className={`hero-copy ${visible ? 'visible' : 'hidden'}`}>
                <h2>{courses[index].title}</h2>
                <p>{courses[index].description}</p>
                <Link to={`/courses/${courses[index].id}`} className="btn hero-btn">Saber Más</Link>
              </div>
              <div className={`hero-image ${visible ? 'visible' : 'hidden'}`}>
                <img src={courses[index].imageUrl} alt={courses[index].title} />
                <div className="carousel-dots">
                  {courses.map((_, i) => (
                    <button
                      key={i}
                      className={`dot ${i === index ? 'active' : ''}`}
                      onClick={() => goTo(i)}
                      aria-label={`Ir al slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Controles fuera del bloque de imagen/texto para evitar superposición */}
              <button className="hero-control prev" onClick={prev} aria-label="Anterior">‹</button>
              <button className="hero-control next" onClick={next} aria-label="Siguiente">›</button>
                </>
          ) : (
            <>
              <div className="hero-copy">
                <h2>Fundamentos en python</h2>
                <p>En este curso aprenderás desde lo básico hasta programación orientada a objetos.</p>
                <Link to="#courses" className="btn hero-btn">Saber Más</Link>
              </div>
              <div className="hero-image">
                <img src="/assets/images/hero-code.png" alt="hero" />
              </div>
            </>
          )}
        </div>
      </section>

      <section id="courses" className="courses-section">
        <h3 className="section-title">Cursos Populares</h3>

        {loading && <div className="courses-loading">Cargando cursos...</div>}
        {error && <div className="courses-error">Error: {error}</div>}

        <div className="courses-grid">
          {courses && courses.length > 0 ? (
            courses.map((c) => (
              <article className="course-card" key={c.id}>
                <div className="course-image-wrap">
                  <img src={c.imageUrl} alt={c.title} />
                </div>
                <div className="course-body">
                  <h4 className="course-title">{c.title}</h4>
                  <p className="course-desc">{c.description}</p>
                  <div className="course-meta">
                    <div className="course-price">${c.price.toFixed(2)}</div>
                    <div className="course-actions">
                      <Link to={`/courses/${c.id}`} className="btn small">Leer más</Link>
                      <Link to={`/payment/${c.id}`} className="btn small primary">Entrar ahora</Link>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            !loading && <div className="no-courses">No hay cursos disponibles.</div>
          )}
        </div>
      </section>

      <section className="testimonials">
        <h3 className="section-title">Nuestros estudiantes dicen</h3>
        <div className="testi-grid">
          <div className="testi-card">
            <img className="testi-avatar" src="https://i.pravatar.cc/120?img=32" alt="Estudiante 1" />
            <div className="testi-name">María López</div>
            <div className="testi-role">Estudiante</div>
            <p className="testi-text">Este curso me ayudó a entender los conceptos básicos y a ganar confianza para seguir aprendiendo. ¡Lo recomiendo!</p>
          </div>
          <div className="testi-card">
            <img className="testi-avatar" src="https://i.pravatar.cc/120?img=15" alt="Estudiante 2" />
            <div className="testi-name">Carlos Ramírez</div>
            <div className="testi-role">Desarrollador</div>
            <p className="testi-text">Las clases son prácticas y claras. Pude aplicar lo aprendido en proyectos reales en poco tiempo.</p>
          </div>
          <div className="testi-card">
            <img className="testi-avatar" src="https://i.pravatar.cc/120?img=47" alt="Estudiante 3" />
            <div className="testi-name">Ana Pérez</div>
            <div className="testi-role">Analista</div>
            <p className="testi-text">Excelente contenido y buen ritmo. El soporte del responsable fue muy útil.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
