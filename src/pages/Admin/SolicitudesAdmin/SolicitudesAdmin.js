import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import './SolicitudesAdmin.css';

const SolicitudesAdmin = () => {
  const { user } = useUser();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalCrearPeticion, setShowModalCrearPeticion] = useState(false);
  const [mensajeEmail, setMensajeEmail] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('Pendiente');
  const [formDataPeticion, setFormDataPeticion] = useState({
    tituloCambio: '',
    nombreSolicitante: '',
    motivoCambio: '',
    descripcionCambio: '',
    planImplementacion: '',
    planPrueba: '',
    personaAprobadora: '',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    tipoCambio: 'Estándar',
    riesgo: 'Bajo'
    ,aprobadoresIds: []
    ,responsableTecnico: ''
  });
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterEstado, setFilterEstado] = useState('Todos');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Seguridad: contar aprobadores seleccionados sin romper si la propiedad es undefined
  const aprobadoresCount = Array.isArray(formDataPeticion.aprobadoresIds) ? formDataPeticion.aprobadoresIds.length : 0;

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/solicitudes');
      const data = await response.json();
      if (data.success) {
        setSolicitudes(data.data);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setMessage({ type: 'error', text: 'Error al cargar las solicitudes' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setNuevoEstado(solicitud.ESTADO);
    setMensajeEmail('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSolicitud(null);
    setMensajeEmail('');
    setMessage({ type: '', text: '' });
  };

  const handleCambiarEstado = async () => {
    if (!selectedSolicitud) return;

    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `http://localhost:5000/api/solicitudes/${selectedSolicitud.SECUENCIAL}/estado`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estado: nuevoEstado,
            mensaje: mensajeEmail
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `Estado cambiado a ${nuevoEstado} correctamente` });
        setTimeout(() => {
          handleCloseModal();
          cargarSolicitudes();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al cambiar el estado' });
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handleAbrirModalCrearPeticion = (solicitud) => {
    if (solicitud.ESTADO !== 'Aprobado') {
      alert('Solo se pueden crear peticiones de cambio desde solicitudes aprobadas');
      return;
    }
    setSelectedSolicitud(solicitud);
    setFormDataPeticion({
      tituloCambio: `Cambio basado en solicitud #${solicitud.SECUENCIAL}`,
      nombreSolicitante: solicitud.NOMBRES && solicitud.APELLIDOS 
        ? `${solicitud.NOMBRES} ${solicitud.APELLIDOS}` 
        : 'Usuario',
      motivoCambio: solicitud.JUSTIFICACION || '',
      descripcionCambio: solicitud.DESCRIPCION || '',
      planImplementacion: '',
      planPrueba: '',
      personaAprobadora: '',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      tipoCambio: 'Estándar',
      riesgo: solicitud.URGENCIA === 'Alta' ? 'Alto' : solicitud.URGENCIA === 'Media' ? 'Medio' : 'Bajo',
      responsableTecnico: ''
    });
    setShowModalCrearPeticion(true);
  };

  const handleCerrarModalCrearPeticion = () => {
    setShowModalCrearPeticion(false);
    setSelectedSolicitud(null);
    setMessage({ type: '', text: '' });
  };

  const handleChangePeticion = (e) => {
    const { name, value } = e.target;
    setFormDataPeticion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAprobadoresChangePeticion = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormDataPeticion(prev => ({
      ...prev,
      aprobadoresIds: selectedOptions
    }));
  };

  const toggleAprobador = (adminId) => {
    setFormDataPeticion(prev => {
      const current = Array.isArray(prev.aprobadoresIds) ? prev.aprobadoresIds.slice() : [];
      const idx = current.indexOf(adminId);
      if (idx === -1) current.push(adminId);
      else current.splice(idx, 1);
      return { ...prev, aprobadoresIds: current };
    });
  };

  const cargarAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch('http://localhost:5000/api/admins');
      const data = await response.json();
      if (data.success) setAdmins(data.data);
    } catch (err) {
      console.error('Error cargando admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    // cargar admins cuando se monta el componente para el select múltiple
    cargarAdmins();
  }, []);

  const handleCrearPeticion = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validación mínima: requerir mínimo 2 aprobadores
    if (!Array.isArray(formDataPeticion.aprobadoresIds) || formDataPeticion.aprobadoresIds.length < 2) {
      setMessage({ type: 'error', text: 'Debe seleccionar mínimo 2 administradores aprobadores' });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/solicitudes/${selectedSolicitud.SECUENCIAL}/peticion-cambio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...formDataPeticion, creadorId: user?.id })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Petición de cambio creada correctamente' });
        setTimeout(() => {
          handleCerrarModalCrearPeticion();
          cargarSolicitudes();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al crear la petición de cambio' });
      }
    } catch (error) {
      console.error('Error al crear petición de cambio:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'badge-pendiente';
      case 'Aprobado':
        return 'badge-evaluado';
      case 'Evaluado':
        return 'badge-evaluado';
      case 'Rechazado':
        return 'badge-rechazado';
      default:
        return 'badge-default';
    }
  };

  const getUrgenciaBadgeClass = (urgencia) => {
    switch (urgencia) {
      case 'Alta':
        return 'badge-alta';
      case 'Media':
        return 'badge-media';
      case 'Baja':
        return 'badge-baja';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="solicitudes-admin-container">
      <div className="solicitudes-header">
        <h2>Gestión de Solicitudes de Soporte</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Evaluado">Evaluado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
          <button onClick={cargarSolicitudes} className="btn-refresh">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-message">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="empty-message">No hay solicitudes registradas</div>
      ) : (
        <div className="solicitudes-table-container">
          <table className="solicitudes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Tipo</th>
                <th>Urgencia</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(filterEstado === 'Todos' ? solicitudes : solicitudes.filter(s => s.ESTADO === filterEstado)).map((solicitud) => (
                <tr key={solicitud.SECUENCIAL}>
                  <td>#{solicitud.SECUENCIAL}</td>
                  <td>
                    {solicitud.NOMBRES && solicitud.APELLIDOS
                      ? `${solicitud.NOMBRES} ${solicitud.APELLIDOS}`
                      : 'Anónimo'}
                    <br />
                    <small style={{ color: '#666' }}>{solicitud.CORREO || ''}</small>
                  </td>
                  <td>{solicitud.MODULO_AFECTADO}</td>
                  <td>{solicitud.TIPO_SOLICITUD}</td>
                  <td>
                    <span className={`status-badge ${getUrgenciaBadgeClass(solicitud.URGENCIA)}`}>
                      {solicitud.URGENCIA}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getEstadoBadgeClass(solicitud.ESTADO)}`}>
                      {solicitud.ESTADO}
                    </span>
                  </td>
                  <td>
                    {new Date(solicitud.FECHA_ENVIO).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <button
                        className="btn-ver-detalle"
                        onClick={() => handleVerDetalle(solicitud)}
                      >
                        Ver / Cambiar Estado
                      </button>
                      {solicitud.ESTADO === 'Aprobado' && (
                        <button
                          className="btn-ver-detalle"
                          onClick={() => handleAbrirModalCrearPeticion(solicitud)}
                          style={{ backgroundColor: '#667eea' }}
                        >
                          Crear Petición
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para ver detalles y cambiar estado */}
      {showModal && selectedSolicitud && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de Solicitud #{selectedSolicitud.SECUENCIAL}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="solicitud-detalle">
              <div className="detalle-item">
                <strong>Usuario:</strong> {selectedSolicitud.NOMBRES && selectedSolicitud.APELLIDOS
                  ? `${selectedSolicitud.NOMBRES} ${selectedSolicitud.APELLIDOS}`
                  : 'Anónimo'}
              </div>
              <div className="detalle-item">
                <strong>Correo:</strong> {selectedSolicitud.CORREO || 'N/A'}
              </div>
              <div className="detalle-item">
                <strong>Módulo Afectado:</strong> {selectedSolicitud.MODULO_AFECTADO}
              </div>
              <div className="detalle-item">
                <strong>Tipo:</strong> {selectedSolicitud.TIPO_SOLICITUD}
              </div>
              <div className="detalle-item">
                <strong>Urgencia:</strong> {selectedSolicitud.URGENCIA}
              </div>
              <div className="detalle-item">
                <strong>Estado Actual:</strong> {selectedSolicitud.ESTADO}
              </div>
              <div className="detalle-item">
                <strong>Descripción:</strong>
                <p>{selectedSolicitud.DESCRIPCION}</p>
              </div>
              <div className="detalle-item">
                <strong>Justificación:</strong>
                <p>{selectedSolicitud.JUSTIFICACION}</p>
              </div>

              <div className="form-group">
                <label>Cambiar Estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mensaje para el usuario (opcional)</label>
                <textarea
                  value={mensajeEmail}
                  onChange={(e) => setMensajeEmail(e.target.value)}
                  rows="3"
                  placeholder="Este mensaje se enviará por correo al usuario..."
                />
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-save" onClick={handleCambiarEstado}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear petición de cambio */}
      {showModalCrearPeticion && selectedSolicitud && (
        <div className="modal-overlay" onClick={handleCerrarModalCrearPeticion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>Formulario de Cambios - Usuario Desarrollador</h3>
              <button className="btn-close" onClick={handleCerrarModalCrearPeticion}>×</button>
            </div>

            <form onSubmit={handleCrearPeticion} className="peticion-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título del cambio</label>
                  <input
                    type="text"
                    name="tituloCambio"
                    value={formDataPeticion.tituloCambio}
                    onChange={handleChangePeticion}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del solicitante</label>
                  <input
                    type="text"
                    name="nombreSolicitante"
                    value={formDataPeticion.nombreSolicitante}
                    onChange={handleChangePeticion}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de cambio</label>
                <textarea
                  name="motivoCambio"
                  value={formDataPeticion.motivoCambio}
                  onChange={handleChangePeticion}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Descripción del cambio solicitado</label>
                <textarea
                  name="descripcionCambio"
                  value={formDataPeticion.descripcionCambio}
                  onChange={handleChangePeticion}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Plan de implementación</label>
                <textarea
                  name="planImplementacion"
                  value={formDataPeticion.planImplementacion}
                  onChange={handleChangePeticion}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Plan de prueba</label>
                <textarea
                  name="planPrueba"
                  value={formDataPeticion.planPrueba}
                  onChange={handleChangePeticion}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de solicitud</label>
                  <input
                    type="date"
                    name="fechaSolicitud"
                    value={formDataPeticion.fechaSolicitud}
                    onChange={handleChangePeticion}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de entrega</label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={formDataPeticion.fechaEntrega}
                    onChange={handleChangePeticion}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de cambio</label>
                  <select
                    name="tipoCambio"
                    value={formDataPeticion.tipoCambio}
                    onChange={handleChangePeticion}
                    required
                  >
                    <option value="Estándar">Estándar</option>
                    <option value="Normal">Normal</option>
                    <option value="Emergencia">Emergencia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Riesgo</label>
                  <select
                    name="riesgo"
                    value={formDataPeticion.riesgo}
                    onChange={handleChangePeticion}
                    required
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Administradores Aprobadores (Mínimo 2)
                  {aprobadoresCount > 0 && (
                    <span style={{ color: aprobadoresCount < 2 ? '#ef4444' : '#10b981', marginLeft: '0.5rem' }}>
                      ({aprobadoresCount} seleccionados)
                    </span>
                  )}
                </label>
                <div className="admin-list" style={{ border: '1px solid #ddd', borderRadius: 6, padding: '0.5rem', maxHeight: 180, overflow: 'auto' }}>
                  {loadingAdmins || !Array.isArray(admins) || admins.length === 0 ? (
                    <div style={{ color: '#666', padding: '0.5rem' }}>Cargando administradores...</div>
                  ) : (
                    admins
                      .filter(admin => admin.id !== user?.id)
                      .map(admin => {
                        const id = admin.id;
                        const nombre = admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`;
                        const correo = admin.CORREO || '';
                        const checked = Array.isArray(formDataPeticion.aprobadoresIds) && formDataPeticion.aprobadoresIds.includes(id);
                        return (
                          <label key={id} className="admin-item" style={{ display: 'block', padding: '0.35rem 0.5rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAprobador(id)}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <span style={{ fontWeight: 500 }}>{nombre}</span>
                            <span style={{ color: '#666', marginLeft: 8 }}>({correo})</span>
                          </label>
                        );
                      })
                  )}
                </div>
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Haz clic para seleccionar administradores. Mínimo 2 requeridos.
                </small>
              </div>

              <div className="form-group">
                <label>Responsable Técnico (quien programará el cambio)</label>
                <select name="responsableTecnico" value={formDataPeticion.responsableTecnico} onChange={handleChangePeticion} required style={{ padding: '0.5rem', borderRadius: '6px', width: '100%' }}>
                  <option value="">-- Seleccione responsable técnico --</option>
                  {loadingAdmins || !Array.isArray(admins) || admins.length === 0 ? (
                    <option disabled>Cargando administradores...</option>
                  ) : (
                    admins.map(admin => (
                        <option key={admin.id} value={admin.id}>{admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`} ({admin.CORREO})</option>
                      ))
                  )}
                </select>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCerrarModalCrearPeticion}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={aprobadoresCount < 2 || !formDataPeticion.responsableTecnico} title={aprobadoresCount < 2 || !formDataPeticion.responsableTecnico ? 'Seleccione al menos 2 administradores y un responsable técnico' : 'Crear petición'}>
                  Crear Petición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudesAdmin;
