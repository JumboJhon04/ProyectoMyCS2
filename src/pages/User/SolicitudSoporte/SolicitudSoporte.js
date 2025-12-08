import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import './SolicitudSoporte.css';

import API_URL from '../../../config/api';

const SolicitudSoporte = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    nombreSolicitante: user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() : '',
    correoContacto: user?.correo || '',
    area: '',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    tipoCambio: 'Corrección',
    prioridad: 'Alta',
    descripcionCambio: ''
  });
  const [archivoEvidencia, setArchivoEvidencia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoEvidencia(e.target.files[0]);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validaciones
      if (!formData.nombreSolicitante || !formData.correoContacto || !formData.descripcionCambio) {
        setMessage({ type: 'error', text: 'Por favor completa todos los campos obligatorios' });
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
      const formDataToSend = new FormData();
      formDataToSend.append('moduloAfectado', formData.area || 'Sistema General');
      formDataToSend.append('tipoSolicitud', formData.tipoCambio);
      formDataToSend.append('descripcion', formData.descripcionCambio);
      formDataToSend.append('justificacion', `Solicitud de ${formData.tipoCambio} - Prioridad: ${formData.prioridad}`);
      formDataToSend.append('urgencia', formData.prioridad);
      if (user?.id) {
        formDataToSend.append('usuarioId', user.id);
      }
      if (archivoEvidencia) {
        formDataToSend.append('archivoEvidencia', archivoEvidencia);
      }

      const response = await fetch(`${API_URL}/api/solicitudes`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Solicitud enviada correctamente. Nos pondremos en contacto contigo pronto.' });
        // Limpiar formulario
        setFormData({
          nombreSolicitante: user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() : '',
          correoContacto: user?.correo || '',
          area: '',
          fechaSolicitud: new Date().toISOString().split('T')[0],
          tipoCambio: 'Corrección',
          prioridad: 'Alta',
          descripcionCambio: ''
        });
        setArchivoEvidencia(null);
        // Limpiar input de archivo
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al enviar la solicitud' });
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor. Por favor intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="solicitud-soporte-container">
      <div className="solicitud-soporte-card">
        <h2 className="solicitud-soporte-title">Formulario de Cambios - Usuario Final</h2>
        
        <form onSubmit={handleSubmit} className="solicitud-soporte-form">
          <div className="form-group">
            <label htmlFor="nombreSolicitante">Nombre del solicitante</label>
            <input
              type="text"
              id="nombreSolicitante"
              name="nombreSolicitante"
              value={formData.nombreSolicitante}
              onChange={handleChange}
              required
              placeholder="Ingresa tu nombre completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="correoContacto">Correo de contacto</label>
            <input
              type="email"
              id="correoContacto"
              name="correoContacto"
              value={formData.correoContacto}
              onChange={handleChange}
              required
              placeholder="tu@correo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Área</label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Ej: Inscripciones, Pagos, Eventos, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaSolicitud">Fecha de solicitud</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="fechaSolicitud"
                name="fechaSolicitud"
                value={formData.fechaSolicitud}
                onChange={handleChange}
                required
              />
              <span className="date-display">{formatDateForDisplay(formData.fechaSolicitud)}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tipoCambio">Tipo de cambio</label>
            <select
              id="tipoCambio"
              name="tipoCambio"
              value={formData.tipoCambio}
              onChange={handleChange}
              required
            >
              <option value="Corrección">Corrección</option>
              <option value="Mejora">Mejora</option>
              <option value="Idea">Idea</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="prioridad">Prioridad</label>
            <select
              id="prioridad"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              required
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="descripcionCambio">Descripción del cambio</label>
            <textarea
              id="descripcionCambio"
              name="descripcionCambio"
              value={formData.descripcionCambio}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Describe detalladamente el problema, mejora o idea que deseas reportar..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="archivoEvidencia">Archivo de evidencia (opcional)</label>
            <input
              type="file"
              id="archivoEvidencia"
              name="archivoEvidencia"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            />
            {archivoEvidencia && (
              <p className="file-selected">Archivo seleccionado: {archivoEvidencia.name}</p>
            )}
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-enviar-solicitud"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SolicitudSoporte;

