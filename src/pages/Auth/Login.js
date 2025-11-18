import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useUser } from '../../context/UserContext'; // IMPORTAR
import './login.css';

export default function AuthLogin() {
  const navigate = useNavigate();
  const { setUser } = useUser(); // USAR EL CONTEXTO
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.correo || !formData.contrasena) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      console.log('✅ Login exitoso:', data.data);

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('isAuthenticated', 'true');

      // Actualizar el contexto
      setUser(data.data);

      // En la función handleSubmit, cambiar la redirección:

      // Redirigir según el rol
      if (data.data.codigoRol === 'ADM') {
        navigate('/admin/panel');
      } else if (data.data.codigoRol === 'RES') {  
        navigate('/responsable/profile');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-root">
      <div className="auth-login-card">
        <div className="auth-login-left">
          <div className="auth-login-topicon">
            <FaUser size={36} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-login-fields">
              <label className="auth-label">Dirección de Correo</label>
              <div className="auth-input-wrap">
                <FaEnvelope className="auth-icon" />
                <input 
                  className="auth-input" 
                  type="email" 
                  name="correo"
                  placeholder="Dirección de Correo" 
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <label className="auth-label">Contraseña</label>
              <div className="auth-input-wrap">
                <FaLock className="auth-icon" />
                <input 
                  className="auth-input" 
                  type="password" 
                  name="contrasena"
                  placeholder="Contraseña" 
                  value={formData.contrasena}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div style={{
                  color: '#dc3545',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  padding: '10px',
                  borderRadius: '4px',
                  marginTop: '10px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="auth-login-btn"
                disabled={loading}
              >
                {loading ? 'INGRESANDO...' : 'INGRESAR'}
              </button>

              <div className="auth-login-pill" />
            </div>
          </form>
        </div>

        <div className="auth-login-right">
          <h3>No tiene cuenta</h3>
          <p>Registre una nueva cuenta para poder acceder a nuestros cursos online o presencial que ofrecemos</p>
          <Link to="/register" className="auth-register-btn">Registrarse</Link>
        </div>
      </div>
    </div>
  );
}