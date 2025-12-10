import React, { useEffect, useState } from 'react';
import API_URL from '../../../config/api';
import './EventoAdmin.css';

export default function AssignResponsableModal({ isOpen, onClose, course, onSaved }) {
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [responsableId, setResponsableId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setResponsableId('');
    fetchResponsables();
  }, [isOpen]);

  const fetchResponsables = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/responsables`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        setResponsables(data.data);
      } else {
        setError(data.error || 'No se pudieron cargar los responsables');
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar responsables');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    try {
      setSaving(true);
      const resp = await fetch(`${API_URL}/api/eventos/${course.id}/responsable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsableId: responsableId || null })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'No se pudo actualizar el responsable');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3 className="modal-title">Asignar responsable</h3>
        <p style={{ marginTop: '-6px', color: '#555' }}>{course?.title}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <label style={{ fontWeight: 600 }}>Responsable</label>
          <select
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }}
          >
            <option value="">-- Seleccione responsable --</option>
            {loading ? (
              <option disabled>Cargando responsables...</option>
            ) : (
              responsables.map(r => (
                <option key={r.id} value={r.id}>
                  {r.NOMBRES} {r.APELLIDOS} ({r.CORREO})
                </option>
              ))
            )}
          </select>

          {error && <div className="form-error" style={{ color: 'red' }}>{error}</div>}

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
