import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import PublicHeader from '../../components/PublicHeader/PublicHeader';
import './login.css';

export default function AuthLogin() {
  return (
    <div>
      <PublicHeader />
      <div className="auth-login-root">
        <div className="auth-login-card">
        <div className="auth-login-left">
          <div className="auth-login-topicon">
            <FaUser size={36} />
          </div>

          <div className="auth-login-fields">
            <label className="auth-label">Direccion de Correo</label>
            <div className="auth-input-wrap">
              <FaEnvelope className="auth-icon" />
              <input className="auth-input" type="email" placeholder="Direccion de Correo" />
            </div>

            <label className="auth-label">Contraseña</label>
            <div className="auth-input-wrap">
              <FaLock className="auth-icon" />
              <input className="auth-input" type="password" placeholder="Contraseña" />
            </div>

            <button className="auth-login-btn">INGRESAR</button>

            <div className="auth-login-pill" />
          </div>
        </div>

        <div className="auth-login-right">
          <h3>No tiene cuenta</h3>
          <p>Registre una nueva cuenta para poder acceder a nuestros cursos online o presencial que ofrecemos</p>
          <Link to="/register" className="auth-register-btn">Registrarse</Link>
        </div>
      </div>
    </div>
    </div>
  );
}
