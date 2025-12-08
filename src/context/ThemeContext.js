import React, { createContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primario: '#333',
    secundario: '#333',
    terciario: '#333'
  });
  const [loading, setLoading] = useState(true);

  // Cargar colores del backend
  useEffect(() => {
    cargarColores();
  }, []);

  // Aplicar los colores como variables CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', theme.primario);
    document.documentElement.style.setProperty('--color-secondary', theme.secundario);
    document.documentElement.style.setProperty('--color-tertiary', theme.terciario);
  }, [theme]);

  const cargarColores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/colores`);
      const data = await response.json();
      if (data.success) {
        setTheme(data.data);
      }
    } catch (error) {
      console.error('Error al cargar colores del tema:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarTema = (nuevosTema) => {
    setTheme(nuevosTema);
  };

  return (
    <ThemeContext.Provider value={{ theme, loading, actualizarTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};
