
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './EventoResponsable.css';
import { API_BASE_URL } from '../../../context/CoursesContext'; // Assuming this is exported or I need to find where it is

// Fallback if not exported
const API_URL = 'http://localhost:5000'; 

const GradesModal = ({ isOpen, onClose, course, user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && course) {
      loadStudents();
      setIsFinalized(course.ESTADO === 'FINALIZADO');
    }
  }, [isOpen, course]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${course.id}/inscritos`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      } else {
        setError('Error al cargar estudiantes');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (id, field, value) => {
    if (isFinalized) return;
    setStudents(prev => prev.map(s => 
      s.usuarioId === id ? { ...s, [field]: value } : s
    ));
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      const grades = students.map(s => ({
        usuarioId: s.usuarioId,
        nota: s.NOTA,
        asistencia: s.ASISTENCIA
      }));
      
      const res = await fetch(`${API_URL}/api/eventos/${course.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Notas guardadas correctamente');
      } else {
        alert('Error al guardar: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  const finalizeCourse = async () => {
    if (!window.confirm('¿Estás seguro de FINALIZAR este curso? \n\nEsta acción cerrará el curso de forma permanente y ya no se podrán editar las notas. Se generará el reporte final.')) {
      return;
    }
    
    // No guardar notas al finalizar, ya que el responsable no las edita
    // await saveGrades();

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${course.id}/finalizar`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setIsFinalized(true);
        course.ESTADO = 'FINALIZADO'; // Optimistic update
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
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte de Calificaciones Finales', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Evento: ${course.title}`, 14, 32);
    doc.text(`Instructor: ${user?.nombres} ${user?.apellidos}`, 14, 38);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 44);

    // Calc Stats
    const passingGrade = parseFloat(course.passingGrade || 7); // Default 7 if null
    const passed = students.filter(s => parseFloat(s.NOTA || 0) >= passingGrade).length;
    const avg = students.reduce((acc, curr) => acc + parseFloat(curr.NOTA || 0), 0) / (students.length || 1);

    doc.text(`Nota Aprobación: ${passingGrade}`, 150, 32);
    doc.text(`Aprobados: ${passed} / ${students.length}`, 150, 38);
    doc.text(`Promedio Curso: ${avg.toFixed(2)}`, 150, 44);

    // Table
    const tableData = students.map(s => [
      `${s.APELLIDOS} ${s.NOMBRES}`,
      s.CEDULA,
      s.CORREO,
      s.ASISTENCIA + '%',
      parseFloat(s.NOTA || 0).toFixed(2),
      parseFloat(s.NOTA || 0) >= passingGrade ? 'APROBADO' : 'REPROBADO'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Estudiante', 'Cédula', 'Correo', 'Asistencia', 'Nota', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Blue
      alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Signatures
    doc.line(20, finalY + 40, 90, finalY + 40); // Line 1
    doc.text('Firma Instructor', 35, finalY + 45);

    doc.line(120, finalY + 40, 190, finalY + 40); // Line 2
    doc.text('Firma Coordinador', 135, finalY + 45);

    doc.save(`Reporte_${course.title.replace(/\s+/g, '_')}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal grades-modal">
        <div className="modal-header">
          <h2 className="modal-title">Gestión de Calificaciones</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
            {isFinalized && (
                <div className="alert-warning" style={{marginBottom: '20px', padding: '10px', background:'#fee2e2', color:'#b91c1c', borderRadius:'8px'}}>
                    ⚠️ Este curso ha sido FINALIZADO. Las notas son de solo lectura.
                </div>
            )}
            
            {loading ? <p>Cargando estudiantes...</p> : (
                <div className="students-table-container">
                    <table className="grades-table">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Cédula</th>
                                <th>Estado</th>
                                <th>Asistencia (%)</th>
                                <th>Nota (0-10)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.usuarioId}>
                                    <td>
                                        <div className="student-name">{s.APELLIDOS} {s.NOMBRES}</div>
                                        <div className="student-email">{s.CORREO}</div>
                                    </td>
                                    <td>{s.CEDULA}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            background: s.CODIGOESTADOINSCRIPCION === 'ACE' ? '#dcfce7' : '#fef2f2',
                                            color: s.CODIGOESTADOINSCRIPCION === 'ACE' ? '#166534' : '#991b1b',
                                            border: s.CODIGOESTADOINSCRIPCION === 'ACE' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                                        }}>
                                            {s.CODIGOESTADOINSCRIPCION === 'ACE' ? 'Inscrito' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td>
                                        <input 
                                            type="number" min="0" max="100"
                                            value={s.ASISTENCIA}
                                            disabled={true} 
                                            className="grade-input"
                                            style={{backgroundColor: '#f3f4f6', cursor: 'not-allowed'}}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="number" min="0" max="10" step="0.01"
                                            value={s.NOTA}
                                            disabled={true}
                                            className="grade-input"
                                            style={{backgroundColor: '#f3f4f6', cursor: 'not-allowed'}}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No hay estudiantes inscritos</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div className="modal-footer">
            {!isFinalized ? (
                <>
                    <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                    {/* Responsable cannot edit grades directly here */}
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
