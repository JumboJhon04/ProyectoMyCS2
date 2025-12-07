import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaFilePdf, FaImage, FaSpinner, FaUsers, FaMoneyCheckAlt } from 'react-icons/fa';
import './UsersResponsable.css';

const UsersResponsable = () => {
  const [activeTab, setActiveTab] = useState('pagos'); // 'usuarios' o 'pagos'
  const [usuarios, setUsuarios] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(null);

  // Cargar usuarios
  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsuarios();
    }
  }, [activeTab]);

  // Cargar pagos pendientes
  useEffect(() => {
    if (activeTab === 'pagos') {
      fetchPagosPendientes();
    }
  }, [activeTab]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/estudiantes');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }

      setUsuarios(data.data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError(err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagosPendientes = async () => {
    setLoadingPagos(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/pagos/pendientes');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pagos pendientes');
      }

      setPagosPendientes(data.data || []);
    } catch (err) {
      console.error('Error al cargar pagos pendientes:', err);
      setError(err.message);
      setPagosPendientes([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleAprobarPago = async (pagoId) => {
    if (procesandoPago) return;
    
    setProcesandoPago(pagoId);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:5000/api/pagos/${pagoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'VAL',
          aprobadorId: user?.SECUENCIAL || user?.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar el pago');
      }

      // Recargar pagos pendientes
      await fetchPagosPendientes();
      alert('✅ Pago aprobado correctamente');
    } catch (err) {
      console.error('Error al aprobar pago:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setProcesandoPago(null);
    }
  };

  const handleRechazarPago = async (pagoId) => {
    if (procesandoPago) return;
    
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (!motivo || motivo.trim() === '') {
      return;
    }
    
    setProcesandoPago(pagoId);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:5000/api/pagos/${pagoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'RECH',
          observaciones: motivo,
          aprobadorId: user?.SECUENCIAL || user?.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al rechazar el pago');
      }

      // Recargar pagos pendientes
      await fetchPagosPendientes();
      alert('⚠️ Pago rechazado');
    } catch (err) {
      console.error('Error al rechazar pago:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setProcesandoPago(null);
    }
  };

  const getFileIcon = (url) => {
    if (!url) return null;
    const ext = url.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FaFilePdf style={{ color: '#dc2626', marginRight: '8px' }} />;
    return <FaImage style={{ color: '#3b82f6', marginRight: '8px' }} />;
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const nombreCompleto = `${u.NOMBRES || ''} ${u.APELLIDOS || ''}`.toLowerCase();
    const correo = (u.CORREO || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return nombreCompleto.includes(query) || correo.includes(query);
  });

  return (
    <div className="users-responsable-container">
      <div className="users-responsable-header">
        <h1>Gestión de Usuarios y Pagos</h1>
        <p>Administra usuarios y revisa pagos pendientes de aprobación</p>
      </div>

      {/* Tabs */}
      <div className="users-responsable-tabs">
        <button
          className={`tab-button ${activeTab === 'pagos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pagos')}
        >
          <FaMoneyCheckAlt /> Pagos Pendientes
          {pagosPendientes.length > 0 && (
            <span className="badge-count">{pagosPendientes.length}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <FaUsers /> Usuarios
        </button>
      </div>

      {/* Contenido de Pagos Pendientes */}
      {activeTab === 'pagos' && (
        <div className="pagos-pendientes-section">
          {loadingPagos ? (
            <div className="loading-container">
              <FaSpinner className="spinner" />
              <p>Cargando pagos pendientes...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>❌ {error}</p>
              <button onClick={fetchPagosPendientes}>Reintentar</button>
            </div>
          ) : pagosPendientes.length === 0 ? (
            <div className="empty-state">
              <FaMoneyCheckAlt size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
              <p>No hay pagos pendientes de revisión</p>
            </div>
          ) : (
            <div className="pagos-list">
              {pagosPendientes.map((pago) => (
                <div key={pago.SECUENCIAL} className="pago-card">
                  <div className="pago-header">
                    <div className="pago-info">
                      <h3>{pago.EVENTO_TITULO || 'Evento sin título'}</h3>
                      <p className="pago-usuario">
                        <strong>Usuario:</strong> {pago.NOMBRES} {pago.APELLIDOS}
                      </p>
                      <p className="pago-email">{pago.CORREO}</p>
                    </div>
                    <div className="pago-monto">
                      <span className="monto-label">Monto</span>
                      <span className="monto-value">${(parseFloat(pago.MONTO) || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pago-details">
                    <div className="detail-item">
                      <strong>Forma de pago:</strong> {pago.FORMA_PAGO_NOMBRE || pago.CODIGOFORMADEPAGO}
                    </div>
                    <div className="detail-item">
                      <strong>Fecha de pago:</strong> {new Date(pago.FECHA_PAGO).toLocaleString('es-ES')}
                    </div>
                    {pago.COMPROBANTE_URL && (
                      <div className="detail-item">
                        <strong>Comprobante:</strong>
                        <a
                          href={pago.COMPROBANTE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="comprobante-link"
                        >
                          {getFileIcon(pago.COMPROBANTE_URL)}
                          Ver comprobante
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pago-actions">
                    <button
                      className="btn-aprobar"
                      onClick={() => handleAprobarPago(pago.SECUENCIAL)}
                      disabled={procesandoPago === pago.SECUENCIAL}
                    >
                      {procesandoPago === pago.SECUENCIAL ? (
                        <FaSpinner className="spinner-small" />
                      ) : (
                        <FaCheck />
                      )}
                      Aprobar
                    </button>
                    <button
                      className="btn-rechazar"
                      onClick={() => handleRechazarPago(pago.SECUENCIAL)}
                      disabled={procesandoPago === pago.SECUENCIAL}
                    >
                      {procesandoPago === pago.SECUENCIAL ? (
                        <FaSpinner className="spinner-small" />
                      ) : (
                        <FaTimes />
                      )}
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="usuarios-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading-container">
              <FaSpinner className="spinner" />
              <p>Cargando usuarios...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>❌ {error}</p>
              <button onClick={fetchUsuarios}>Reintentar</button>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="empty-state">
              <FaUsers size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="usuarios-grid">
              {usuariosFiltrados.map((usuario) => (
                <div key={usuario.id || usuario.SECUENCIAL} className="usuario-card">
                  <div className="usuario-avatar">
                    {usuario.FOTO_PERFIL ? (
                      <img src={usuario.FOTO_PERFIL} alt={`${usuario.NOMBRES} ${usuario.APELLIDOS}`} />
                    ) : (
                      <div className="avatar-placeholder">
                        {usuario.NOMBRES?.[0]}{usuario.APELLIDOS?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="usuario-info">
                    <h3>{usuario.NOMBRES} {usuario.APELLIDOS}</h3>
                    <p className="usuario-email">{usuario.CORREO}</p>
                    <p className="usuario-cedula">Cédula: {usuario.CEDULA || 'N/A'}</p>
                    <p className="usuario-telefono">Tel: {usuario.TELEFONO || 'N/A'}</p>
                    {usuario.CARRERAS && (
                      <p className="usuario-carreras">Carreras: {usuario.CARRERAS}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersResponsable;
