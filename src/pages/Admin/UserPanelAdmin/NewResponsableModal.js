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
    }
  }, [isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (onCreate) onCreate(form);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="nr-overlay">
      <div className="nr-modal" role="dialog" aria-modal="true">
        <div className="nr-header">
          <h3>Informacion del responsable</h3>
        </div>

        <form className="nr-form" onSubmit={handleSubmit}>
          <div className="nr-grid">
            <div className="nr-column">
              <label className="nr-label">Nombres
                <input name="nombres" value={form.nombres} onChange={handleChange} />
              </label>

              <label className="nr-label">Cedula
                <input name="cedula" value={form.cedula} onChange={handleChange} />
              </label>

              <label className="nr-label">Telefono
                <input name="telefono" value={form.telefono} onChange={handleChange} />
              </label>

              <label className="nr-label">Correo
                <input name="correo" value={form.correo} onChange={handleChange} />
              </label>
            </div>

            <div className="nr-column">
              <label className="nr-label">Apellidos
                <input name="apellidos" value={form.apellidos} onChange={handleChange} />
              </label>

              <label className="nr-label">Fecha de nacimiento
                <input name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
              </label>

              <label className="nr-label">Direccion
                <input name="direccion" value={form.direccion} onChange={handleChange} />
              </label>

              <label className="nr-label">Contrasena
                <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange} />
              </label>
            </div>
          </div>

          <div className="nr-actions">
            <button type="button" className="nr-btn nr-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="nr-btn nr-create">Crear responsable</button>
          </div>
        </form>
      </div>
    </div>
  );
}
