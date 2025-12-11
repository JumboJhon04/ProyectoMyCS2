import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaEye, FaEyeSlash, FaUndo, FaImage } from 'react-icons/fa';
import API_URL from '../../../config/api';
import './LandingAdminAdvanced.css';

const SECTION_TYPES = [
  { value: 'courses', label: 'Cursos (automático)', icon: '📚' },
  { value: 'testimonials', label: 'Testimonios', icon: '💬' },
  { value: 'content-image', label: 'Contenido con Imagen', icon: '🖼️' },
  { value: 'text-only', label: 'Solo Texto', icon: '📝' },
  { value: 'cards', label: 'Tarjetas/Cards', icon: '🎴' },
  { value: 'gallery', label: 'Galería de Imágenes', icon: '🖼️' },
  { value: 'cta', label: 'Call to Action', icon: '📢' }
];

const LandingAdminAdvanced = () => {
  const [homeContent, setHomeContent] = useState({
    header: {
      siteName: 'Cursos UTA',
      menuItems: [
        { label: 'Inicio', link: '/' },
        { label: 'Cursos', link: '/courses' },
        { label: 'Contactos', link: '/contact' }
      ]
    },
    hero: {
      useCourses: true,
      fallbackTitle: '',
      fallbackDescription: '',
      fallbackButtonText: '',
      fallbackImageUrl: ''
    },
    sections: []
  });

  const [images, setImages] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarContenidoHome();
  }, []);

  const cargarContenidoHome = async () => {
    setLoading(true);
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
        
        // Establecer URLs de preview existentes
        const previews = {};
        if (data.data.hero?.fallbackImageUrl) {
          previews.heroFallbackImage = data.data.hero.fallbackImageUrl;
        }
        
        // Procesar imágenes de secciones
        const sections = Array.isArray(data.data.sections) ? data.data.sections : [];
        sections.forEach((section, sIdx) => {
          if (section.type === 'testimonials' && section.items) {
            section.items.forEach((item, iIdx) => {
              if (item.avatar) {
                previews[`section_${sIdx}_item_${iIdx}_avatar`] = item.avatar;
              }
            });
          } else if (section.type === 'content-image' && section.imageUrl) {
            previews[`section_${sIdx}_image`] = section.imageUrl;
          } else if (section.type === 'gallery' && section.images) {
            section.images.forEach((img, imgIdx) => {
              if (img.url) {
                previews[`section_${sIdx}_gallery_${imgIdx}`] = img.url;
              }
            });
          } else if (section.type === 'cards' && section.items) {
            section.items.forEach((item, iIdx) => {
              if (item.imageUrl) {
                previews[`section_${sIdx}_card_${iIdx}_image`] = item.imageUrl;
              }
            });
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

  const handleHeroChange = (field, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const handleImageChange = (fieldName, file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setImages(prev => ({
      ...prev,
      [fieldName]: file
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrls(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const agregarSeccion = (type) => {
    const newSection = {
      id: `section_${Date.now()}`,
      type,
      enabled: true,
      order: homeContent.sections.length + 1,
      title: 'Nueva Sección',
      description: ''
    };

    // Agregar campos específicos según el tipo
    if (type === 'testimonials') {
      newSection.items = [
        { name: '', role: '', text: '', avatar: '' }
      ];
    } else if (type === 'content-image') {
      newSection.content = '';
      newSection.imageUrl = '';
      newSection.imagePosition = 'right';
    } else if (type === 'cards') {
      newSection.items = [
        { title: '', description: '', imageUrl: '', link: '' }
      ];
    } else if (type === 'gallery') {
      newSection.images = [
        { url: '', caption: '' }
      ];
    } else if (type === 'cta') {
      newSection.buttonText = 'Saber más';
      newSection.buttonLink = '#';
    }

    setHomeContent(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const eliminarSeccion = (index) => {
    if (window.confirm('¿Estás seguro de eliminar esta sección?')) {
      setHomeContent(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index)
      }));
    }
  };

  const moverSeccion = (index, direction) => {
    const newSections = [...homeContent.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    // Actualizar el campo order para todas las secciones según su nueva posición
    newSections.forEach((section, idx) => {
      section.order = idx + 1;
    });
    
    setHomeContent(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const toggleSeccionEnabled = (index) => {
    setHomeContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, enabled: !section.enabled } : section
      )
    }));
  };

  const updateSeccion = (index, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const agregarItem = (sectionIndex, type) => {
    setHomeContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i !== sectionIndex) return section;
        
        const newItem = type === 'testimonial' 
          ? { name: '', role: '', text: '', avatar: '' }
          : type === 'card'
          ? { title: '', description: '', imageUrl: '', link: '' }
          : { url: '', caption: '' };
        
        return {
          ...section,
          items: section.items ? [...section.items, newItem] : [newItem],
          images: section.images ? [...section.images, newItem] : undefined
        };
      })
    }));
  };

  const eliminarItem = (sectionIndex, itemIndex) => {
    setHomeContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i !== sectionIndex) return section;
        
        return {
          ...section,
          items: section.items?.filter((_, idx) => idx !== itemIndex),
          images: section.images?.filter((_, idx) => idx !== itemIndex)
        };
      })
    }));
  };

  const updateItem = (sectionIndex, itemIndex, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i !== sectionIndex) return section;
        
        if (section.items) {
          return {
            ...section,
            items: section.items.map((item, idx) => 
              idx === itemIndex ? { ...item, [field]: value } : item
            )
          };
        }
        
        if (section.images) {
          return {
            ...section,
            images: section.images.map((img, idx) => 
              idx === itemIndex ? { ...img, [field]: value } : img
            )
          };
        }
        
        return section;
      })
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      formData.append('content', JSON.stringify(homeContent));

      // Agregar todas las imágenes
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
        cargarContenidoHome();
        setImages({});
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

  const renderSectionEditor = (section, sectionIndex) => {
    switch (section.type) {
      case 'courses':
        return (
          <div className="section-info">
            <p>Esta sección muestra automáticamente todos los cursos disponibles.</p>
          </div>
        );

      case 'testimonials':
        return (
          <div className="testimonials-editor">
            {section.items?.map((item, itemIndex) => (
              <div key={itemIndex} className="item-editor">
                <div className="item-header">
                  <h5>Testimonio {itemIndex + 1}</h5>
                  <button
                    type="button"
                    className="btn-delete-item"
                    onClick={() => eliminarItem(sectionIndex, itemIndex)}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'name', e.target.value)}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rol</label>
                    <input
                      type="text"
                      value={item.role || ''}
                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'role', e.target.value)}
                      placeholder="Rol"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Testimonio</label>
                  <textarea
                    value={item.text || ''}
                    onChange={(e) => updateItem(sectionIndex, itemIndex, 'text', e.target.value)}
                    placeholder="Texto del testimonio"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Avatar</label>
                  <div className="image-upload">
                    {previewUrls[`section_${sectionIndex}_item_${itemIndex}_avatar`] && (
                      <img 
                        src={previewUrls[`section_${sectionIndex}_item_${itemIndex}_avatar`]} 
                        alt="Avatar"
                        className="preview-avatar"
                      />
                    )}
                    <label className="btn-upload">
                      <FaImage /> Seleccionar Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(`section_${sectionIndex}_item_${itemIndex}_avatar`, e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add-item"
              onClick={() => agregarItem(sectionIndex, 'testimonial')}
            >
              <FaPlus /> Agregar Testimonio
            </button>
          </div>
        );

      case 'content-image':
        return (
          <div className="content-image-editor">
            <div className="form-group">
              <label>Contenido</label>
              <textarea
                value={section.content || ''}
                onChange={(e) => updateSeccion(sectionIndex, 'content', e.target.value)}
                placeholder="Texto del contenido"
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label>Posición de Imagen</label>
              <select
                value={section.imagePosition || 'right'}
                onChange={(e) => updateSeccion(sectionIndex, 'imagePosition', e.target.value)}
              >
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Imagen</label>
              <div className="image-upload">
                {previewUrls[`section_${sectionIndex}_image`] && (
                  <img 
                    src={previewUrls[`section_${sectionIndex}_image`]} 
                    alt="Contenido"
                    className="preview-image"
                  />
                )}
                <label className="btn-upload">
                  <FaImage /> Seleccionar Imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(`section_${sectionIndex}_image`, e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'text-only':
        return (
          <div className="form-group">
            <label>Contenido</label>
            <textarea
              value={section.content || ''}
              onChange={(e) => updateSeccion(sectionIndex, 'content', e.target.value)}
              placeholder="Texto del contenido"
              rows="6"
            />
          </div>
        );

      case 'cta':
        return (
          <div className="cta-editor">
            <div className="form-group">
              <label>Texto del Botón</label>
              <input
                type="text"
                value={section.buttonText || ''}
                onChange={(e) => updateSeccion(sectionIndex, 'buttonText', e.target.value)}
                placeholder="Texto del botón"
              />
            </div>
            
            <div className="form-group">
              <label>Enlace del Botón</label>
              <input
                type="text"
                value={section.buttonLink || ''}
                onChange={(e) => updateSeccion(sectionIndex, 'buttonLink', e.target.value)}
                placeholder="URL o ruta"
              />
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="cards-editor">
            {section.items?.map((item, itemIndex) => (
              <div key={itemIndex} className="item-editor">
                <div className="item-header">
                  <h5>Tarjeta {itemIndex + 1}</h5>
                  <button
                    type="button"
                    className="btn-delete-item"
                    onClick={() => eliminarItem(sectionIndex, itemIndex)}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItem(sectionIndex, itemIndex, 'title', e.target.value)}
                    placeholder="Título"
                  />
                </div>
                
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateItem(sectionIndex, itemIndex, 'description', e.target.value)}
                    placeholder="Descripción"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Enlace</label>
                  <input
                    type="text"
                    value={item.link || ''}
                    onChange={(e) => updateItem(sectionIndex, itemIndex, 'link', e.target.value)}
                    placeholder="URL"
                  />
                </div>
                
                <div className="form-group">
                  <label>Imagen</label>
                  <div className="image-upload">
                    {previewUrls[`section_${sectionIndex}_card_${itemIndex}_image`] && (
                      <img 
                        src={previewUrls[`section_${sectionIndex}_card_${itemIndex}_image`]} 
                        alt="Card"
                        className="preview-image"
                      />
                    )}
                    <label className="btn-upload">
                      <FaImage /> Seleccionar Imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(`section_${sectionIndex}_card_${itemIndex}_image`, e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add-item"
              onClick={() => agregarItem(sectionIndex, 'card')}
            >
              <FaPlus /> Agregar Tarjeta
            </button>
          </div>
        );

      case 'gallery':
        return (
          <div className="gallery-editor">
            {section.images?.map((img, imgIndex) => (
              <div key={imgIndex} className="item-editor">
                <div className="item-header">
                  <h5>Imagen {imgIndex + 1}</h5>
                  <button
                    type="button"
                    className="btn-delete-item"
                    onClick={() => eliminarItem(sectionIndex, imgIndex)}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Imagen</label>
                  <div className="image-upload">
                    {previewUrls[`section_${sectionIndex}_gallery_${imgIndex}`] && (
                      <img 
                        src={previewUrls[`section_${sectionIndex}_gallery_${imgIndex}`]} 
                        alt="Gallery"
                        className="preview-image"
                      />
                    )}
                    <label className="btn-upload">
                      <FaImage /> Seleccionar Imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(`section_${sectionIndex}_gallery_${imgIndex}`, e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={img.caption || ''}
                    onChange={(e) => updateItem(sectionIndex, imgIndex, 'caption', e.target.value)}
                    placeholder="Descripción de la imagen"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add-item"
              onClick={() => agregarItem(sectionIndex, 'gallery')}
            >
              <FaPlus /> Agregar Imagen
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="landing-admin-advanced">
        <div className="loading-message">Cargando contenido...</div>
      </div>
    );
  }

  return (
    <div className="landing-admin-advanced">
      <div className="admin-header">
        <h2>Editor Avanzado de Landing Page</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={cargarContenidoHome} disabled={saving}>
            <FaUndo /> Recargar
          </button>
          <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
            <FaSave /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Header Configuration */}
        <div className="admin-card">
          <h3 className="card-title">Configuración del Header/Menú</h3>
          
          <div className="form-group">
            <label>Nombre del Sitio</label>
            <input
              type="text"
              value={homeContent.header?.siteName || ''}
              onChange={(e) => setHomeContent(prev => ({
                ...prev,
                header: { ...prev.header, siteName: e.target.value }
              }))}
              placeholder="Ej: Cursos UTA"
            />
          </div>

          <div className="form-group">
            <label>Elementos del Menú</label>
            {homeContent.header?.menuItems?.map((item, index) => (
              <div key={index} className="menu-item-editor">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => {
                    const newItems = [...homeContent.header.menuItems];
                    newItems[index].label = e.target.value;
                    setHomeContent(prev => ({
                      ...prev,
                      header: { ...prev.header, menuItems: newItems }
                    }));
                  }}
                  placeholder="Texto del menú"
                />
                <input
                  type="text"
                  value={item.link}
                  onChange={(e) => {
                    const newItems = [...homeContent.header.menuItems];
                    newItems[index].link = e.target.value;
                    setHomeContent(prev => ({
                      ...prev,
                      header: { ...prev.header, menuItems: newItems }
                    }));
                  }}
                  placeholder="Enlace (ej: /courses)"
                />
                <button
                  className="btn-icon btn-danger"
                  onClick={() => {
                    const newItems = homeContent.header.menuItems.filter((_, i) => i !== index);
                    setHomeContent(prev => ({
                      ...prev,
                      header: { ...prev.header, menuItems: newItems }
                    }));
                  }}
                  title="Eliminar"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              className="btn-secondary"
              onClick={() => {
                const newItems = [...(homeContent.header?.menuItems || []), { label: 'Nuevo', link: '#' }];
                setHomeContent(prev => ({
                  ...prev,
                  header: { ...prev.header, menuItems: newItems }
                }));
              }}
            >
              <FaPlus /> Agregar elemento del menú
            </button>
          </div>
        </div>

        {/* Hero Configuration */}
        <div className="admin-card">
          <h3 className="card-title">Configuración Hero</h3>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={homeContent.hero.useCourses}
                onChange={(e) => handleHeroChange('useCourses', e.target.checked)}
              />
              Usar carrusel de cursos en Hero
            </label>
            <p className="help-text">Si está activado, mostrará automáticamente todos los cursos disponibles.</p>
          </div>

          {!homeContent.hero.useCourses && (
            <>
              <div className="form-group">
                <label>Título (Fallback)</label>
                <input
                  type="text"
                  value={homeContent.hero.fallbackTitle}
                  onChange={(e) => handleHeroChange('fallbackTitle', e.target.value)}
                  placeholder="Título principal"
                />
              </div>

              <div className="form-group">
                <label>Descripción (Fallback)</label>
                <textarea
                  value={homeContent.hero.fallbackDescription}
                  onChange={(e) => handleHeroChange('fallbackDescription', e.target.value)}
                  placeholder="Descripción"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Texto del Botón (Fallback)</label>
                <input
                  type="text"
                  value={homeContent.hero.fallbackButtonText}
                  onChange={(e) => handleHeroChange('fallbackButtonText', e.target.value)}
                  placeholder="Texto del botón"
                />
              </div>

              <div className="form-group">
                <label>Imagen (Fallback)</label>
                <div className="image-upload">
                  {previewUrls.heroFallbackImage && (
                    <img 
                      src={previewUrls.heroFallbackImage} 
                      alt="Hero"
                      className="preview-image"
                    />
                  )}
                  <label className="btn-upload">
                    <FaImage /> Seleccionar Imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange('heroFallbackImage', e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Secciones con Preview */}
        <div className="editor-preview-container">
          {/* Editor de Secciones */}
          <div className="sections-editor">
            <div className="sections-manager">
              <div className="sections-header">
                <h3>Secciones del Landing</h3>
                <div className="add-section-menu">
                  <button className="btn-primary">
                    <FaPlus /> Agregar Sección
                  </button>
                  <div className="dropdown-menu">
                    {SECTION_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => agregarSeccion(type.value)}
                      >
                        <span className="icon">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {Array.isArray(homeContent.sections) && homeContent.sections.map((section, index) => (
            <div key={section.id} className={`section-card ${!section.enabled ? 'disabled' : ''}`}>
              <div className="section-header">
                <div className="section-info">
                  <span className="section-type">
                    {SECTION_TYPES.find(t => t.value === section.type)?.icon} {SECTION_TYPES.find(t => t.value === section.type)?.label}
                  </span>
                  <span className="section-order">Orden: {index + 1}</span>
                </div>
                
                <div className="section-actions">
                  <button
                    onClick={() => toggleSeccionEnabled(index)}
                    title={section.enabled ? 'Ocultar' : 'Mostrar'}
                  >
                    {section.enabled ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button
                    onClick={() => moverSeccion(index, 'up')}
                    disabled={index === 0}
                    title="Mover arriba"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    onClick={() => moverSeccion(index, 'down')}
                    disabled={index === homeContent.sections.length - 1}
                    title="Mover abajo"
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    onClick={() => eliminarSeccion(index)}
                    title="Eliminar"
                    className="btn-danger"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="section-content">
                <div className="form-group">
                  <label>Título de la Sección</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSeccion(index, 'title', e.target.value)}
                    placeholder="Título"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción (opcional)</label>
                  <input
                    type="text"
                    value={section.description || ''}
                    onChange={(e) => updateSeccion(index, 'description', e.target.value)}
                    placeholder="Descripción breve"
                  />
                </div>

                {renderSectionEditor(section, index)}
              </div>
            </div>
          ))}

          {homeContent.sections.length === 0 && (
            <div className="empty-sections">
              <p>No hay secciones agregadas. Haz clic en "Agregar Sección" para comenzar.</p>
            </div>
          )}
            </div>
          </div>

          {/* Preview en vivo */}
          <div className="live-preview">
            <div className="preview-header">
              <h3>Vista Previa en Vivo</h3>
              <span className="preview-note">Se actualiza automáticamente</span>
            </div>
            <div className="preview-wrapper">
              <div className="preview-mobile">
                <div className="mobile-frame">
                  <div className="mobile-content">
                    {/* Hero Section */}
                    <div className="preview-section-hero">
                      <div className="preview-hero-title">{homeContent.hero.fallbackTitle || 'Título del Hero'}</div>
                      <div className="preview-hero-description">{homeContent.hero.fallbackDescription || 'Descripción...'}</div>
                    </div>

                    {/* Sections Preview */}
                    {Array.isArray(homeContent.sections) && homeContent.sections
                      .filter(s => s.enabled)
                      .map((section, idx) => (
                        <div key={idx} className="preview-section-item">
                          <div className="preview-section-title">{section.title || `Sección ${idx + 1}`}</div>
                          {section.description && (
                            <div className="preview-section-desc">{section.description}</div>
                          )}
                          <div className="preview-section-content">
                            {section.type === 'courses' && '📚 Cursos'}
                            {section.type === 'testimonials' && '💬 Testimonios'}
                            {section.type === 'content-image' && '🖼️ Contenido con Imagen'}
                            {section.type === 'text-only' && '📝 Texto'}
                            {section.type === 'cards' && '🎴 Tarjetas'}
                            {section.type === 'gallery' && '🖼️ Galería'}
                            {section.type === 'cta' && '📢 Call to Action'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-footer">
        <button className="btn-primary btn-large" onClick={handleGuardar} disabled={saving}>
          <FaSave /> {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </button>
      </div>
    </div>
  );
};

export default LandingAdminAdvanced;
