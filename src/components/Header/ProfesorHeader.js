// src/components/Header/ProfesorHeader.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
// Reutilizamos la lógica de iniciales de UserHeader.js
const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
  // La imagen muestra solo dos letras (FT)
  return initials.length > 2 ? initials.substring(0, 2) : initials; 
}

const ProfesorHeader = () => {
    const { user } = useUser();
    // Usaremos un mock de usuario si el real no existe, pero FT parece ser el mock en las imágenes.
    const userInitials = getInitials(user?.name || 'Fulanito Test'); 

    return (
        <header className="user-header-container"> {/* Reutiliza la clase principal de estilos */}
            {/* Left side */}
            <div className="user-header-left">
                <h2>Plataforma</h2>
            </div>

            {/* Navigation links - Adaptadas para las rutas del Profesor */}
            <nav className="user-header-nav">
                <NavLink
                    to="/profesor/panel"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Inicio
                </NavLink>
                <NavLink
                    to="/profesor/modules"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Modulos
                </NavLink>
                <NavLink
                    to="/profesor/test"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    Test
                </NavLink>
            </nav>

            {/* User info - El FT del mockup */}
            <div className="user-header-right">
                <div className="user-avatar-initials">
                    {userInitials || 'FT'}
                </div>
            </div>
        </header>
    );
};

export default ProfesorHeader;