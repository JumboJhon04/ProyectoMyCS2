
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './EventoResponsable.css';
import { API_BASE_URL } from '../../../context/CoursesContext'; // Assuming this is exported or I need to find where it is

// Fallback if not exported
const API_URL = 'http://localhost:5000';

const GradesModal = ({ isOpen, onClose, course, user }) => {
  const [students, setStudents] = useState([]);
  const [evaluables, setEvaluables] = useState([]); // Tareas y Exámenes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [error, setError] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  useEffect(() => {
    if (isOpen && course) {
      loadData();
      setIsFinalized(course.ESTADO === 'FINALIZADO');
    }
  }, [isOpen, course]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${course.id}/reporte-detallado`);
      const data = await res.json();

      if (data.success) {
        setStudents(data.data.students);
        setEvaluables(data.data.evaluables || data.data.tasks); // Fallback logic
      } else {
        setError('Error al cargar datos');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getEvaluableGrade = (student, evaluableId) => {
    const val = student.grades?.[evaluableId];
    return (val !== undefined && val !== null) ? parseFloat(val).toFixed(2) : '-';
  };

  const calculateAverage = (student) => {
    if (evaluables.length === 0) return parseFloat(student.NOTA || 0);

    // Calcular promedio considerando tareas y exámenes
    const sum = evaluables.reduce((acc, item) => {
      const grade = parseFloat(student.grades?.[item.ID_REF] || 0);
      return acc + grade;
    }, 0);

    return (sum / evaluables.length);
  };

  const toggleExpand = (studentId) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  const finalizeCourse = async () => {
    if (!window.confirm('¿Estás seguro de FINALIZAR este curso? \n\nEsta acción cerrará el curso de forma permanente.')) {
      return;
    }
    setSaving(true);
    try {
      const finalGrades = students.map(s => ({
        usuarioId: s.usuarioId,
        nota: calculateAverage(s).toFixed(2),
        asistencia: s.ASISTENCIA
      }));

      await fetch(`${API_URL}/api/eventos/${course.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: finalGrades })
      });

      const res = await fetch(`${API_URL}/api/eventos/${course.id}/finalizar`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setIsFinalized(true);
        course.ESTADO = 'FINALIZADO';
        generatePDF();
        alert('Curso finalizado exitosamente.');
      } else {
        alert('Error al finalizar: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF('l');

    doc.setFontSize(20);
    doc.text('Reporte de Calificaciones Detallado', 14, 22);

    doc.setFontSize(12);
    doc.text(`Evento: ${course.title}`, 14, 32);
    doc.text(`Instructor: ${user?.nombres} ${user?.apellidos}`, 14, 38);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 44);

    const passingGrade = parseFloat(course.passingGrade || 7);

    const studentsWithAvg = students.map(s => ({ ...s, avg: calculateAverage(s) }));
    const passed = studentsWithAvg.filter(s => s.avg >= passingGrade).length;
    const avgCurso = studentsWithAvg.reduce((acc, curr) => acc + curr.avg, 0) / (students.length || 1);

    doc.text(`Nota Aprobación: ${passingGrade}`, 200, 32);
    doc.text(`Aprobados: ${passed} / ${students.length}`, 200, 38);
    doc.text(`Promedio Curso: ${avgCurso.toFixed(2)}`, 200, 44);

    const headers = ['Estudiante', 'Cédula', 'Asistencia', 'Estado', ...evaluables.map(t => t.TITULO.substring(0, 10) + '...'), 'Promedio'];

    const tableData = studentsWithAvg.map(s => {
      const row = [
        `${s.APELLIDOS} ${s.NOMBRES}`,
        s.CEDULA,
        s.ASISTENCIA + '%',
        s.avg >= passingGrade ? 'APROBADO' : 'REPROBADO'
      ];

      evaluables.forEach(t => {
        row.push(getEvaluableGrade(s, t.ID_REF));
      });

      row.push(s.avg.toFixed(2));
      return row;
    });

    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { fontSize: 8 }
    });

    doc.save(`Reporte_Detallado_${course.title.replace(/\s+/g, '_')}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal grades-modal" style={{ maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2 className="modal-title">Gestión de Calificaciones Detallada</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {isFinalized && (
            <div className="alert-warning" style={{ marginBottom: '20px', padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
              ⚠️ Este curso ha sido FINALIZADO.
            </div>
          )}

          {loading ? <p>Cargando datos...</p> : (
            <div className="students-table-container">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}></th> {/* Column for expand arrow */}
                    <th style={{ textAlign: 'left' }}>Estudiante</th>
                    <th>Cédula</th>
                    <th>Promedio Final</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const avg = calculateAverage(s);
                    const isExpanded = expandedStudentId === s.usuarioId;
                    return (
                      <React.Fragment key={s.usuarioId}>
                        <tr onClick={() => toggleExpand(s.usuarioId)} style={{ cursor: 'pointer', background: isExpanded ? '#f1f5f9' : 'white' }}>
                          <td style={{ textAlign: 'center', fontSize: '1.2em' }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {s.APELLIDOS} {s.NOMBRES}
                          </td>
                          <td>{s.CEDULA}</td>
                          <td style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                            {avg.toFixed(2)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="4" style={{ padding: '0 0 20px 0', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                              <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                {evaluables.map(e => (
                                  <div key={e.ID_REF} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.8em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>{e.TIPO || 'ACTIVIDAD'}</span>
                                      {/* <span>Max: {e.PUNTOS_MAXIMOS}</span> */}
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#334155', margin: '5px 0' }}>{e.TITULO}</div>
                                    <div style={{ fontSize: '1.5em', color: '#2563eb', fontWeight: 'bold' }}>
                                      {getEvaluableGrade(s, e.ID_REF)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                  {students.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay estudiantes</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!isFinalized ? (
            <>
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-danger" onClick={finalizeCourse} disabled={saving || loading}>
                Finalizar Curso
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose}>Cerrar</button>
              <button className="btn-primary" onClick={generatePDF}>
                📄 Descargar Reporte PDF
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradesModal;
