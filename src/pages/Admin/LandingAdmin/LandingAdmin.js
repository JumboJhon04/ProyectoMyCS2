import React, { useState, useEffect } from 'react';
import { FaSave, FaImage, FaUndo } from 'react-icons/fa';
import API_URL from '../../../config/api';
import './LandingAdmin.css';

const LandingAdmin = () => {
  const [homeContent, setHomeContent] = useState({
    hero: {
      title: '',
      description: '',
      buttonText: '',
      imageUrl: ''
    },
    testimonials: [
      { name: '', role: '', text: '', avatar: '' },
      { name: '', role: '', text: '', avatar: '' },
      { name: '', role: '', text: '', avatar: '' }
    ],
    sections: {
      coursesTitle: '',
      testimonialsTitle: ''
    }
  });

  const [images, setImages] = useState({
    heroImage: null,
    testimonial1Avatar: null,
    testimonial2Avatar: null,
    testimonial3Avatar: null
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    cargarContenidoHome();
  }, []);

  const cargarContenidoHome = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/config/home`);
      const data = await response.json();
      
      if (data.success) {
        setHomeContent(data.data);
        
        // Establecer URLs de preview existentes
        const previews = {};
        if (data.data.hero?.imageUrl) {
          previews.heroImage = data.data.hero.imageUrl;
        }
        data.data.testimonials?.forEach((t, i) => {
          if (t.avatar) {
            previews[`testimonial${i + 1}Avatar`] = t.avatar;
          }
        });
        setPreviewUrls(previews);
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
      alert('Error al cargar el contenido del home');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value, index = null) => {
    setHomeContent(prev => {
      const newContent = { ...prev };
      
      if (section === 'hero') {
        newContent.hero[field] = value;
      } else if (section === 'testimonials') {
        newContent.testimonials[index][field] = value;
      } else if (section === 'sections') {
        newContent.sections[field] = value;
      }
      
      return newContent;
    });
  };

  const handleImageChange = (fieldName, file) => {
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setImages(prev => ({
      ...prev,
      [fieldName]: file
    }));

    // Crear URL de preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrls(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Agregar contenido como JSON
      formData.append('content', JSON.stringify(homeContent));

      // Agregar imágenes si fueron seleccionadas
      Object.keys(images).forEach(key => {
        if (images[key]) {
          formData.append(key, images[key]);
        }
      });

      const response = await fetch(`${API_URL}/api/config/home`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Contenido actualizado exitosamente');
        cargarContenidoHome(); // Recargar para obtener URLs actualizadas
        
        // Limpiar imágenes seleccionadas
        setImages({
          heroImage: null,
          testimonial1Avatar: null,
          testimonial2Avatar: null,
          testimonial3Avatar: null
        });
      } else {
        alert(data.error || 'Error al actualizar el contenido');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleRecargar = () => {
    if (window.confirm('¿Deseas recargar el contenido? Los cambios no guardados se perderán.')) {
      cargarContenidoHome();
      setImages({
        heroImage: null,
        testimonial1Avatar: null,
        testimonial2Avatar: null,
        testimonial3Avatar: null
      });
    }
  };

  if (loading) {
    return (
      <div className="landing-admin-container">
        <div className="loading-message">Cargando contenido...</div>
      </div>
    );
  }

  return (
    <div className="landing-admin-container">
      <div className="landing-admin-header">
        <h2>Editar Página Principal (Home)</h2>
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={handleRecargar}
            disabled={saving}
          >
            <FaUndo /> Recargar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleGuardar}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="landing-admin-content">
        {/* Sección Hero */}
        <div className="admin-card">
          <h3 className="card-title">Sección Hero (Principal)</h3>
          
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              className="form-input"
              value={homeContent.hero.title}
              onChange={(e) => handleInputChange('hero', 'title', e.target.value)}
              placeholder="Ej: Fundamentos en Python"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              className="form-textarea"
              value={homeContent.hero.description}
              onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
              placeholder="Descripción del curso o mensaje principal"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Texto del Botón</label>
            <input
              type="text"
              className="form-input"
              value={homeContent.hero.buttonText}
              onChange={(e) => handleInputChange('hero', 'buttonText', e.target.value)}
              placeholder="Ej: Saber Más"
            />
          </div>

          <div className="form-group">
            <label>Imagen Hero</label>
            <div className="image-upload-container">
              {previewUrls.heroImage && (
                <div className="image-preview">
                  <img src={previewUrls.heroImage} alt="Hero preview" />
                </div>
              )}
              <label className="btn-upload">
                <FaImage /> Seleccionar Imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange('heroImage', e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </label>
              {images.heroImage && (
                <span className="file-name">{images.heroImage.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Títulos de Secciones */}
        <div className="admin-card">
          <h3 className="card-title">Títulos de Secciones</h3>
          
          <div className="form-group">
            <label>Título Sección Cursos</label>
            <input
              type="text"
              className="form-input"
              value={homeContent.sections.coursesTitle}
              onChange={(e) => handleInputChange('sections', 'coursesTitle', e.target.value)}
              placeholder="Ej: Cursos Populares"
            />
          </div>

          <div className="form-group">
            <label>Título Sección Testimonios</label>
            <input
              type="text"
              className="form-input"
              value={homeContent.sections.testimonialsTitle}
              onChange={(e) => handleInputChange('sections', 'testimonialsTitle', e.target.value)}
              placeholder="Ej: Nuestros estudiantes dicen"
            />
          </div>
        </div>

        {/* Testimonios */}
        <div className="admin-card">
          <h3 className="card-title">Testimonios</h3>
          
          {homeContent.testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-editor">
              <h4>Testimonio {index + 1}</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testimonial.name}
                    onChange={(e) => handleInputChange('testimonials', 'name', e.target.value, index)}
                    placeholder="Nombre del estudiante"
                  />
                </div>

                <div className="form-group">
                  <label>Rol</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testimonial.role}
                    onChange={(e) => handleInputChange('testimonials', 'role', e.target.value, index)}
                    placeholder="Ej: Estudiante, Desarrollador"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Testimonio</label>
                <textarea
                  className="form-textarea"
                  value={testimonial.text}
                  onChange={(e) => handleInputChange('testimonials', 'text', e.target.value, index)}
                  placeholder="Texto del testimonio"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Avatar</label>
                <div className="image-upload-container">
                  {previewUrls[`testimonial${index + 1}Avatar`] && (
                    <div className="image-preview avatar-preview">
                      <img src={previewUrls[`testimonial${index + 1}Avatar`]} alt={`Testimonio ${index + 1}`} />
                    </div>
                  )}
                  <label className="btn-upload">
                    <FaImage /> Seleccionar Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(`testimonial${index + 1}Avatar`, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {images[`testimonial${index + 1}Avatar`] && (
                    <span className="file-name">{images[`testimonial${index + 1}Avatar`].name}</span>
                  )}
                </div>
              </div>

              {index < homeContent.testimonials.length - 1 && <hr className="separator" />}
            </div>
          ))}
        </div>
      </div>

      <div className="landing-admin-footer">
        <button 
          className="btn-primary btn-large" 
          onClick={handleGuardar}
          disabled={saving}
        >
          <FaSave /> {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </button>
      </div>
    </div>
  );
};

export default LandingAdmin;
