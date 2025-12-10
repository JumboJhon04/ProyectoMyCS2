// AuthRegister.jsx - Componente de Registro Mejorado
import React, { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './register.css';
import imgRegistro from '../../assets/icons/imgRegistro.jpg';
import PublicHeader from '../../components/PublicHeader/PublicHeader';

export default function AuthRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    correo: '',
    contrasena: '',
    facultad: '',
    carrera: ''
  });
  
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [carrerasFiltradas, setCarrerasFiltradas] = useState([]);
  const [mostrarCamposUTA, setMostrarCamposUTA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [erroresValidacion, setErroresValidacion] = useState({});

  // Cargar facultades y carreras al montar el componente
  useEffect(() => {
    cargarFacultades();
    cargarCarreras();
  }, []);

  // Detectar si el correo es @uta.edu.ec
  useEffect(() => {
    const esCorreoUTA = formData.correo.toLowerCase().endsWith('@uta.edu.ec');
    setMostrarCamposUTA(esCorreoUTA);
    
    if (!esCorreoUTA) {
      setFormData(prev => ({
        ...prev,
        facultad: '',
        carrera: ''
      }));
    }
  }, [formData.correo]);

  // Filtrar carreras según la facultad seleccionada
  useEffect(() => {
    if (formData.facultad) {
      const carrerasDeLaFacultad = carreras.filter(
        carrera => carrera.SECUENCIALFACULTAD === parseInt(formData.facultad)
      );
      setCarrerasFiltradas(carrerasDeLaFacultad);
      setFormData(prev => ({ ...prev, carrera: '' }));
    } else {
      setCarrerasFiltradas([]);
    }
  }, [formData.facultad, carreras]);

  const cargarFacultades = async () => {
    try {
      const response = await fetch(`${API_URL}/api/facultades`);
      const data = await response.json();
      if (data.success) {
        setFacultades(data.data);
      }
    } catch (err) {
      console.error('Error al cargar facultades:', err);
    }
  };

  const cargarCarreras = async () => {
    try {
      const response = await fetch(`${API_URL}/api/carreras`);
      const data = await response.json();
      if (data.success) {
        setCarreras(data.data);
      }
    } catch (err) {
      console.error('Error al cargar carreras:', err);
    }
  };

  const validarCedulaEcuatoriana = (cedula) => {
    if (cedula.length !== 10) return false;
    
    // Verificar que solo contenga números
    if (!/^\d+$/.test(cedula)) return false;
    
    const digitos = cedula.split('').map(Number);
    const digitoVerificador = digitos[9];
    
    // Algoritmo de validación de cédula ecuatoriana
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let valor = digitos[i] * coeficientes[i];
      if (valor > 9) valor -= 9;
      suma += valor;
    }
    
    const resultado = suma % 10;
    const digitoEsperado = resultado === 0 ? 0 : 10 - resultado;
    
    return digitoEsperado === digitoVerificador;
  };

  const validarContrasenaSegura = (contrasena) => {
    const errores = [];
    
    if (contrasena.length < 8) {
      errores.push('mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(contrasena)) {
      errores.push('una mayúscula');
    }
    if (!/[a-z]/.test(contrasena)) {
      errores.push('una minúscula');
    }
    if (!/[0-9]/.test(contrasena)) {
      errores.push('un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(contrasena)) {
      errores.push('un carácter especial');
    }
    
    return errores;
  };

  const validarEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad >= 16;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validación en tiempo real para cédula (solo números)
    if (name === 'cedula') {
      const soloNumeros = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: soloNumeros }));
      
      if (soloNumeros.length === 10) {
        if (!validarCedulaEcuatoriana(soloNumeros)) {
          setErroresValidacion(prev => ({
            ...prev,
            cedula: 'Cédula ecuatoriana no válida'
          }));
        } else {
          setErroresValidacion(prev => {
            const { cedula, ...rest } = prev;
            return rest;
          });
        }
      }
    }
    // Validación en tiempo real para teléfono (solo números, máximo 10, debe empezar con 09)
    else if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: soloNumeros }));
      }
      
      if (soloNumeros.length > 0 && soloNumeros.length < 10) {
        setErroresValidacion(prev => ({
          ...prev,
          telefono: 'El teléfono debe tener 10 dígitos'
        }));
      } else if (soloNumeros.length === 10 && !soloNumeros.startsWith('09')) {
        setErroresValidacion(prev => ({
          ...prev,
          telefono: 'El teléfono debe comenzar con 09'
        }));
      } else if (soloNumeros.length === 10 && soloNumeros.startsWith('09')) {
        setErroresValidacion(prev => {
          const { telefono, ...rest } = prev;
          return rest;
        });
      }
    }
    // Validación de contraseña
    else if (name === 'contrasena') {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (value.length > 0) {
        const erroresPass = validarContrasenaSegura(value);
        if (erroresPass.length > 0) {
          setErroresValidacion(prev => ({
            ...prev,
            contrasena: `Falta: ${erroresPass.join(', ')}`
          }));
        } else {
          setErroresValidacion(prev => {
            const { contrasena, ...rest } = prev;
            return rest;
          });
        }
      }
    }
    // Validación de edad
    else if (name === 'fechaNacimiento') {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (value) {
        if (!validarEdad(value)) {
          setErroresValidacion(prev => ({
            ...prev,
            fechaNacimiento: 'Debes ser mayor de 16 años'
          }));
        } else {
          setErroresValidacion(prev => {
            const { fechaNacimiento, ...rest } = prev;
            return rest;
          });
        }
      }
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones finales antes de enviar
    if (!formData.nombres || !formData.apellidos || !formData.cedula || 
        !formData.correo || !formData.contrasena || !formData.telefono || 
        !formData.fechaNacimiento) {
      setError('Todos los campos obligatorios deben ser completados');
      return;
    }

    if (!validarCedulaEcuatoriana(formData.cedula)) {
      setError('La cédula ecuatoriana no es válida');
      return;
    }

    if (formData.telefono.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos');
      return;
    }

    if (!formData.telefono.startsWith('09')) {
      setError('El teléfono debe comenzar con 09');
      return;
    }

    if (!validarEdad(formData.fechaNacimiento)) {
      setError('Debes ser mayor de 16 años para registrarte');
      return;
    }

    const erroresPass = validarContrasenaSegura(formData.contrasena);
    if (erroresPass.length > 0) {
      setError(`Contraseña insegura. Falta: ${erroresPass.join(', ')}`);
      return;
    }

    if (mostrarCamposUTA && (!formData.facultad || !formData.carrera)) {
      setError('Debes seleccionar tu facultad y carrera');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      setSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
      
      setFormData({
        nombres: '',
        apellidos: '',
        cedula: '',
        fechaNacimiento: '',
        telefono: '',
        direccion: '',
        correo: '',
        contrasena: '',
        facultad: '',
        carrera: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Error al registrar:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PublicHeader />
      <div className="auth-register-root">
        <div className="auth-register-wrap">
          <div className="auth-register-form">
            <div className="auth-register-inner">
              <div onSubmit={handleSubmit}>
                <div className="auth-register-grid">
                  <div className="auth-register-group">
                    <label>Nombres </label>
                    <input 
                      type="text" 
                      name="nombres"
                      placeholder="Nombres" 
                      value={formData.nombres}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="auth-register-group">
                    <label>Apellidos </label>
                    <input 
                      type="text" 
                      name="apellidos"
                      placeholder="Apellidos" 
                      value={formData.apellidos}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="auth-register-group">
                    <label>Cédula Ecuatoriana </label>
                    <input 
                      type="text" 
                      name="cedula"
                      placeholder="1234567890" 
                      value={formData.cedula}
                      onChange={handleChange}
                      maxLength="10"
                      className={erroresValidacion.cedula ? 'input-error' : ''}
                      required
                    />
                    {erroresValidacion.cedula && (
                      <span className="error-message">{erroresValidacion.cedula}</span>
                    )}
                  </div>

                  <div className="auth-register-group">
                    <label>Fecha de Nacimiento </label>
                    <input 
                      type="date" 
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleChange}
                      className={erroresValidacion.fechaNacimiento ? 'input-error' : ''}
                      required
                    />
                    {erroresValidacion.fechaNacimiento && (
                      <span className="error-message">{erroresValidacion.fechaNacimiento}</span>
                    )}
                  </div>

                  <div className="auth-register-group">
                    <label>Teléfono</label>
                    <input 
                      type="tel" 
                      name="telefono"
                      placeholder="0987654321" 
                      value={formData.telefono}
                      onChange={handleChange}
                      maxLength="10"
                      className={erroresValidacion.telefono ? 'input-error' : ''}
                      required
                    />
                    {erroresValidacion.telefono && (
                      <span className="error-message">{erroresValidacion.telefono}</span>
                    )}
                  </div>

                  <div className="auth-register-group">
                    <label>Dirección</label>
                    <input 
                      type="text" 
                      name="direccion"
                      placeholder="Dirección" 
                      value={formData.direccion}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="auth-register-group" style={{ marginTop: '16px' }}>
                  <label>Correo Electrónico </label>
                  <input 
                    type="email" 
                    name="correo"
                    placeholder="ejemplo@correo.com" 
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                  {mostrarCamposUTA && (
                    <span style={{ color: '#27ae60', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      ✓ Correo institucional UTA detectado
                    </span>
                  )}
                </div>

                {mostrarCamposUTA && (
                  <div className="auth-register-grid" style={{ marginTop: '16px' }}>
                    <div className="auth-register-group">
                      <label>Facultad </label>
                      <select
                        name="facultad"
                        value={formData.facultad}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona tu facultad</option>
                        {facultades.map(fac => (
                          <option key={fac.SECUENCIAL} value={fac.SECUENCIAL}>
                            {fac.NOMBRE}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="auth-register-group">
                      <label>Carrera </label>
                      <select
                        name="carrera"
                        value={formData.carrera}
                        onChange={handleChange}
                        disabled={!formData.facultad}
                        required
                      >
                        <option value="">Selecciona tu carrera</option>
                        {carrerasFiltradas.map(car => (
                          <option key={car.SECUENCIAL} value={car.SECUENCIAL}>
                            {car.NOMBRE_CARRERA}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="auth-register-group" style={{ marginTop: '16px' }}>
                  <label>Contraseña </label>
                  <input 
                    type="password" 
                    name="contrasena"
                    placeholder="Contraseña segura" 
                    value={formData.contrasena}
                    onChange={handleChange}
                    className={erroresValidacion.contrasena ? 'input-error' : ''}
                    required
                  />
                  {erroresValidacion.contrasena && (
                    <span className="error-message">{erroresValidacion.contrasena}</span>
                  )}
                  <span style={{ color: '#7f8c8d', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                    Mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial
                  </span>
                </div>

                {error && (
                  <div style={{
                    color: '#dc3545',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '15px'
                  }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    color: '#155724',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '15px'
                  }}>
                    {success}
                  </div>
                )}

                <div className="auth-register-actions">
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    className="auth-register-submit"
                    disabled={loading || Object.keys(erroresValidacion).length > 0}
                  >
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-register-info">
            <h1>Registrar una cuenta</h1>
            <p>Accede a todos los cursos disponibles en nuestra página y obtén un certificado internacional</p>
            <div className="auth-register-image" aria-hidden="true" style={{ backgroundImage: `url(${imgRegistro})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </div>
        </div>
      </div>
    </div>
  );
}