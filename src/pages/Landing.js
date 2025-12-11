import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import API_URL from '../config/api';
import './landing.css';
import PublicHeader from '../components/PublicHeader/PublicHeader';

export default function Landing() {
  const { courses, loading: loadingCourses, error } = useCourses();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const [homeContent, setHomeContent] = useState({
    hero: {
      useCourses: true,
      fallbackTitle: 'Fundamentos en python',
      fallbackDescription: 'En este curso aprenderás desde lo básico hasta programación orientada a objetos.',
      fallbackButtonText: 'Saber Más',
      fallbackImageUrl: '/assets/images/hero-code.png'
    },
    sections: []
  });
  const [loadingHome, setLoadingHome] = useState(true);

  // Cargar colores de la página
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config/colores`);
        const data = await response.json();

        if (data.success) {
          // Aplicar colores a las variables CSS
          document.documentElement.style.setProperty('--color-primary', data.data.primario);
          document.documentElement.style.setProperty('--color-secondary', data.data.secundario);
          document.documentElement.style.setProperty('--color-tertiary', data.data.terciario);
        }
      } catch (error) {
        console.error('Error al cargar colores:', error);
      }
    };

    fetchColors();
  }, []);

  // Cargar contenido del home desde el backend
  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config/home`);
        const data = await response.json();

        if (data.success) {
          // Asegurar que sections sea siempre un array
          const content = {
            ...data.data,
            sections: Array.isArray(data.data.sections) ? data.data.sections : []
          };
          setHomeContent(content);
        }
      } catch (error) {
        console.error('Error al cargar contenido del home:', error);
      } finally {
        setLoadingHome(false);
      }
    };

    fetchHomeContent();
  }, []);

  // Reset index if courses change
  useEffect(() => {
    setIndex(0);
  }, [courses]);

  // Autoplay effect for hero carousel
  useEffect(() => {
    if (!homeContent.hero.useCourses || !courses || courses.length <= 1) return;

    const interval = 5000;

    const play = () => {
      timerRef.current = setTimeout(() => {
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
  }, [courses, paused, index, homeContent.hero.useCourses]);

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

  // Renderizar hero section
  const renderHero = () => {
    if (homeContent.hero.useCourses && courses && courses.length > 0) {
      return (
        <section className="hero">
          <div
            className="hero-inner"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
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

            <button className="hero-control prev" onClick={prev} aria-label="Anterior">‹</button>
            <button className="hero-control next" onClick={next} aria-label="Siguiente">›</button>
          </div>
        </section>
      );
    } else {
      return (
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <h2>{homeContent.hero.fallbackTitle}</h2>
              <p>{homeContent.hero.fallbackDescription}</p>
              <Link to="#courses" className="btn hero-btn">{homeContent.hero.fallbackButtonText}</Link>
            </div>
            <div className="hero-image">
              <img src={homeContent.hero.fallbackImageUrl} alt="hero" />
            </div>
          </div>
        </section>
      );
    }
  };

  // Renderizar sección de cursos
  const renderCoursesSection = (section) => (
    <section id="courses" className="courses-section" key={section.id}>
        <h3 className="landing-section-title">{section.title}</h3>
      {section.description && <p className="section-description">{section.description}</p>}

      {loadingCourses && <div className="courses-loading">Cargando cursos...</div>}
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
          !loadingCourses && <div className="no-courses">No te has inscrito en ningún curso.</div>
        )}
      </div>
    </section>
  );

  // Renderizar sección de testimonios
  const renderTestimonialsSection = (section) => (
    <section className="testimonials" key={section.id}>
        <h3 className="landing-section-title">{section.title}</h3>
      {section.description && <p className="section-description">{section.description}</p>}
      <div className="testi-grid">
        {section.items?.map((testimonial, idx) => (
          <div className="testi-card" key={idx}>
            <img className="testi-avatar" src={testimonial.avatar} alt={testimonial.name} />
            <div className="testi-name">{testimonial.name}</div>
            <div className="testi-role">{testimonial.role}</div>
            <p className="testi-text">{testimonial.text}</p>
          </div>
        ))}
      </div>
    </section>
  );

  // Renderizar sección de contenido con imagen
  const renderContentImageSection = (section) => (
    <section className={`content-image ${section.imagePosition || 'right'}`} key={section.id}>
      <div className="content-image-inner">
        <div className="content-text">
            <h3 className="landing-section-title">{section.title}</h3>
          {section.description && <p className="section-description">{section.description}</p>}
          <div className="content-body" dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
        {section.imageUrl && (
          <div className="content-image-wrap">
            <img src={section.imageUrl} alt={section.title} />
          </div>
        )}
      </div>
    </section>
  );

  // Renderizar sección de solo texto
  const renderTextOnlySection = (section) => (
    <section className="text-only" key={section.id}>
        <h3 className="landing-section-title">{section.title}</h3>
      {section.description && <p className="section-description">{section.description}</p>}
      <div className="text-content" dangerouslySetInnerHTML={{ __html: section.content }} />
    </section>
  );

  // Renderizar sección de tarjetas
  const renderCardsSection = (section) => (
    <section className="cards-section" key={section.id}>
        <h3 className="landing-section-title">{section.title}</h3>
      {section.description && <p className="section-description">{section.description}</p>}
      <div className="cards-grid">
        {section.items?.map((card, idx) => (
          <div className="feature-card" key={idx}>
            {card.imageUrl && (
              <div className="card-image">
                <img src={card.imageUrl} alt={card.title} />
              </div>
            )}
            <h4>{card.title}</h4>
            <p>{card.description}</p>
            {card.link && (
              <Link to={card.link} className="btn small">Ver más</Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  // Renderizar sección de galería
  const renderGallerySection = (section) => (
    <section className="gallery-section" key={section.id}>
        <h3 className="landing-section-title">{section.title}</h3>
      {section.description && <p className="section-description">{section.description}</p>}
      <div className="gallery-grid">
        {section.images?.map((img, idx) => (
          <div className="gallery-item" key={idx}>
            <img src={img.url} alt={img.caption || `Imagen ${idx + 1}`} />
            {img.caption && <p className="gallery-caption">{img.caption}</p>}
          </div>
        ))}
      </div>
    </section>
  );

  // Renderizar sección CTA
  const renderCTASection = (section) => (
    <section className="cta-section" key={section.id}>
      <div className="cta-inner">
        <h3>{section.title}</h3>
        {section.description && <p>{section.description}</p>}
        {section.buttonText && (
          <Link to={section.buttonLink || '#'} className="btn hero-btn">
            {section.buttonText}
          </Link>
        )}
      </div>
    </section>
  );

  // Renderizar sección según su tipo
  const renderSection = (section) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'courses':
        return renderCoursesSection(section);
      case 'testimonials':
        return renderTestimonialsSection(section);
      case 'content-image':
        return renderContentImageSection(section);
      case 'text-only':
        return renderTextOnlySection(section);
      case 'cards':
        return renderCardsSection(section);
      case 'gallery':
        return renderGallerySection(section);
      case 'cta':
        return renderCTASection(section);
      default:
        return null;
    }
  };

  if (loadingHome) {
    return (
      <div className="landing-page">
        <PublicHeader />
        <div className="loading-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <PublicHeader />

      {renderHero()}

      {/* Renderizar secciones ordenadas */}
      {Array.isArray(homeContent.sections) && (() => {
        const sortedSections = homeContent.sections
          .filter(s => s.enabled)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const result = [];
        let ctaGroup = [];

        sortedSections.forEach((section, index) => {
          if (section.type === 'cta') {
            // Agrupar CTAs consecutivas
            ctaGroup.push(section);

            // Si es la última sección o la siguiente no es CTA, renderizar el grupo
            const nextSection = sortedSections[index + 1];
            if (!nextSection || nextSection.type !== 'cta') {
              result.push(
                <div key={`cta-group-${section.id}`} className="cta-sections-container">
                  {ctaGroup.map(cta => renderSection(cta))}
                </div>
              );
              ctaGroup = [];
            }
          } else {
            result.push(renderSection(section));
          }
        });

        return <>{result}</>;
      })()}
    </div>
  );
}
