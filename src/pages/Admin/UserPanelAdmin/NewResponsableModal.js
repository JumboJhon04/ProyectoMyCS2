import React, { useState, useEffect } from 'react';
import './NewResponsableModal.css';

export default function NewResponsableModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    correo: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm({
        nombres: '',
        apellidos: '',
        cedula: '',
        fechaNacimiento: '',
        telefono: '',
        direccion: '',
        correo: '',
        contrasena: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!form.nombres || !form.apellidos || !form.cedula || !form.correo || !form.contrasena || !form.telefono) {
      setError('Todos los campos obligatorios deben estar completos');
      return;
    }

    if (form.cedula.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      return;
    }

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/auth/responsables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear responsable');
      }

      console.log('✅ Responsable creado:', data.data);

      // Llamar callback con los datos del nuevo responsable
      if (onCreate) {
        onCreate(data.data);
      }

      // Cerrar modal
      if (onClose) {
        onClose();
      }

    } catch (err) {
      console.error('Error al crear responsable:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nr-overlay" onClick={onClose}>
      <div className="nr-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="nr-header">
          <h3>Información del responsable</h3>
          <button className="nr-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <form className="nr-form" onSubmit={handleSubmit}>
          <div className="nr-grid">
            <div className="nr-column">
              <label className="nr-label">
                Nombres *
                <input 
                  name="nombres" 
                  value={form.nombres} 
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="nr-label">
                Cédula *
                <input 
                  name="cedula" 
                  value={form.cedula} 
                  onChange={handleChange}
                  maxLength="10"
                  required
                />
              </label>

              <label className="nr-label">
                Teléfono *
                <input 
                  name="telefono" 
                  value={form.telefono} 
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="nr-label">
                Correo *
                <input 
                  name="correo" 
                  type="email"
                  value={form.correo} 
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="nr-column">
              <label className="nr-label">
                Apellidos *
                <input 
                  name="apellidos" 
                  value={form.apellidos} 
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="nr-label">
                Fecha de nacimiento
                <input 
                  name="fechaNacimiento" 
                  type="date" 
                  value={form.fechaNacimiento} 
                  onChange={handleChange}
                />
              </label>

              <label className="nr-label">
                Dirección
                <input 
                  name="direccion" 
                  value={form.direccion} 
                  onChange={handleChange}
                />
              </label>

              <label className="nr-label">
                Contraseña *
                <input 
                  name="contrasena" 
                  type="password" 
                  value={form.contrasena} 
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                  required
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="nr-error">
              {error}
            </div>
          )}

          <div className="nr-actions">
            <button 
              type="button" 
              className="nr-btn nr-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="nr-btn nr-create"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear responsable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}