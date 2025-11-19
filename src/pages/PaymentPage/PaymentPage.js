import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCourses } from '../../context/CoursesContext';
import PublicHeader from '../../components/PublicHeader/PublicHeader';
import PayPalButton from '../../components/PayPalButton/PayPalButton';
import './PaymentPage.css';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { courses } = useCourses();

  // Función helper para obtener la ruta del perfil según el rol
  const getUserProfileRoute = () => {
    if (!user) return '/courses';
    const rol = user.codigoRol || user.CODIGOROL;
    if (rol === 'ADM') return '/admin/panel';
    if (rol === 'RES') return '/responsable/profile';
    if (rol === 'DOC') return '/profesor/panel';
    if (rol === 'EST') return '/user/panel';
    return '/user/panel'; // Default para estudiantes
  };
  
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formasPago, setFormasPago] = useState([]);
  const [selectedFormaPago, setSelectedFormaPago] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [montoInput, setMontoInput] = useState('');
  const [motivacion, setMotivacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inscripcionId, setInscripcionId] = useState(null);
  const [yaInscrito, setYaInscrito] = useState(false);
  const [pagoAprobado, setPagoAprobado] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('manual'); // 'manual' o 'paypal'
  const [paypalSuccess, setPaypalSuccess] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      fetchFormasPago();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/eventos/${courseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar el curso');
      }

      setCourseData(data.data);
      setMontoInput(data.data.COSTO || '0');
      setError(null);
    } catch (err) {
      console.error('Error al cargar detalles del curso:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar inscripción y estado del pago
  const checkInscripcion = async () => {
    if (user && user.id && courseId) {
      try {
        // Usar el nuevo endpoint que incluye inscripciones pendientes
        const inscripcionRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/inscripcion?eventoId=${courseId}`);
        if (inscripcionRes.ok) {
          const inscripcionData = await inscripcionRes.json();
          console.log('📋 Inscripción encontrada:', inscripcionData.data);
          
          if (inscripcionData.data) {
            console.log('✅ Usuario ya está inscrito, actualizando estado', inscripcionData.data);
            setYaInscrito(true);
            const idInscripcion = inscripcionData.data.inscripcionId || inscripcionData.data.SECUENCIAL;
            setInscripcionId(idInscripcion);
            
            // Verificar estado del pago si existe inscripción y el curso es pagado
            const cursoEsPagado = inscripcionData.data.ES_PAGADO === 1 || courseData?.ES_PAGADO === 1;
            if (idInscripcion && cursoEsPagado) {
              try {
                const pagoRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${idInscripcion}`);
                if (pagoRes.ok) {
                  const pagoData = await pagoRes.json();
                  const pagoAprobado = pagoData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                  setPagoAprobado(pagoAprobado || false);
                  console.log('💳 Estado del pago:', pagoAprobado ? 'Aprobado' : 'Pendiente');
                } else {
                  // Si no hay pago aún, está pendiente
                  setPagoAprobado(false);
                }
              } catch (e) {
                console.warn('Error verificando pago:', e);
                setPagoAprobado(false);
              }
            } else {
              setPagoAprobado(!cursoEsPagado); // Si no es pagado, considerar como "aprobado"
            }
            
            return true;
          } else {
            console.log('ℹ️ Usuario NO está inscrito en este curso');
            setYaInscrito(false);
            setInscripcionId(null);
            setPagoAprobado(false);
            return false;
          }
        }
      } catch (e) {
        console.warn('Error verificando inscripción:', e);
        setYaInscrito(false);
        setPagoAprobado(false);
        return false;
      }
    } else {
      setYaInscrito(false);
      setInscripcionId(null);
      setPagoAprobado(false);
      return false;
    }
    return false;
  };

  // Verificar inscripción cuando cambie el usuario o el curso
  useEffect(() => {
    if (user && user.id && courseId) {
      console.log('🔄 Verificando inscripción para usuario:', user.id, 'curso:', courseId);
      checkInscripcion();
    }
  }, [user, courseId]);

  // Forzar re-render cuando cambie yaInscrito para actualizar la UI
  useEffect(() => {
    console.log('📊 Estado yaInscrito actualizado:', yaInscrito, 'inscripcionId:', inscripcionId);
  }, [yaInscrito, inscripcionId]);

  const fetchFormasPago = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pagos/formas-pago');
      const data = await response.json();
      if (data.success) {
        setFormasPago(data.data);
        if (data.data.length > 0) {
          setSelectedFormaPago(data.data[0].CODIGO);
        }
      }
    } catch (err) {
      console.error('Error al cargar formas de pago:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setComprobante(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Si no está logueado, redirigir a login
    if (!user || !user.id) {
      alert('Debes iniciar sesión para inscribirte');
      navigate('/login', { state: { returnTo: `/payment/${courseId}` } });
      setSubmitting(false);
      return;
    }

    try {
      let nuevaInscripcionId = inscripcionId;

      // Si no está inscrito, crear la inscripción
      if (!yaInscrito) {
        const inscripcionRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/inscribir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            eventoId: parseInt(courseId),
            motivacion: motivacion || null
          })
        });

        const inscripcionData = await inscripcionRes.json();
        
        if (!inscripcionRes.ok) {
          // Si ya está inscrito, obtener la inscripción existente
          if (inscripcionData.error && inscripcionData.error.includes('ya inscrito')) {
            try {
              const eventosRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/eventos`);
              if (eventosRes.ok) {
                const eventosData = await eventosRes.json();
                const inscripcionExistente = eventosData.data?.find(
                  item => (item.eventoId || item.SECUENCIALEVENTO) === parseInt(courseId)
                );
                if (inscripcionExistente && inscripcionExistente.inscripcionId) {
                  nuevaInscripcionId = inscripcionExistente.inscripcionId;
                  setYaInscrito(true);
                  setInscripcionId(nuevaInscripcionId);
                  // Si el curso es gratis, mostrar error
                  if (!esPagado) {
                    throw new Error('Ya estás inscrito en este curso');
                  }
                  // Si es pagado, continuar con el flujo de pago
                } else {
                  throw new Error(inscripcionData.error || 'Error al crear la inscripción');
                }
              } else {
                throw new Error(inscripcionData.error || 'Error al crear la inscripción');
              }
            } catch (e) {
              if (!esPagado) {
                throw new Error(e.message || 'Ya estás inscrito en este curso');
              }
              // Si es pagado, intentar continuar
              throw new Error('Ya estás inscrito. Si necesitas realizar el pago, completa el formulario.');
            }
          } else {
            throw new Error(inscripcionData.error || 'Error al crear la inscripción');
          }
        } else {
          nuevaInscripcionId = inscripcionData.inscripcionId;
          setInscripcionId(nuevaInscripcionId);
          setYaInscrito(true); // Actualizar estado después de crear inscripción
        }
      }

      // Si el curso es pagado, crear el pago
      if (courseData?.ES_PAGADO === 1 && parseFloat(montoInput) > 0) {
        if (!selectedFormaPago) {
          throw new Error('Debes seleccionar un método de pago');
        }

        const formData = new FormData();
        formData.append('inscripcionId', nuevaInscripcionId);
        formData.append('formaPago', selectedFormaPago);
        formData.append('monto', montoInput);
        if (comprobante) {
          formData.append('comprobante', comprobante);
        }

        const pagoRes = await fetch('http://localhost:5000/api/pagos', {
          method: 'POST',
          body: formData
        });

        const pagoData = await pagoRes.json();

        if (!pagoRes.ok) {
          throw new Error(pagoData.error || 'Error al registrar el pago');
        }
      }

      setInscripcionId(nuevaInscripcionId);
      setYaInscrito(true);
      
      // Si es pagado, verificar el estado del pago directamente
      if (courseData?.ES_PAGADO === 1 && parseFloat(montoInput) > 0) {
        try {
          // Esperar un momento para que el pago se registre en la BD
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const pagoRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${nuevaInscripcionId}`);
          if (pagoRes.ok) {
            const pagoData = await pagoRes.json();
            const pagoAprobado = pagoData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
            setPagoAprobado(pagoAprobado || false);
            console.log('💳 Estado del pago después de crear:', pagoAprobado ? 'Aprobado' : 'Pendiente');
          } else {
            setPagoAprobado(false);
          }
        } catch (e) {
          console.warn('Error verificando pago después de crear:', e);
          setPagoAprobado(false);
        }
      } else {
        // Si no es pagado, el pago está "aprobado" automáticamente
        setPagoAprobado(true);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Error al procesar inscripción/pago:', err);
      setError(err.message || 'Error al procesar la inscripción');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        {!user && <PublicHeader />}
        <div className="payment-container">
          <div className="payment-loading">Cargando información del curso...</div>
        </div>
      </div>
    );
  }

  if (error && !courseData) {
    return (
      <div className="payment-page">
        {!user && <PublicHeader />}
        <div className="payment-container">
          <div className="payment-error-message">
            <p>{error}</p>
            {user ? (
              <Link to={getUserProfileRoute()} className="btn btn-primary">Ir a mi perfil</Link>
            ) : (
              <Link to="/courses" className="btn btn-primary">Volver a Cursos</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="payment-page">
        {!user && <PublicHeader />}
        <div className="payment-container">
          <div className="payment-error-message">
            <p>Curso no encontrado</p>
            {user ? (
              <Link to={getUserProfileRoute()} className="btn btn-primary">Ir a mi perfil</Link>
            ) : (
              <Link to="/courses" className="btn btn-primary">Volver a Cursos</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const esPagado = courseData.ES_PAGADO === 1;
  const costo = parseFloat(courseData.COSTO) || 0;

  // Solo mostrar éxito si el curso es gratis O si el pago ya está aprobado
  if (success && (!esPagado || pagoAprobado)) {
    return (
      <div className="payment-page">
        {!user && <PublicHeader />}
        <div className="payment-container">
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>¡Inscripción Exitosa!</h2>
            <p>
              {esPagado 
                ? 'Tu inscripción ha sido registrada y el pago ha sido aprobado. Ya puedes acceder al curso.'
                : 'Tu inscripción ha sido registrada correctamente. Ya puedes acceder al curso.'}
            </p>
            <div className="success-actions">
              {user ? (
                <Link to={getUserProfileRoute()} className="btn btn-primary">Ir a mi perfil</Link>
              ) : (
                <Link to="/courses" className="btn btn-secondary">Ver más cursos</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si es pagado y el pago está pendiente, mostrar mensaje diferente
  if (success && esPagado && yaInscrito && !pagoAprobado) {
    return (
      <div className="payment-page">
        {!user && <PublicHeader />}
        <div className="payment-container">
          <div className="payment-pending">
            <div className="pending-icon">⏳</div>
            <h2>Pago Registrado</h2>
            <p>
              Tu comprobante de pago ha sido registrado y está pendiente de revisión. 
              Recibirás un correo electrónico cuando tu pago sea aprobado.
            </p>
            <div className="success-actions">
              {user ? (
                <Link to={getUserProfileRoute()} className="btn btn-primary">Ir a mi perfil</Link>
              ) : (
                <Link to="/courses" className="btn btn-secondary">Ver más cursos</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar PublicHeader solo si no hay usuario autenticado
  // Si hay usuario, App.js mostrará el HeaderWrapper correspondiente al rol
  const shouldShowPublicHeader = !user;

  return (
    <div className="payment-page">
      {shouldShowPublicHeader && <PublicHeader />}
      <div className="payment-container">
        <div className="payment-content">
          {/* Información del curso */}
          <div className="payment-course-info">
            <div className="course-info-header">
              <img 
                src={courseData.URL_IMAGEN || 'https://via.placeholder.com/200'} 
                alt={courseData.TITULO}
                className="course-info-image"
              />
              <div className="course-info-details">
                <h1>{courseData.TITULO}</h1>
                <p className="course-info-description" dangerouslySetInnerHTML={{ __html: courseData.DESCRIPCION }} />
                <div className="course-info-meta">
                  <span className="meta-badge">💰 ${costo.toFixed(2)}</span>
                  {courseData.HORAS && <span className="meta-badge">⏱ {courseData.HORAS} horas</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de inscripción y pago */}
          <div className="payment-form-section">
            <h2>Completa tu Inscripción</h2>
            
            {!user ? (
              <div className="login-required-full">
                <div className="login-required-content">
                  <h3>Inicia sesión para continuar</h3>
                  <p>Necesitas tener una cuenta para inscribirte en este curso</p>
                  <Link 
                    to="/login" 
                    state={{ returnTo: `/payment/${courseId}` }}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                  >
                    Iniciar Sesión
                  </Link>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                    ¿No tienes cuenta? <Link to="/register" style={{ color: '#667eea', fontWeight: 600 }}>Regístrate aquí</Link>
                  </p>
                </div>
              </div>
            ) : (
              <>
              {/* Debug temporal - remover en producción */}
              {console.log('🎯 Renderizando PaymentPage - yaInscrito:', yaInscrito, 'pagoAprobado:', pagoAprobado, 'esPagado:', esPagado, 'inscripcionId:', inscripcionId, 'user:', user?.id)}
              
              {yaInscrito ? (
                // Si ya está inscrito, verificar estado del pago
                <div className="payment-form">
                  {esPagado && pagoAprobado ? (
                    // Pago ya aprobado - mostrar mensaje de éxito
                    <div className="info-message" style={{ 
                      padding: '1.5rem', 
                      background: '#d1fae5', 
                      border: '1px solid #6ee7b7', 
                      borderRadius: '8px', 
                      marginBottom: '1.5rem',
                      color: '#065f46'
                    }}>
                      <strong>✅ Ya estás inscrito y tu pago ha sido aprobado.</strong>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
                        Tu inscripción está completa. Puedes acceder al curso desde "Mis Cursos".
                      </p>
                    </div>
                  ) : esPagado && !pagoAprobado ? (
                    // Pago pendiente - mostrar formulario
                    <>
                      <div className="info-message" style={{ 
                        padding: '1.5rem', 
                        background: '#dbeafe', 
                        border: '1px solid #93c5fd', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem',
                        color: '#1e40af'
                      }}>
                        <strong>ℹ️ Ya estás inscrito en este curso.</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
                          Completa el pago para finalizar tu inscripción.
                        </p>
                      </div>

                      <div className="payment-divider">
                        <span>Información de Pago</span>
                      </div>

                      <div className="form-group">
                        <label>Método de Pago *</label>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('manual')}
                            className={`payment-method-btn ${paymentMethod === 'manual' ? 'active' : ''}`}
                            style={{
                              padding: '0.75rem 1.5rem',
                              border: '2px solid #333',
                              borderRadius: '8px',
                              background: paymentMethod === 'manual' ? '#333' : 'transparent',
                              color: paymentMethod === 'manual' ? '#fff' : '#333',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                          >
                            Transferencia/Depósito
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('paypal')}
                            className={`payment-method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                            style={{
                              padding: '0.75rem 1.5rem',
                              border: '2px solid #333',
                              borderRadius: '8px',
                              background: paymentMethod === 'paypal' ? '#333' : 'transparent',
                              color: paymentMethod === 'paypal' ? '#fff' : '#333',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                          >
                            PayPal
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'manual' && (
                        <>
                          <div className="form-group">
                            <label>Método de Pago *</label>
                            <select
                              value={selectedFormaPago}
                              onChange={(e) => setSelectedFormaPago(e.target.value)}
                              required={esPagado && paymentMethod === 'manual'}
                            >
                              <option value="">Selecciona un método</option>
                              {formasPago.map((fp) => (
                                <option key={fp.CODIGO} value={fp.CODIGO}>
                                  {fp.NOMBRE}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Monto *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={montoInput}
                              onChange={(e) => setMontoInput(e.target.value)}
                              placeholder="0.00"
                              required={esPagado && paymentMethod === 'manual'}
                            />
                            <small>Monto del curso: ${costo.toFixed(2)}</small>
                          </div>

                          <div className="form-group">
                            <label>Comprobante de Pago</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                              onChange={handleFileChange}
                            />
                            <small>Formatos permitidos: PDF, JPG, PNG, GIF, WEBP (máx. 10MB)</small>
                            {comprobante && (
                              <div className="file-selected">
                                📄 {comprobante.name}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {paymentMethod === 'paypal' && (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label>Pagar con PayPal</label>
                          <div style={{ 
                            padding: '1rem', 
                            background: '#f8fafc', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <PayPalButton
                              amount={costo}
                              currency="USD"
                              onSuccess={async (order) => {
                                try {
                                  // Registrar el pago de PayPal en el backend
                                  const pagoRes = await fetch('http://localhost:5000/api/pagos/paypal', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      inscripcionId: inscripcionId,
                                      monto: costo,
                                      paypalOrderId: order.id,
                                      paypalDetails: order
                                    })
                                  });

                                  const pagoData = await pagoRes.json();

                                  if (!pagoRes.ok) {
                                    console.error('Error del backend:', pagoData);
                                    // Si el error es que ya existe un pago, considerar como éxito
                                    if (pagoData.error && (pagoData.error.includes('Ya existe un pago') || pagoData.error.includes('ya existe'))) {
                                      console.log('✅ Pago ya registrado, considerando como éxito');
                                      setError(''); // Limpiar error PRIMERO
                                      setPaypalSuccess(true);
                                      setYaInscrito(true);
                                      
                                      // Verificar el estado del pago directamente
                                      try {
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        const pagoCheckRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${inscripcionId}`);
                                        if (pagoCheckRes.ok) {
                                          const pagoCheckData = await pagoCheckRes.json();
                                          const pagoAprobado = pagoCheckData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                                          setPagoAprobado(pagoAprobado || false);
                                        } else {
                                          setPagoAprobado(false);
                                        }
                                      } catch (e) {
                                        setPagoAprobado(false);
                                      }
                                      
                                      setTimeout(() => {
                                        setSuccess(true);
                                      }, 1000);
                                      return; // Salir sin lanzar error
                                    }
                                    // Si es otro error, verificar si el pago realmente se procesó
                                    console.warn('Error del backend, pero verificando si el pago se procesó:', pagoData);
                                    throw new Error(pagoData.error || pagoData.details || 'Error al registrar el pago de PayPal');
                                  }

                                  // Pago exitoso
                                  console.log('✅ Pago de PayPal registrado exitosamente');
                                  setError(''); // Limpiar cualquier error previo PRIMERO
                                  setPaypalSuccess(true);
                                  setYaInscrito(true);
                                  
                                  // Verificar el estado del pago directamente
                                  try {
                                    // Esperar un momento para que el pago se registre en la BD
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    const pagoCheckRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${inscripcionId}`);
                                    if (pagoCheckRes.ok) {
                                      const pagoCheckData = await pagoCheckRes.json();
                                      const pagoAprobado = pagoCheckData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                                      setPagoAprobado(pagoAprobado || false);
                                      console.log('💳 Estado del pago PayPal después de crear:', pagoAprobado ? 'Aprobado' : 'Pendiente');
                                    } else {
                                      setPagoAprobado(false);
                                    }
                                  } catch (e) {
                                    console.warn('Error verificando pago PayPal después de crear:', e);
                                    setPagoAprobado(false);
                                  }
                                  
                                  setTimeout(() => {
                                    setSuccess(true);
                                  }, 1000);
                                } catch (err) {
                                  console.error('❌ Error procesando pago PayPal:', err);
                                  // Solo mostrar error si realmente falló y no hay éxito previo
                                  if (!paypalSuccess && !success) {
                                    setError(err.message || 'Error al procesar el pago de PayPal');
                                  } else {
                                    // Si hay éxito previo, limpiar el error
                                    setError('');
                                  }
                                }
                              }}
                              onError={(error) => {
                                console.error('Error en PayPal:', error);
                                setError('Error al procesar el pago con PayPal. Por favor, intenta nuevamente.');
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="form-error">
                          {error}
                        </div>
                      )}

                      <div className="form-actions">
                        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                          Cancelar
                        </Link>
                        {esPagado && paymentMethod === 'paypal' && paypalSuccess ? (
                          <div style={{ 
                            padding: '1rem', 
                            background: '#d1fae5', 
                            border: '1px solid #6ee7b7', 
                            borderRadius: '8px',
                            color: '#065f46',
                            textAlign: 'center'
                          }}>
                            ✅ Pago de PayPal completado. Redirigiendo...
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !user || (esPagado && paymentMethod === 'paypal')} 
                            className="btn btn-primary"
                          >
                            {submitting ? 'Procesando...' : esPagado ? 'Registrar Pago' : 'Completar'}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    // Curso gratis - mostrar mensaje de inscripción completa
                    <div className="info-message" style={{ 
                      padding: '1.5rem', 
                      background: '#d1fae5', 
                      border: '1px solid #6ee7b7', 
                      borderRadius: '8px', 
                      marginBottom: '1.5rem',
                      color: '#065f46'
                    }}>
                      <strong>✅ Ya estás inscrito en este curso.</strong>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
                        Tu inscripción está completa. Puedes acceder al curso desde "Mis Cursos".
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Usuario NO inscrito - mostrar formulario completo de inscripción
                <form onSubmit={handleSubmit} className="payment-form">
                  <div className="form-group">
                    <label>Motivación (Opcional)</label>
                    <textarea
                      value={motivacion}
                      onChange={(e) => setMotivacion(e.target.value)}
                      placeholder="¿Por qué te interesa este curso?"
                      rows="4"
                    />
                  </div>

                  {esPagado && (
                <>
                  <div className="payment-divider">
                    <span>Información de Pago</span>
                  </div>

                  <div className="form-group">
                    <label>Método de Pago *</label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('manual')}
                        className={`payment-method-btn ${paymentMethod === 'manual' ? 'active' : ''}`}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: '2px solid #333',
                          borderRadius: '8px',
                          background: paymentMethod === 'manual' ? '#333' : 'transparent',
                          color: paymentMethod === 'manual' ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        Transferencia/Depósito
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`payment-method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: '2px solid #333',
                          borderRadius: '8px',
                          background: paymentMethod === 'paypal' ? '#333' : 'transparent',
                          color: paymentMethod === 'paypal' ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        PayPal
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'manual' && (
                    <>
                      <div className="form-group">
                        <label>Método de Pago *</label>
                        <select
                          value={selectedFormaPago}
                          onChange={(e) => setSelectedFormaPago(e.target.value)}
                          required={esPagado && paymentMethod === 'manual'}
                        >
                          <option value="">Selecciona un método</option>
                          {formasPago.map((fp) => (
                            <option key={fp.CODIGO} value={fp.CODIGO}>
                              {fp.NOMBRE}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Pagar con PayPal</label>
                      <div style={{ 
                        padding: '1rem', 
                        background: '#f8fafc', 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <PayPalButton
                          amount={costo}
                          currency="USD"
                          onSuccess={async (order) => {
                            try {
                              // Primero crear la inscripción si no existe
                              let nuevaInscripcionId = inscripcionId;
                              
                              if (!yaInscrito && user && user.id) {
                                const inscripcionRes = await fetch(`http://localhost:5000/api/estudiantes/${user.id}/inscribir`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    eventoId: parseInt(courseId),
                                    motivacion: motivacion || null
                                  })
                                });

                                const inscripcionData = await inscripcionRes.json();
                                
                                if (inscripcionRes.ok) {
                                  nuevaInscripcionId = inscripcionData.inscripcionId;
                                  setInscripcionId(nuevaInscripcionId);
                                  setYaInscrito(true); // Actualizar estado
                                } else if (inscripcionData.error && inscripcionData.error.includes('ya inscrito')) {
                                  // Si ya está inscrito, necesitamos obtener el ID de inscripción de otra forma
                                  // Ya que obtenerEventosDeUsuario solo devuelve aprobados, necesitamos buscar directamente
                                  // Por ahora, usamos el ID que devuelve el error o buscamos en la BD
                                  console.log('⚠️ Usuario ya inscrito, buscando inscripción...');
                                  // El backend debería devolver el ID de inscripción existente en el error
                                  // Si no, necesitamos crear un endpoint para buscar inscripciones pendientes
                                }
                              }

                              // Registrar el pago de PayPal en el backend
                              const pagoRes = await fetch('http://localhost:5000/api/pagos/paypal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  inscripcionId: nuevaInscripcionId,
                                  monto: costo,
                                  paypalOrderId: order.id,
                                  paypalDetails: order
                                })
                              });

                              const pagoData = await pagoRes.json();

                              if (!pagoRes.ok) {
                                console.error('Error del backend:', pagoData);
                                // Si el error es que ya existe un pago, considerar como éxito
                                if (pagoData.error && (pagoData.error.includes('Ya existe un pago') || pagoData.error.includes('ya existe'))) {
                                  console.log('Pago ya registrado, considerando como éxito');
                                  setError(''); // Limpiar error primero
                                  setPaypalSuccess(true);
                                  setInscripcionId(nuevaInscripcionId);
                                  setYaInscrito(true);
                                  
                                  // Verificar el estado del pago directamente
                                  try {
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    const pagoCheckRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${nuevaInscripcionId}`);
                                    if (pagoCheckRes.ok) {
                                      const pagoCheckData = await pagoCheckRes.json();
                                      const pagoAprobado = pagoCheckData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                                      setPagoAprobado(pagoAprobado || false);
                                    } else {
                                      setPagoAprobado(false);
                                    }
                                  } catch (e) {
                                    setPagoAprobado(false);
                                  }
                                  
                                  setTimeout(() => {
                                    setSuccess(true);
                                  }, 1000);
                                  return; // Salir sin lanzar error
                                }
                                throw new Error(pagoData.error || pagoData.details || 'Error al registrar el pago de PayPal');
                              }

                              // Pago exitoso
                              setError(''); // Limpiar cualquier error previo PRIMERO
                              setPaypalSuccess(true);
                              setInscripcionId(nuevaInscripcionId);
                              setYaInscrito(true); // Actualizar estado
                              
                              // Verificar el estado del pago directamente
                              try {
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const pagoCheckRes = await fetch(`http://localhost:5000/api/pagos/inscripcion/${nuevaInscripcionId}`);
                                if (pagoCheckRes.ok) {
                                  const pagoCheckData = await pagoCheckRes.json();
                                  const pagoAprobado = pagoCheckData.data?.some(p => p.CODIGOESTADOPAGO === 'VAL');
                                  setPagoAprobado(pagoAprobado || false);
                                  console.log('💳 Estado del pago PayPal después de crear:', pagoAprobado ? 'Aprobado' : 'Pendiente');
                                } else {
                                  setPagoAprobado(false);
                                }
                              } catch (e) {
                                console.warn('Error verificando pago PayPal después de crear:', e);
                                setPagoAprobado(false);
                              }
                              
                              setTimeout(() => {
                                setSuccess(true);
                              }, 1000);
                            } catch (err) {
                              console.error('Error procesando pago PayPal:', err);
                              // Solo mostrar error si realmente falló y no hay éxito previo
                              if (!paypalSuccess && !success) {
                                setError(err.message || 'Error al procesar el pago de PayPal');
                              }
                            }
                          }}
                          onError={(error) => {
                            console.error('Error en PayPal:', error);
                            setError('Error al procesar el pago con PayPal. Por favor, intenta nuevamente.');
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'manual' && (
                    <>
                      <div className="form-group">
                        <label>Monto *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={montoInput}
                          onChange={(e) => setMontoInput(e.target.value)}
                          placeholder="0.00"
                          required={esPagado && paymentMethod === 'manual'}
                        />
                        <small>Monto del curso: ${costo.toFixed(2)}</small>
                      </div>

                      <div className="form-group">
                        <label>Comprobante de Pago</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={handleFileChange}
                        />
                        <small>Formatos permitidos: PDF, JPG, PNG, GIF, WEBP (máx. 10MB)</small>
                        {comprobante && (
                          <div className="file-selected">
                            📄 {comprobante.name}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

                  <div className="form-actions">
                    <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                      Cancelar
                    </Link>
                    {esPagado && paymentMethod === 'paypal' && paypalSuccess ? (
                      <div style={{ 
                        padding: '1rem', 
                        background: '#d1fae5', 
                        border: '1px solid #6ee7b7', 
                        borderRadius: '8px',
                        color: '#065f46',
                        textAlign: 'center'
                      }}>
                        ✅ Pago de PayPal completado. Redirigiendo...
                      </div>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={submitting || !user || (esPagado && paymentMethod === 'paypal')} 
                        className="btn btn-primary"
                      >
                        {submitting ? 'Procesando...' : esPagado ? 'Inscribirse y Pagar' : 'Inscribirse'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

