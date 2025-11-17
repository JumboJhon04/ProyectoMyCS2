import React from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

export default function Landing() {
  return (
    <div className="landing-root">
      <div className="landing-card">
        <h1>Bienvenido</h1>
        <p>Selecciona una opción para continuar</p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
          <Link to="/register" className="btn">Registrar cuenta</Link>
        </div>
      </div>
    </div>
  );
}
