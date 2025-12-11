// Configuración de temas por tipo de evento
// Define colores y configuraciones específicas para cada tipo de evento académico
// Paleta oscura con toques de color opacos para mantener la esencia del sistema

export const EVENT_THEMES = {
    CUR: {
        // Curso - Tonos oscuros con acento azul opaco
        name: 'Curso',
        primaryColor: '#2c3e50', // Azul oscuro grisáceo
        secondaryColor: '#1a252f',
        accentColor: '#34495e', // Gris azulado
        lightBg: '#ecf0f1',
        showGrades: true,
    },
    TALL: {
        // Taller - Tonos oscuros con acento púrpura opaco
        name: 'Taller',
        primaryColor: '#2c2c3e', // Púrpura oscuro grisáceo
        secondaryColor: '#1f1f2e',
        accentColor: '#3e3e52', // Gris violáceo
        lightBg: '#f0eff4',
        showGrades: true,
    },
    SEM: {
        // Seminario - Tonos oscuros con acento verde opaco
        name: 'Seminario',
        primaryColor: '#2c3a2f', // Verde oscuro grisáceo
        secondaryColor: '#1f2922',
        accentColor: '#3e514a', // Gris verdoso
        lightBg: '#eff3f0',
        showGrades: false,
    },
    CONF: {
        // Conferencia - Tonos oscuros con acento ámbar opaco
        name: 'Conferencia',
        primaryColor: '#3a3229', // Ámbar oscuro grisáceo
        secondaryColor: '#2b2520',
        accentColor: '#4d453c', // Gris ambarino
        lightBg: '#f3f1ed',
        showGrades: false,
    },
};

// Función auxiliar para obtener el tema según código de tipo de evento
export const getEventTheme = (eventTypeCode) => {
    return EVENT_THEMES[eventTypeCode] || EVENT_THEMES.CUR;
};
