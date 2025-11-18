import React from 'react';
import './ViewResponsableModal.css';

export default function ViewResponsableModal({ isOpen, onClose, responsable }) {
  if (!isOpen || !responsable) return null;

  return (
    <div className="vrm-overlay" onClick={onClose}>
      <div className="vrm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="vrm-header">
          <h3>Información del Responsable</h3>
          <button className="vrm-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="vrm-content">
          {/* Avatar y nombre principal */}
          <div className="vrm-profile">
            <div className="vrm-avatar-large">
              {`${responsable.NOMBRES[0]}${responsable.APELLIDOS[0]}`.toUpperCase()}
            </div>
            <h2 className="vrm-name">{`${responsable.NOMBRES} ${responsable.APELLIDOS}`}</h2>
            <span className="vrm-role-badge">{responsable.rol || 'Responsable'}</span>
          </div>

          {/* Información personal */}
          <div className="vrm-section">
            <h4 className="vrm-section-title">Información Personal</h4>
            <div className="vrm-info-grid">
              <div className="vrm-info-item">
                <span className="vrm-label">Cédula:</span>
                <span className="vrm-value">{responsable.CEDULA || 'N/A'}</span>
              </div>
              <div className="vrm-info-item">
                <span className="vrm-label">Fecha de Nacimiento:</span>
                <span className="vrm-value">{responsable.date || 'N/A'}</span>
              </div>
              <div className="vrm-info-item">
                <span className="vrm-label">Teléfono:</span>
                <span className="vrm-value">{responsable.TELEFONO || 'N/A'}</span>
              </div>
              <div className="vrm-info-item">
                <span className="vrm-label">Dirección:</span>
                <span className="vrm-value">{responsable.DIRECCION || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="vrm-section">
            <h4 className="vrm-section-title">Información de Contacto</h4>
            <div className="vrm-info-grid">
              <div className="vrm-info-item">
                <span className="vrm-label">Correo Electrónico:</span>
                <span className="vrm-value vrm-email">{responsable.CORREO}</span>
              </div>
              <div className="vrm-info-item">
                <span className="vrm-label">Estado:</span>
                <span className={`vrm-status ${responsable.CODIGOESTADO === 'ACTIVO' ? 'active' : 'inactive'}`}>
                  {responsable.CODIGOESTADO || 'ACTIVO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vrm-footer">
          <button className="vrm-btn vrm-close-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}