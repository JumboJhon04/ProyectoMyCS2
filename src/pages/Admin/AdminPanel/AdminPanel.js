import React, { useState, useEffect } from "react";
import { FaImage, FaEdit } from "react-icons/fa";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [eventos, setEventos] = useState([]);
  const [colores, setColores] = useState({
    primario: '#667eea',
    secundario: '#51cf66',
    terciario: '#845ef7'
  });
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [loadingColores, setLoadingColores] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState(null);

  // Cargar eventos al montar
  useEffect(() => {
    cargarEventos();
    cargarColores();
  }, []);

  const cargarEventos = async () => {
    setLoadingEventos(true);
    try {
      const response = await fetch('http://localhost:5000/api/eventos');
      const data = await response.json();
      if (data.success) {
        setEventos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoadingEventos(false);
    }
  };

  const cargarColores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/config/colores');
      const data = await response.json();
      if (data.success) {
        setColores(data.data);
      }
    } catch (error) {
      console.error('Error al cargar colores:', error);
    }
  };

  const handleCambiarImagen = async (eventoId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);

    setUploadingImageId(eventoId);
    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${eventoId}/imagen`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('Imagen actualizada exitosamente');
        cargarEventos(); // Recargar eventos
      } else {
        alert(data.error || 'Error al actualizar imagen');
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      alert('Error al actualizar la imagen');
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleGuardarColores = async () => {
    setLoadingColores(true);
    try {
      const response = await fetch('http://localhost:5000/api/config/colores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          colorPrimario: colores.primario,
          colorSecundario: colores.secundario,
          colorTerciario: colores.terciario
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Colores guardados exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar colores:', error);
      alert('Error al guardar los colores');
    } finally {
      setLoadingColores(false);
    }
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 102, g: 126, b: 234 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const handleColorChange = (color, component, value) => {
    const rgb = hexToRgb(colores[color]);
    rgb[component] = parseInt(value);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setColores(prev => ({ ...prev, [color]: newHex }));
  };

  return (
    <div className="admin-container">
      <main className="main-content1">
        <div className="content-area">
          <div className="content-grid">
            {/* Editar Imágenes de Eventos */}
            <div className="card large-card">
              <div className="card-header">
                <h3>Editar Imágenes de Eventos</h3>
                <span className="event-count">{eventos.length} eventos</span>
              </div>

              <div className="eventos-grid">
                {loadingEventos ? (
                  <div className="loading-message">Cargando eventos...</div>
                ) : eventos.length === 0 ? (
                  <div className="empty-message">
                    <FaImage size={48} color="#ccc" />
                    <p>No hay eventos disponibles</p>
                  </div>
                ) : (
                  eventos.map((evento) => (
                    <div key={evento.SECUENCIAL} className="evento-item">
                      <div className="evento-image">
                        <img 
                          src={evento.URL_IMAGEN || '/placeholder-course.png'} 
                          alt={evento.TITULO}
                          onError={(e) => { e.target.src = '/placeholder-course.png'; }}
                        />
                        <div className="evento-overlay">
                          <label className="btn-change-image">
                            {uploadingImageId === evento.SECUENCIAL ? (
                              <span>Subiendo...</span>
                            ) : (
                              <>
                                <FaEdit />
                                <span>Cambiar Imagen</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCambiarImagen(evento.SECUENCIAL, e.target.files[0])}
                              style={{ display: 'none' }}
                              disabled={uploadingImageId === evento.SECUENCIAL}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="evento-info">
                        <h4>{evento.TITULO}</h4>
                        <span className="evento-tipo">{evento.CODIGOTIPOEVENTO}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Colores de la página */}
            <div className="card">
              <div className="card-header">
                <h3>Colores de la página</h3>
              </div>
              <div className="color-controls">
                {/* Color Primario */}
                <div className="color-section">
                  <label>Color Primario</label>
                  <div className="color-sliders">
                    <div className="color-slider">
                      <span>R</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.primario).r}
                        onChange={(e) => handleColorChange('primario', 'r', e.target.value)}
                        className="slider slider-red"
                      />
                      <span className="value">{hexToRgb(colores.primario).r}</span>
                    </div>
                    <div className="color-slider">
                      <span>G</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.primario).g}
                        onChange={(e) => handleColorChange('primario', 'g', e.target.value)}
                        className="slider slider-green"
                      />
                      <span className="value">{hexToRgb(colores.primario).g}</span>
                    </div>
                    <div className="color-slider">
                      <span>B</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.primario).b}
                        onChange={(e) => handleColorChange('primario', 'b', e.target.value)}
                        className="slider slider-blue"
                      />
                      <span className="value">{hexToRgb(colores.primario).b}</span>
                    </div>
                  </div>
                  <div className="color-preview" style={{ backgroundColor: colores.primario }}>
                    {colores.primario}
                  </div>
                </div>

                {/* Color Secundario */}
                <div className="color-section">
                  <label>Color Secundario</label>
                  <div className="color-sliders">
                    <div className="color-slider">
                      <span>R</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.secundario).r}
                        onChange={(e) => handleColorChange('secundario', 'r', e.target.value)}
                        className="slider slider-red"
                      />
                      <span className="value">{hexToRgb(colores.secundario).r}</span>
                    </div>
                    <div className="color-slider">
                      <span>G</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.secundario).g}
                        onChange={(e) => handleColorChange('secundario', 'g', e.target.value)}
                        className="slider slider-green"
                      />
                      <span className="value">{hexToRgb(colores.secundario).g}</span>
                    </div>
                    <div className="color-slider">
                      <span>B</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.secundario).b}
                        onChange={(e) => handleColorChange('secundario', 'b', e.target.value)}
                        className="slider slider-blue"
                      />
                      <span className="value">{hexToRgb(colores.secundario).b}</span>
                    </div>
                  </div>
                  <div className="color-preview" style={{ backgroundColor: colores.secundario }}>
                    {colores.secundario}
                  </div>
                </div>

                {/* Color Terciario */}
                <div className="color-section">
                  <label>Color Terciario</label>
                  <div className="color-sliders">
                    <div className="color-slider">
                      <span>R</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.terciario).r}
                        onChange={(e) => handleColorChange('terciario', 'r', e.target.value)}
                        className="slider slider-red"
                      />
                      <span className="value">{hexToRgb(colores.terciario).r}</span>
                    </div>
                    <div className="color-slider">
                      <span>G</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.terciario).g}
                        onChange={(e) => handleColorChange('terciario', 'g', e.target.value)}
                        className="slider slider-green"
                      />
                      <span className="value">{hexToRgb(colores.terciario).g}</span>
                    </div>
                    <div className="color-slider">
                      <span>B</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={hexToRgb(colores.terciario).b}
                        onChange={(e) => handleColorChange('terciario', 'b', e.target.value)}
                        className="slider slider-blue"
                      />
                      <span className="value">{hexToRgb(colores.terciario).b}</span>
                    </div>
                  </div>
                  <div className="color-preview" style={{ backgroundColor: colores.terciario }}>
                    {colores.terciario}
                  </div>
                </div>

                <button
                  className="btn-primary btn-save-colors"
                  onClick={handleGuardarColores}
                  disabled={loadingColores}
                >
                  {loadingColores ? 'Guardando...' : 'Guardar Colores'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;