// src/pages/User/Profesor/EventoProfesor/EventoProfesor.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaClock } from 'react-icons/fa'; // Iconos para Estudiantes y Próxima Clase
import './EventoProfesor.css'; 

const EventoProfesor = ({ id, title, students, nextClassDate, nextClassTime, imageUrl }) => {
  const navigate = useNavigate();
  
  // Usar el icono del mockup si se puede (FaDatabase para Base de Datos)
  // Nota: El mockup no usa el ícono pasado por prop, sino una imagen de fondo/logo.
  const FinalIcon = imageUrl || 'https://via.placeholder.com/50';

  const handleCourseClick = () => {
    if (id) {
      navigate(`/profesor/course/${id}`);
    }
  };

  return (
    <div className="course-card" onClick={handleCourseClick} style={{ cursor: 'pointer' }}> {/* Reutiliza la clase del contenedor de tarjeta */}
      
      {/* Icono/Imagen del curso */}
      <div className="course-icon-container">
        <img src={FinalIcon} alt={title} className="course-icon" />
      </div>

      <div className="course-details">
        <h3>{title}</h3>
        <p className="course-info-profesor">
          <FaUsers className="info-icon" /> {students} estudiantes
        </p>
        <p className="course-info-profesor">
          <FaClock className="info-icon" /> Siguiente clase: {nextClassDate} {nextClassTime}
        </p>
      </div>

    </div>
  );
};

export default EventoProfesor;