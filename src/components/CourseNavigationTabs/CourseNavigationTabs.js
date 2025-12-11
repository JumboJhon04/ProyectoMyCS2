import React from 'react';
import { FaBook, FaUsers, FaChartBar, FaCalendarCheck } from 'react-icons/fa';
import './CourseNavigationTabs.css';

const CourseNavigationTabs = ({ activeTab, onTabChange, eventType, showGrades }) => {
    const tabs = [
        {
            id: 'material',
            label: 'Material',
            icon: <FaBook />,
        },
        {
            id: 'participantes',
            label: 'Participantes',
            icon: <FaUsers />,
        },
        {
            id: 'asistencia',
            label: 'Asistencia',
            icon: <FaCalendarCheck />,
        },
    ];

    // Agregar tab de calificaciones solo si showGrades es true
    if (showGrades) {
        tabs.push({
            id: 'calificaciones',
            label: 'Calificaciones',
            icon: <FaChartBar />,
        });
    }

    return (
        <div className={`course-nav-tabs theme-${eventType.toLowerCase()}`}>
            <div className="nav-tabs-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CourseNavigationTabs;
