import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import API_URL from '../../../config/api';
import './PeticionesCambioAdmin.css';

const PeticionesCambioAdmin = () => {
  const { user } = useUser();
  const [peticiones, setPeticiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeticion, setSelectedPeticion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalCrearDirecta, setShowModalCrearDirecta] = useState(false);
  const [formData, setFormData] = useState({
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
    riesgo: 'Bajo',
    solicitudId: null,
    aprobadoresIds: [],
    responsableTecnico: ''
  });
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterEstado, setFilterEstado] = useState('Todos');

  useEffect(() => {
    cargarPeticiones();
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${API_URL}/api/admins`);
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Error al cargar admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const cargarPeticiones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/peticiones-cambio`);
      const data = await response.json();
      if (data.success) {
        setPeticiones(data.data);
      }
    } catch (error) {
      console.error('Error al cargar peticiones:', error);
      setMessage({ type: 'error', text: 'Error al cargar las peticiones' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (peticion) => {
    // Si es una solicitud evaluada, no tiene SECUENCIAL de petición aún
    if (peticion.TIPO === 'solicitud_evaluada' || peticion.ESTADO === 'Pendiente Crear') {
      setSelectedPeticion(peticion);
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/peticiones-cambio/${peticion.SECUENCIAL}`);
      const data = await response.json();
      if (data.success) {
        setSelectedPeticion(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setMessage({ type: 'error', text: 'Error al cargar los detalles' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPeticion(null);
    setMessage({ type: '', text: '' });
  };

  const handleAbrirModalCrear = (solicitudEvaluada) => {
    setSelectedPeticion(solicitudEvaluada);
    setFormData({
      tituloCambio: `Cambio basado en solicitud #${solicitudEvaluada.SECUENCIAL_SOLICITUD || solicitudEvaluada.SECUENCIAL}`,
      nombreSolicitante: solicitudEvaluada.NOMBRES && solicitudEvaluada.APELLIDOS
        ? `${solicitudEvaluada.NOMBRES} ${solicitudEvaluada.APELLIDOS}`
        : 'Usuario',
      motivoCambio: solicitudEvaluada.IMPACTO_NEGATIVO || solicitudEvaluada.JUSTIFICACION || '',
      descripcionCambio: solicitudEvaluada.EVALUACION || solicitudEvaluada.DESCRIPCION_SOLICITUD || '',
      planImplementacion: '',
      planPrueba: '',
      personaAprobadora: '',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      tipoCambio: 'Estándar',
      riesgo: solicitudEvaluada.PRIORIDAD === 'Alta' ? 'Alto' : solicitudEvaluada.PRIORIDAD === 'Media' ? 'Medio' : 'Bajo',
      solicitudId: solicitudEvaluada.SECUENCIAL_SOLICITUD || solicitudEvaluada.SECUENCIAL,
      aprobadoresIds: [],
      responsableTecnico: ''
    });
    setShowModalCrear(true);
  };

  const handleAbrirModalCrearDirecta = () => {
    setFormData({
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
      riesgo: 'Bajo',
      solicitudId: null,
      aprobadoresIds: [],
      responsableTecnico: ''
    });
    setShowModalCrearDirecta(true);
  };

  const handleCerrarModalCrear = () => {
    setShowModalCrear(false);
    setShowModalCrearDirecta(false);
    setSelectedPeticion(null);
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAprobadoresChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      aprobadoresIds: selectedOptions
    }));
  };

  const toggleAprobador = (adminId) => {
    setFormData(prev => {
      const list = Array.isArray(prev.aprobadoresIds) ? [...prev.aprobadoresIds] : [];
      const idx = list.indexOf(adminId);
      if (idx === -1) list.push(adminId); else list.splice(idx, 1);
      return { ...prev, aprobadoresIds: list };
    });
  };

  const handleResponsableChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, responsableTecnico: value }));
  };

  const handleCrearPeticion = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validar que se hayan seleccionado mínimo 2 aprobadores
    if (!formData.aprobadoresIds || formData.aprobadoresIds.length < 2) {
      setMessage({ type: 'error', text: 'Debe seleccionar mínimo 2 administradores aprobadores' });
      return;
    }

    // Validar que el creador no esté en la lista de aprobadores
    if (formData.aprobadoresIds.includes(user?.id)) {
      setMessage({ type: 'error', text: 'No puedes seleccionarte como aprobador' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/peticiones-cambio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          creadorId: user?.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Petición de cambio creada correctamente' });
        setTimeout(() => {
          handleCerrarModalCrear();
          cargarPeticiones();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al crear la petición de cambio' });
      }
    } catch (error) {
      console.error('Error al crear petición:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handleAprobar = async () => {
    if (!selectedPeticion || !user?.id || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') return;

    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `${API_URL}/api/peticiones-cambio/${selectedPeticion.SECUENCIAL}/aprobar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ adminId: user.id })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          handleCloseModal();
          cargarPeticiones();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al aprobar la petición' });
      }
    } catch (error) {
      console.error('Error al aprobar:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handleRechazar = async () => {
    if (!selectedPeticion || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear' || !user?.id) return;

    const motivoRechazo = window.prompt('Ingresa el motivo del rechazo (opcional):');
    if (motivoRechazo === null) {
      return; // Usuario canceló
    }

    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `${API_URL}/api/peticiones-cambio/${selectedPeticion.SECUENCIAL}/rechazar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            adminId: user.id,
            motivoRechazo: motivoRechazo || null
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          handleCloseModal();
          cargarPeticiones();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al rechazar la petición' });
      }
    } catch (error) {
      console.error('Error al rechazar:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const puedoRechazar = () => {
    if (!selectedPeticion || !user?.id || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') return false;
    
    // Solo los aprobadores pueden rechazar
    if (selectedPeticion.CREADOR_ID === user.id) return false; // El creador no puede rechazar
    
    // Verificar que esté en la lista de aprobadores
    if (!selectedPeticion.aprobadores || selectedPeticion.aprobadores.length === 0) return false;
    const esAprobador = selectedPeticion.aprobadores.some(ap => ap.SECUENCIAL_ADMIN === user.id);
    
    // Verificar que no haya rechazado o aprobado ya
    if (yaRechazadoPorMi() || yaAprobadoPorMi()) return false;
    
    return esAprobador && selectedPeticion.ESTADO === 'Pendiente';
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
      case 'Pendiente Crear':
        return 'badge-pendiente';
      case 'Aceptado':
        return 'badge-evaluado';
      case 'Rechazado':
        return 'badge-rechazado';
      case 'En Proceso':
        return 'badge-proceso';
      case 'Completado':
        return 'badge-completado';
      default:
        return 'badge-default';
    }
  };

  const yaAprobadoPorMi = () => {
    if (!selectedPeticion || !user?.id || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') return false;
    if (!selectedPeticion.aprobaciones) return false;
    return selectedPeticion.aprobaciones.some(ap => ap.SECUENCIAL_ADMIN === user.id);
  };

  const yaRechazadoPorMi = () => {
    if (!selectedPeticion || !user?.id || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') return false;
    if (!selectedPeticion.rechazos) return false;
    return selectedPeticion.rechazos.some(r => r.SECUENCIAL_ADMIN === user.id);
  };

  const generarIssueGitHub = () => {
    if (!selectedPeticion || selectedPeticion.ESTADO !== 'Completado') return '';

    const issue = `# ${selectedPeticion.TITULO_CAMBIO || 'Petición de Cambio'}

## Información General
- **ID de Petición:** #${selectedPeticion.SECUENCIAL}
${selectedPeticion.SECUENCIAL_CAMBIO ? `- **Solicitud Origen:** #${selectedPeticion.SECUENCIAL_CAMBIO}` : ''}
- **Solicitante:** ${selectedPeticion.NOMBRE_SOLICITANTE || (selectedPeticion.NOMBRES && selectedPeticion.APELLIDOS ? `${selectedPeticion.NOMBRES} ${selectedPeticion.APELLIDOS}` : 'N/A')}
- **Módulo Afectado:** ${selectedPeticion.MODULO_AFECTADO || 'N/A'}
- **Tipo ITIL:** ${selectedPeticion.TIPO_ITIL || 'N/A'}
- **Prioridad:** ${selectedPeticion.PRIORIDAD || 'N/A'}
- **Responsable Técnico:** ${selectedPeticion.RESPONSABLE_TECNICO || 'N/A'}

## Descripción del Cambio
${selectedPeticion.EVALUACION || selectedPeticion.DESCRIPCION_SOLICITUD || 'N/A'}

## Motivo del Cambio
${selectedPeticion.IMPACTO_NEGATIVO || 'N/A'}

## Beneficios Esperados
${selectedPeticion.BENEFICIOS || 'N/A'}

## Plan de Implementación
${selectedPeticion.ACCIONES || selectedPeticion.BENEFICIOS || 'N/A'}

## Plan de Prueba
${selectedPeticion.ACCIONES || 'N/A'}

## Fechas
- **Fecha de Solicitud:** ${selectedPeticion.FECHA_SOLICITUD ? new Date(selectedPeticion.FECHA_SOLICITUD).toLocaleDateString('es-ES') : 'N/A'}
- **Fecha de Entrega Estimada:** ${selectedPeticion.FECHA_ENTREGA ? new Date(selectedPeticion.FECHA_ENTREGA).toLocaleDateString('es-ES') : 'N/A'}

## Aprobaciones
${selectedPeticion.aprobaciones && selectedPeticion.aprobaciones.length > 0 
  ? selectedPeticion.aprobaciones.map((ap, idx) => 
      `- ✅ Aprobado por: ${ap.NOMBRES && ap.APELLIDOS ? `${ap.NOMBRES} ${ap.APELLIDOS}` : 'Admin'} (${new Date(ap.FECHA_APROBACION).toLocaleDateString('es-ES')})`
    ).join('\n')
  : 'N/A'}

## Observaciones
${selectedPeticion.OBSERVACIONES || 'N/A'}

---
**Estado:** ${selectedPeticion.ESTADO}
**Fecha de Completado:** ${new Date().toLocaleDateString('es-ES')}
`;

    return issue;
  };

  const copiarIssueGitHub = () => {
    const issueText = generarIssueGitHub();
    if (!issueText) {
      setMessage({ type: 'error', text: 'Solo se puede generar el issue para peticiones completadas' });
      return;
    }
    
    navigator.clipboard.writeText(issueText).then(() => {
      setMessage({ type: 'success', text: 'Texto del issue copiado al portapapeles' });
    }).catch(() => {
      setMessage({ type: 'error', text: 'Error al copiar al portapapeles' });
    });
  };

  const puedoAprobar = () => {
    if (!selectedPeticion || !user?.id || selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') return false;
    
    // Si ya rechazó, no puede aprobar
    if (yaRechazadoPorMi()) return false;
    
    // Si es el creador, solo puede aprobar cuando hay 2 aprobaciones y el estado es Aceptado
    if (selectedPeticion.CREADOR_ID === user.id) {
      return selectedPeticion.ESTADO === 'Aceptado' && selectedPeticion.APROBACIONES_COUNT >= 2 && !yaAprobadoPorMi();
    }
    
    // Si no es el creador, verificar que esté en la lista de aprobadores
    if (!selectedPeticion.aprobadores || selectedPeticion.aprobadores.length === 0) return false;
    const esAprobador = selectedPeticion.aprobadores.some(ap => ap.SECUENCIAL_ADMIN === user.id);
    return esAprobador && selectedPeticion.ESTADO === 'Pendiente' && !yaAprobadoPorMi();
  };

  return (
    <div className="peticiones-admin-container">
      <div className="peticiones-header">
        <h2>Gestión de Peticiones de Cambio</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pendiente Crear">Pendiente Crear</option>
            <option value="Aceptado">Aceptado</option>
            <option value="Rechazado">Rechazado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completado">Completado</option>
          </select>
          <button onClick={handleAbrirModalCrearDirecta} className="btn-crear-directa">
            ➕ Crear Petición
          </button>
          <button onClick={cargarPeticiones} className="btn-refresh">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-message">Cargando peticiones...</div>
      ) : peticiones.length === 0 ? (
        <div className="empty-message">No hay peticiones de cambio registradas</div>
      ) : (
        <div className="peticiones-table-container">
          <table className="peticiones-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Solicitud Origen</th>
                <th>Título / Usuario</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Aprobaciones</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(filterEstado === 'Todos' 
                ? peticiones 
                : peticiones.filter(p => {
                    if (filterEstado === 'Pendiente Crear') {
                      return p.ESTADO === 'Pendiente Crear' || p.TIPO === 'solicitud_evaluada';
                    }
                    return p.ESTADO === filterEstado;
                  })).map((peticion) => (
                <tr key={peticion.SECUENCIAL || `solicitud-${peticion.SECUENCIAL_SOLICITUD}`}>
                  <td>#{peticion.SECUENCIAL || `S-${peticion.SECUENCIAL_SOLICITUD}`}</td>
                  <td>
                    {peticion.SECUENCIAL_CAMBIO 
                      ? `#${peticion.SECUENCIAL_CAMBIO}` 
                      : peticion.SECUENCIAL_SOLICITUD 
                        ? `#${peticion.SECUENCIAL_SOLICITUD}` 
                        : 'N/A'}
                  </td>
                  <td>
                    {peticion.TITULO_CAMBIO || (
                      <>
                        {peticion.NOMBRES && peticion.APELLIDOS
                          ? `${peticion.NOMBRES} ${peticion.APELLIDOS}`
                          : 'Anónimo'}
                        <br />
                        <small style={{ color: '#666' }}>{peticion.CORREO || ''}</small>
                      </>
                    )}
                  </td>
                  <td>{peticion.TIPO_ITIL || 'N/A'}</td>
                  <td>{peticion.PRIORIDAD || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getEstadoBadgeClass(peticion.ESTADO)}`}>
                      {peticion.ESTADO}
                    </span>
                  </td>
                  <td>
                    {peticion.ESTADO === 'Pendiente Crear' ? (
                      <span style={{ color: '#999' }}>-</span>
                    ) : (
                      <span className="aprobaciones-count">
                        {peticion.APROBACIONES_COUNT || 0}/2
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(peticion.FECHA_DECISION || peticion.FECHA_ENVIO).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    {peticion.ESTADO === 'Pendiente Crear' ? (
                      <button
                        className="btn-crear-peticion"
                        onClick={() => handleAbrirModalCrear(peticion)}
                      >
                        Crear Petición
                      </button>
                    ) : (
                      <button
                        className="btn-ver-detalle"
                        onClick={() => handleVerDetalle(peticion)}
                      >
                        Ver Detalles
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para ver detalles y aprobar/rechazar */}
      {showModal && selectedPeticion && selectedPeticion.TIPO !== 'solicitud_evaluada' && selectedPeticion.ESTADO !== 'Pendiente Crear' && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Detalles de Petición de Cambio #{selectedPeticion.SECUENCIAL}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="peticion-detalle">
              <div className="detalle-item">
                <strong>Solicitud Origen:</strong> {selectedPeticion.SECUENCIAL_CAMBIO ? `#${selectedPeticion.SECUENCIAL_CAMBIO}` : 'N/A'}
              </div>
              {selectedPeticion.TITULO_CAMBIO && (
                <div className="detalle-item">
                  <strong>Título:</strong> {selectedPeticion.TITULO_CAMBIO}
                </div>
              )}
              <div className="detalle-item">
                <strong>Usuario:</strong> {selectedPeticion.NOMBRES && selectedPeticion.APELLIDOS
                  ? `${selectedPeticion.NOMBRES} ${selectedPeticion.APELLIDOS}`
                  : selectedPeticion.NOMBRE_SOLICITANTE || 'Anónimo'}
              </div>
              <div className="detalle-item">
                <strong>Módulo Afectado:</strong> {selectedPeticion.MODULO_AFECTADO || 'N/A'}
              </div>
              <div className="detalle-item">
                <strong>Tipo ITIL:</strong> {selectedPeticion.TIPO_ITIL || 'N/A'}
              </div>
              <div className="detalle-item">
                <strong>Prioridad:</strong> {selectedPeticion.PRIORIDAD || 'N/A'}
              </div>
              <div className="detalle-item">
                <strong>Estado:</strong> {selectedPeticion.ESTADO}
              </div>
              <div className="detalle-item">
                <strong>Aprobaciones:</strong> {selectedPeticion.APROBACIONES_COUNT || 0}/2
              </div>
              {selectedPeticion.RECHAZOS_COUNT > 0 && (
                <div className="detalle-item">
                  <strong>Rechazos:</strong> <span style={{ color: '#ef4444' }}>{selectedPeticion.RECHAZOS_COUNT}</span>
                </div>
              )}
              {selectedPeticion.aprobaciones && selectedPeticion.aprobaciones.length > 0 && (
                <div className="detalle-item">
                  <strong>Aprobado por:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {selectedPeticion.aprobaciones.map((ap, idx) => (
                      <li key={idx}>
                        {ap.NOMBRES && ap.APELLIDOS ? `${ap.NOMBRES} ${ap.APELLIDOS}` : 'Admin'} 
                        ({new Date(ap.FECHA_APROBACION).toLocaleDateString('es-ES')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedPeticion.rechazos && selectedPeticion.rechazos.length > 0 && (
                <div className="detalle-item">
                  <strong>Rechazado por:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {selectedPeticion.rechazos.map((rechazo, idx) => (
                      <li key={idx} style={{ color: '#ef4444' }}>
                        {rechazo.NOMBRES && rechazo.APELLIDOS ? `${rechazo.NOMBRES} ${rechazo.APELLIDOS}` : 'Admin'} 
                        ({new Date(rechazo.FECHA_APROBACION).toLocaleDateString('es-ES')})
                        {rechazo.MOTIVO_RECHAZO && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                            Motivo: {rechazo.MOTIVO_RECHAZO}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="detalle-item">
                <strong>Motivo de cambio:</strong>
                <p>{selectedPeticion.EVALUACION}</p>
              </div>
              {selectedPeticion.BENEFICIOS && (
                <div className="detalle-item">
                  <strong>Plan de implementación:</strong>
                  <p>{selectedPeticion.BENEFICIOS}</p>
                </div>
              )}
              {selectedPeticion.IMPACTO_NEGATIVO && (
                <div className="detalle-item">
                  <strong>:</strong>
                  <p>{selectedPeticion.IMPACTO_NEGATIVO}</p>
                </div>
              )}
              {selectedPeticion.ACCIONES && (
                <div className="detalle-item">
                  <strong>Plan de prueba:</strong>
                  <p>{selectedPeticion.ACCIONES}</p>
                </div>
              )}
              {selectedPeticion.OBSERVACIONES && (
                <div className="detalle-item">
                  <strong>Observaciones:</strong>
                  <p>{selectedPeticion.OBSERVACIONES}</p>
                </div>
              )}

              {selectedPeticion.ESTADO === 'Completado' && (
                <div className="detalle-item" style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '6px', border: '1px solid #bae6fd', marginTop: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>📋 Issue de GitHub</strong>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                    Esta petición está completada. Puedes generar el texto para crear un issue en GitHub.
                  </p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-copy-issue" 
                      onClick={copiarIssueGitHub}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        backgroundColor: '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      📋 Copiar Issue para GitHub
                    </button>
                    <button 
                      type="button" 
                      className="btn-view-issue" 
                      onClick={() => {
                        const issueText = generarIssueGitHub();
                        if (issueText) {
                          const newWindow = window.open();
                          newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Issue GitHub - Petición #${selectedPeticion.SECUENCIAL}</title>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; }
                                pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
                                button { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 1rem; }
                              </style>
                            </head>
                            <body>
                              <h1>Issue de GitHub - Petición #${selectedPeticion.SECUENCIAL}</h1>
                              <pre>${issueText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                              <button onclick="navigator.clipboard.writeText(\`${issueText.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); alert('Copiado al portapapeles')">Copiar</button>
                            </body>
                            </html>
                          `);
                        }
                      }}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      👁️ Ver Issue
                    </button>
                  </div>
                </div>
              )}

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              {selectedPeticion.aprobadores && selectedPeticion.aprobadores.length > 0 && (
                <div className="detalle-item">
                  <strong>Aprobadores Seleccionados ({selectedPeticion.aprobadores.length}):</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {selectedPeticion.aprobadores.map((ap, idx) => {
                      const aprobado = selectedPeticion.aprobaciones && selectedPeticion.aprobaciones.some(a => a.SECUENCIAL_ADMIN === ap.SECUENCIAL_ADMIN);
                      const rechazado = selectedPeticion.rechazos && selectedPeticion.rechazos.some(r => r.SECUENCIAL_ADMIN === ap.SECUENCIAL_ADMIN);
                      return (
                        <li key={idx}>
                          {ap.NOMBRES && ap.APELLIDOS ? `${ap.NOMBRES} ${ap.APELLIDOS}` : 'Admin'}
                          {aprobado && (
                            <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓ Aprobado</span>
                          )}
                          {rechazado && (
                            <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>✗ Rechazado</span>
                          )}
                          {!aprobado && !rechazado && (
                            <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>⏳ Pendiente</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
                {puedoAprobar() && (
                  <button type="button" className="btn-approve" onClick={handleAprobar}>
                    {selectedPeticion.CREADOR_ID === user.id ? 'Completar Petición' : 'Aprobar'}
                  </button>
                )}
                {puedoRechazar() && (
                  <button type="button" className="btn-reject" onClick={handleRechazar}>
                    Rechazar
                  </button>
                )}
                {yaAprobadoPorMi() && (
                  <button type="button" className="btn-ver-detalle" disabled>
                    Ya Aprobaste
                  </button>
                )}
                {yaRechazadoPorMi() && (
                  <button type="button" className="btn-ver-detalle" disabled>
                    Ya Rechazaste
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver solicitud evaluada */}
      {showModal && selectedPeticion && (selectedPeticion.TIPO === 'solicitud_evaluada' || selectedPeticion.ESTADO === 'Pendiente Crear') && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Solicitud Evaluada #{selectedPeticion.SECUENCIAL_SOLICITUD || selectedPeticion.SECUENCIAL}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="peticion-detalle">
              <div className="detalle-item">
                <strong>Usuario:</strong> {selectedPeticion.NOMBRES && selectedPeticion.APELLIDOS
                  ? `${selectedPeticion.NOMBRES} ${selectedPeticion.APELLIDOS}`
                  : 'Anónimo'}
              </div>
              <div className="detalle-item">
                <strong>Correo:</strong> {selectedPeticion.CORREO || 'N/A'}
              </div>
              <div className="detalle-item">
                <strong>Módulo Afectado:</strong> {selectedPeticion.MODULO_AFECTADO}
              </div>
              <div className="detalle-item">
                <strong>Tipo:</strong> {selectedPeticion.TIPO_SOLICITUD}
              </div>
              <div className="detalle-item">
                <strong>Urgencia:</strong> {selectedPeticion.PRIORIDAD}
              </div>
              <div className="detalle-item">
                <strong>Descripción:</strong>
                <p>{selectedPeticion.DESCRIPCION_SOLICITUD || selectedPeticion.EVALUACION}</p>
              </div>
              <div className="detalle-item">
                <strong>Justificación:</strong>
                <p>{selectedPeticion.IMPACTO_NEGATIVO}</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn-crear-peticion-modal" 
                  onClick={() => {
                    handleCloseModal();
                    handleAbrirModalCrear(selectedPeticion);
                  }}
                >
                  Crear Petición de Cambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear petición desde solicitud evaluada */}
      {showModalCrear && (
        <div className="modal-overlay" onClick={handleCerrarModalCrear}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>Formulario de Cambios - Usuario Desarrollador</h3>
              <button className="btn-close" onClick={handleCerrarModalCrear}>×</button>
            </div>

            <form onSubmit={handleCrearPeticion} className="peticion-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título del cambio</label>
                  <input
                    type="text"
                    name="tituloCambio"
                    value={formData.tituloCambio}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del solicitante</label>
                  <input
                    type="text"
                    name="nombreSolicitante"
                    value={formData.nombreSolicitante}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de cambio</label>
                <textarea
                  name="motivoCambio"
                  value={formData.motivoCambio}
                  onChange={handleChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Descripción del cambio solicitado</label>
                <textarea
                  name="descripcionCambio"
                  value={formData.descripcionCambio}
                  onChange={handleChange}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Plan de implementación</label>
                <textarea
                  name="planImplementacion"
                  value={formData.planImplementacion}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Plan de prueba</label>
                <textarea
                  name="planPrueba"
                  value={formData.planPrueba}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de solicitud</label>
                  <input
                    type="date"
                    name="fechaSolicitud"
                    value={formData.fechaSolicitud}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de entrega</label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={formData.fechaEntrega}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de cambio</label>
                  <select
                    name="tipoCambio"
                    value={formData.tipoCambio}
                    onChange={handleChange}
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
                    value={formData.riesgo}
                    onChange={handleChange}
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
                  Administradores Aprobadores (Mínimo 2) *
                  {formData.aprobadoresIds.length > 0 && (
                    <span style={{ color: formData.aprobadoresIds.length < 2 ? '#ef4444' : '#10b981', marginLeft: '0.5rem' }}>
                      ({formData.aprobadoresIds.length} seleccionados)
                    </span>
                  )}
                </label>
                <div className="admin-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  {admins.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>Cargando administradores...</div>
                  ) : (
                    admins
                      .filter(admin => admin.id !== user?.id)
                      .map(admin => (
                        <label key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(formData.aprobadoresIds) && formData.aprobadoresIds.includes(admin.id)}
                            onChange={() => toggleAprobador(admin.id)}
                          />
                          <span>{admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`} ({admin.CORREO})</span>
                        </label>
                      ))
                  )}
                </div>
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Haz clic sobre los administradores para seleccionar. Mínimo 2 requeridos.
                </small>
              </div>

              <div className="form-group">
                <label>Responsable Técnico (quien programará el cambio)</label>
                <select name="responsableTecnico" value={formData.responsableTecnico} onChange={handleResponsableChange} required style={{ padding: '0.5rem', borderRadius: '6px', width: '100%' }}>
                  <option value="">-- Seleccione responsable técnico --</option>
                  {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`} ({admin.CORREO})</option>
                    ))}
                </select>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCerrarModalCrear}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={!formData.responsableTecnico || (Array.isArray(formData.aprobadoresIds) ? formData.aprobadoresIds.length < 2 : true)}>
                  Crear Petición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear petición directamente */}
      {showModalCrearDirecta && (
        <div className="modal-overlay" onClick={handleCerrarModalCrear}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>Formulario de Cambios - Usuario Desarrollador</h3>
              <button className="btn-close" onClick={handleCerrarModalCrear}>×</button>
            </div>

            <form onSubmit={handleCrearPeticion} className="peticion-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título del cambio</label>
                  <input
                    type="text"
                    name="tituloCambio"
                    value={formData.tituloCambio}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Mejora en el sistema de pagos"
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del solicitante</label>
                  <input
                    type="text"
                    name="nombreSolicitante"
                    value={formData.nombreSolicitante}
                    onChange={handleChange}
                    required
                    placeholder="Nombre completo del solicitante"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de cambio</label>
                <textarea
                  name="motivoCambio"
                  value={formData.motivoCambio}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Describe el motivo del cambio..."
                />
              </div>

              <div className="form-group">
                <label>Descripción del cambio solicitado</label>
                <textarea
                  name="descripcionCambio"
                  value={formData.descripcionCambio}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe detalladamente el cambio solicitado..."
                />
              </div>

              <div className="form-group">
                <label>Plan de implementación</label>
                <textarea
                  name="planImplementacion"
                  value={formData.planImplementacion}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe el plan de implementación..."
                />
              </div>

              <div className="form-group">
                <label>Plan de prueba</label>
                <textarea
                  name="planPrueba"
                  value={formData.planPrueba}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe el plan de prueba..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de solicitud</label>
                  <input
                    type="date"
                    name="fechaSolicitud"
                    value={formData.fechaSolicitud}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de entrega</label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={formData.fechaEntrega}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de cambio</label>
                  <select
                    name="tipoCambio"
                    value={formData.tipoCambio}
                    onChange={handleChange}
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
                    value={formData.riesgo}
                    onChange={handleChange}
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
                  Administradores Aprobadores (Mínimo 2) *
                  {formData.aprobadoresIds.length > 0 && (
                    <span style={{ color: formData.aprobadoresIds.length < 2 ? '#ef4444' : '#10b981', marginLeft: '0.5rem' }}>
                      ({formData.aprobadoresIds.length} seleccionados)
                    </span>
                  )}
                </label>
                <div className="admin-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  {admins.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>Cargando administradores...</div>
                  ) : (
                    admins
                      .filter(admin => admin.id !== user?.id)
                      .map(admin => (
                        <label key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(formData.aprobadoresIds) && formData.aprobadoresIds.includes(admin.id)}
                            onChange={() => toggleAprobador(admin.id)}
                          />
                          <span>{admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`} ({admin.CORREO})</span>
                        </label>
                      ))
                  )}
                </div>
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Haz clic sobre los administradores para seleccionar. Mínimo 2 requeridos.
                </small>
              </div>

              <div className="form-group">
                <label>Responsable Técnico (quien programará el cambio)</label>
                <select name="responsableTecnico" value={formData.responsableTecnico} onChange={handleResponsableChange} required style={{ padding: '0.5rem', borderRadius: '6px', width: '100%' }}>
                  <option value="">-- Seleccione responsable técnico --</option>
                  {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.NOMBRE_COMPLETO || `${admin.NOMBRES} ${admin.APELLIDOS}`} ({admin.CORREO})</option>
                    ))}
                </select>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCerrarModalCrear}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={!formData.responsableTecnico || (Array.isArray(formData.aprobadoresIds) ? formData.aprobadoresIds.length < 2 : true)}>
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

export default PeticionesCambioAdmin;
