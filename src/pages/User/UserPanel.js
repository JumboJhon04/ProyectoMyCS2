// src/pages/User/UserPanel.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaChalkboardTeacher } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import './UserPanel.css'; // Usamos un nuevo CSS para el UserPanel, replicando la apariencia.

const UserPanel = ({ userName, role, message }) => {
  const { user, setSubRole } = useUser();
  const navigate = useNavigate();
  
  // role: 'Estudiante' o 'Docente'
  const isStudentActive = role === 'Estudiante';
  const roleMessage = message || (isStudentActive ? "Continúa aprendiendo" : "Continúa enseñando");

  const handleRoleChange = (newRole) => {
    if (newRole === 'estudiante') {
      setSubRole('estudiante');
      navigate('/user/panel');
    } else if (newRole === 'profesor') {
      setSubRole('profesor');
      navigate('/profesor/panel');
    }
  };

  return (
    <section className="welcome-section"> {/* Reutiliza la clase de EstudiantePanel */}
      <h1>¡Bienvenido, {userName}!</h1>
      <p>{roleMessage}</p>

      <div className="role-switcher"> {/* Reutiliza la clase de EstudiantePanel */}
        <button
          className={`role-btn ${isStudentActive ? 'active' : ''}`}
          onClick={() => handleRoleChange('estudiante')}
        >
          <FaUser />
          Estudiante
        </button>
        <button
          className={`role-btn ${!isStudentActive ? 'active' : ''}`}
          onClick={() => handleRoleChange('profesor')}
        >
          <FaChalkboardTeacher />
          Docente
        </button>
      </div>
    </section>
  );
};

export default UserPanel;