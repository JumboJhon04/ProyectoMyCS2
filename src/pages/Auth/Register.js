import React from 'react';
import './register.css';
import imgRegistro from '../../assets/icons/imgRegistro.jpg';

export default function AuthRegister() {

  return (
    <div className="auth-register-root">
      <div className="auth-register-wrap">
        <div className="auth-register-form">
          <div className="auth-register-inner">
            <div className="auth-register-grid">
              <div className="auth-register-group">
                <label>Nombres</label>
                <input type="text" placeholder="Nombres" />
              </div>
              <div className="auth-register-group">
                <label>Apellidos</label>
                <input type="text" placeholder="Apellidos" />
              </div>

              <div className="auth-register-group">
                <label>Cedula</label>
                <input type="text" placeholder="Cedula" />
              </div>
              <div className="auth-register-group">
                <label>Fecha de nacimiento</label>
                <input type="date" />
              </div>

              <div className="auth-register-group">
                <label>Telefono</label>
                <input type="tel" placeholder="Telefono" />
              </div>
              <div className="auth-register-group">
                <label>Direccion</label>
                <input type="text" placeholder="Direccion" />
              </div>

              <div className="auth-register-group">
                <label>Correo</label>
                <input type="email" placeholder="Correo" />
              </div>
              <div className="auth-register-group">
                <label>Contraseña</label>
                <input type="password" placeholder="Contraseña" />
              </div>
            </div>

            <div className="auth-register-actions">
              <button className="auth-register-submit">Crear Cuenta</button>
            </div>
          </div>
        </div>

        <div className="auth-register-info">
          <h1>Registrar una cuenta</h1>
          <p>Accede a todos los cursos disponibles en nuestra pagina y obten un certificado internacional</p>
          <div className="auth-register-image" aria-hidden="true" style={{ backgroundImage: `url(${imgRegistro})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        </div>
      </div>
    </div>
  );
}
