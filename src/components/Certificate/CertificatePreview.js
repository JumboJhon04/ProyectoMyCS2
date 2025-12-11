import React from 'react';
import { FaShieldAlt, FaDownload, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import './CertificatePreview.css';

const Requirement = ({ ok, label, value }) => (
  <div className={`cert-req ${ok ? 'ok' : 'pending'}`}>
    {ok ? <FaCheckCircle /> : <FaTimesCircle />}
    <div>
      <div className="cert-req-label">{label}</div>
      <div className="cert-req-value">{value}</div>
    </div>
  </div>
);

const CertificatePreview = ({ data, loading, error, onDownload, canDownload }) => {
  if (loading) return <div className="cert-card">Cargando certificado...</div>;
  if (error) return <div className="cert-card error">{error}</div>;
  if (!data) return <div className="cert-card">Aún no hay información de certificado.</div>;

  const elegible = canDownload !== undefined ? canDownload : data.elegible;

  return (
    <div className="cert-card">
      <div className="cert-card-header">
        <div>
          <p className="eyebrow">Certificado digital</p>
          <h3>{data.TITULO}</h3>
          <p className="cert-student">{data.APELLIDOS} {data.NOMBRES}</p>
        </div>
        <div className={`cert-status ${elegible ? 'ready' : 'locked'}`}>
          <FaShieldAlt /> {elegible ? 'Listo para descargar' : 'Pendiente de requisitos'}
        </div>
      </div>

      <div className="cert-preview">
        <div className="cert-preview-body">
          <div className="cert-title">Certificado de Aprobación</div>
          <div className="cert-name">{data.APELLIDOS} {data.NOMBRES}</div>
          <div className="cert-desc">
            Completa el evento "{data.TITULO}" con {data.HORAS || 0} horas académicas.
          </div>
          <div className="cert-footer">
            <div>
              <div className="cert-label">Fecha fin</div>
              <div className="cert-value">{data.FECHAFIN ? new Date(data.FECHAFIN).toLocaleDateString('es-ES') : '-'}</div>
            </div>
            <div>
              <div className="cert-label">Docente</div>
              <div className="cert-value">{data.docenteNombreCompleto || 'Docente asignado'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cert-grid">
        <Requirement ok={data.razones?.nota} label="Nota mínima" value={`${data.NOTA || 0} / ${data.NOTAAPROBACION || data.NOTA_MINIMA || 0}`} />
        <Requirement ok={data.razones?.asistencia} label="Asistencia" value={`${data.ASISTENCIA || 0}% / ${data.ASISTENCIAMINIMA || 0}%`} />
        <Requirement ok={data.razones?.cursoFinalizado} label="Estado del curso" value={data.estadoEvento} />
        <div className="cert-req time">
          <FaClock />
          <div>
            <div className="cert-req-label">Horas</div>
            <div className="cert-req-value">{data.HORAS || 0} h</div>
          </div>
        </div>
      </div>

      <div className="cert-actions">
        <button className="btn-primary" onClick={onDownload} disabled={!elegible}>
          <FaDownload /> Descargar PDF
        </button>
        {!elegible && <p className="cert-hint">Debes cumplir nota y asistencia mínimas para habilitar la descarga.</p>}
      </div>
    </div>
  );
};

export default CertificatePreview;
