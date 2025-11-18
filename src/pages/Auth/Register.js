import React, { useState } from 'react';
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
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones básicas
    if (!formData.nombres || !formData.apellidos || !formData.cedula || 
        !formData.correo || !formData.contrasena || !formData.telefono) {
      setError('Todos los campos obligatorios deben ser completados');
      return;
    }

    // Validar longitud de cédula (Ecuador = 10 dígitos)
    if (formData.cedula.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      return;
    }

    // Validar contraseña mínima
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/auth/register', {
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
      
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellidos: '',
        cedula: '',
        fechaNacimiento: '',
        telefono: '',
        direccion: '',
        correo: '',
        contrasena: ''
      });

      // Redirigir al login después de 2 segundos
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
            <form onSubmit={handleSubmit}>
              <div className="auth-register-grid">
                <div className="auth-register-group">
                  <label>Nombres *</label>
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
                  <label>Apellidos *</label>
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
                  <label>Cédula *</label>
                  <input 
                    type="text" 
                    name="cedula"
                    placeholder="Cédula" 
                    value={formData.cedula}
                    onChange={handleChange}
                    maxLength="10"
                    required
                  />
                </div>
                <div className="auth-register-group">
                  <label>Fecha de nacimiento</label>
                  <input 
                    type="date" 
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-register-group">
                  <label>Teléfono *</label>
                  <input 
                    type="tel" 
                    name="telefono"
                    placeholder="Teléfono" 
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                  />
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

                <div className="auth-register-group">
                  <label>Correo *</label>
                  <input 
                    type="email" 
                    name="correo"
                    placeholder="Correo" 
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="auth-register-group">
                  <label>Contraseña *</label>
                  <input 
                    type="password" 
                    name="contrasena"
                    placeholder="Contraseña (mín. 6 caracteres)" 
                    value={formData.contrasena}
                    onChange={handleChange}
                    minLength="6"
                    required
                  />
                </div>
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
                  type="submit" 
                  className="auth-register-submit"
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
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