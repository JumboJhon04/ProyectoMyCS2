import React, { useEffect, useMemo, useState } from 'react';
import { FaFilePdf, FaFilter, FaChartBar, FaSync } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API_URL from '../../../config/api';
import './ReportesAdmin.css';

const REPORT_ENDPOINT = {
  inscripciones: 'inscripciones',
  pagos: 'pagos',
  asistencias: 'asistencias'
};

const ESTADO_OPTIONS = {
  inscripciones: [
    { value: '', label: 'Todos' },
    { value: 'ACE', label: 'Aceptado' },
    { value: 'PEN', label: 'Pendiente' },
    { value: 'REC', label: 'Rechazado' }
  ],
  pagos: [
    { value: '', label: 'Todos' },
    { value: 'PEN', label: 'Pendiente' },
    { value: 'VAL', label: 'Aprobado' },
    { value: 'RECH', label: 'Rechazado' }
  ],
  asistencias: [
    { value: '', label: 'Todos' },
    { value: 'ACE', label: 'Aceptado' },
    { value: 'PEN', label: 'Pendiente' }
  ]
};

const ReportesAdmin = () => {
  const [reportType, setReportType] = useState('inscripciones');
  const [filtros, setFiltros] = useState({ eventoId: '', estado: '', desde: '', hasta: '' });
  const [eventos, setEventos] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    cargarEventos();
    precargarLogo();
  }, []);

  const precargarLogo = async () => {
    try {
      const response = await fetch('/logo192.png');
      if (!response.ok) return;
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setLogoDataUrl(reader.result);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('No se pudo cargar el logo para el PDF', e);
    }
  };

  const cargarEventos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/eventos`);
      const json = await res.json();
      if (json.success) {
        setEventos(json.data || []);
      }
    } catch (e) {
      console.error('Error cargando eventos', e);
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.eventoId) params.append('eventoId', filtros.eventoId);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    return params.toString();
  };

  const runReport = async () => {
    const endpoint = REPORT_ENDPOINT[reportType];
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const res = await fetch(`${API_URL}/api/reportes/${endpoint}${qs ? `?${qs}` : ''}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'No se pudo generar el reporte');
      setData(json.data || []);
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const estadosDisponibles = useMemo(() => ESTADO_OPTIONS[reportType] || [], [reportType]);

  const formatDate = (date) => {
    if (!date) return '-';
    const dt = new Date(date);
    return dt.toLocaleDateString('es-ES');
  };

  const headerTitulo = {
    inscripciones: 'Reporte de Inscripciones por Evento',
    pagos: 'Reporte de Pagos',
    asistencias: 'Estudiantes y Asistencia',
    completacion: 'Elegibilidad de Certificados',
    ingresos: 'Ingresos por Evento'
  }[reportType];

  const renderResumen = () => {
    if (!data || data.length === 0) return null;
    if (reportType === 'pagos') {
      const total = data.reduce((sum, item) => sum + Number(item.MONTO || 0), 0);
      const aprobados = data.filter((d) => d.CODIGOESTADOPAGO === 'VAL').length;
      const pendientes = data.filter((d) => d.CODIGOESTADOPAGO === 'PEN').length;
      const rechazados = data.filter((d) => d.CODIGOESTADOPAGO === 'RECH').length;
      return (
        <div className="resumen-cards">
          <div className="resumen-card">
            <span className="resumen-label">Total registros</span>
            <span className="resumen-value">{data.length}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Monto acumulado</span>
            <span className="resumen-value">${total.toFixed(2)}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Aprobados</span>
            <span className="resumen-value">{aprobados}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Pendientes</span>
            <span className="resumen-value">{pendientes}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Rechazados</span>
            <span className="resumen-value">{rechazados}</span>
          </div>
        </div>
      );
    }

    const aprobados = data.filter((d) => Number(d.NOTA || 0) >= Number(d.NOTAAPROBACION || d.NOTA_MINIMA || 0)).length;
    const total = data.length;
    return (
      <div className="resumen-cards">
        <div className="resumen-card">
          <span className="resumen-label">Total registros</span>
          <span className="resumen-value">{total}</span>
        </div>
        <div className="resumen-card">
          <span className="resumen-label">Aprobados (por nota)</span>
          <span className="resumen-value">{aprobados}</span>
        </div>
      </div>
    );
  };

  const getEventoTitulo = (id) => {
    const evento = eventos.find((e) => `${e.SECUENCIAL}` === `${id}` || `${e.id}` === `${id}`);
    return evento?.TITULO || evento?.title || 'Todos los eventos';
  };

  const addPdfHeader = (doc) => {
    const width = doc.internal.pageSize.getWidth();
    const pageMargin = 15;
    let yPos = 15;

    // Header background
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, width, 80, 'F');

    // Logo area
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', pageMargin, yPos, 50, 50);
      } catch (e) {
        console.warn('No se pudo agregar logo', e);
      }
    }

    // Title and info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(headerTitulo, pageMargin + 60, yPos + 12);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(
      [
        `Generado: ${new Date().toLocaleString('es-ES')}`,
        `Usuario: ${user?.nombres || 'Admin'}`
      ],
      pageMargin + 60,
      yPos + 20
    );

    // Filter info
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const filterTexts = [
      filtros.eventoId ? `Evento: ${getEventoTitulo(filtros.eventoId)}` : null,
      filtros.estado ? `Estado: ${filtros.estado}` : null,
      filtros.desde ? `Desde: ${formatDate(filtros.desde)}` : null,
      filtros.hasta ? `Hasta: ${formatDate(filtros.hasta)}` : null
    ].filter(Boolean);

    if (filterTexts.length > 0) {
      doc.text(filterTexts.join(' | '), pageMargin + 60, yPos + 35);
    }
  };

  const addPdfFooter = (doc) => {
    const pageCount = doc.internal.pages.length - 1;
    const pageSize = doc.internal.pageSize;
    const width = pageSize.getWidth();
    const footerY = pageSize.getHeight() - 10;

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, 'normal');
    doc.text('© 2025 Sistema de Eventos UTA - FISEI', 15, footerY);
    doc.text(
      `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
      width - 30,
      footerY,
      { align: 'right' }
    );
  };

  const generatePDF = () => {
    if (!data || data.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Add header
    addPdfHeader(doc);

    // Reset text color for table
    doc.setTextColor(0, 0, 0);

    if (reportType === 'inscripciones') {
      autoTable(doc, {
        startY: 100,
        head: [['Estudiante', 'Cédula', 'Correo', 'Evento', 'Estado', 'Nota', 'Asistencia', 'Fecha']],
        body: data.map((row) => [
          `${row.APELLIDOS} ${row.NOMBRES}`,
          row.CEDULA || '-',
          row.CORREO || '-',
          row.eventoTitulo,
          row.CODIGOESTADOINSCRIPCION,
          row.NOTA ?? '-',
          row.ASISTENCIA ? `${row.ASISTENCIA}%` : '-',
          formatDate(row.FECHAINSCRIPCION)
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        margin: { top: 100, right: 15, bottom: 20, left: 15 }
      });
    } else if (reportType === 'pagos') {
      autoTable(doc, {
        startY: 100,
        head: [['Evento', 'Estudiante', 'Estado', 'Forma de Pago', 'Monto', 'Fecha']],
        body: data.map((row) => [
          row.eventoTitulo,
          `${row.APELLIDOS} ${row.NOMBRES}`,
          row.estadoPagoNombre || row.CODIGOESTADOPAGO,
          row.formaPagoNombre || row.CODIGOFORMADEPAGO,
          `$${Number(row.MONTO || 0).toFixed(2)}`,
          formatDate(row.FECHA_PAGO)
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { top: 100, right: 15, bottom: 20, left: 15 },
        columnStyles: {
          4: { halign: 'right' }
        }
      });
    } else {
      autoTable(doc, {
        startY: 100,
        head: [['Evento', 'Estudiante', 'Nota', 'Asistencia', 'Estado']],
        body: data.map((row) => [
          row.eventoTitulo,
          `${row.APELLIDOS} ${row.NOMBRES}`,
          row.NOTA ?? '-',
          row.ASISTENCIA ? `${row.ASISTENCIA}%` : '-',
          row.CODIGOESTADOINSCRIPCION
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [56, 189, 248],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 249, 255] },
        margin: { top: 100, right: 15, bottom: 20, left: 15 }
      });
    }

    // Add footer to all pages
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPdfFooter(doc);
    }

    doc.save(`${reportType}_report_${Date.now()}.pdf`);
  };

  const renderTable = () => {
    if (loading) return <div className="report-card">Cargando datos...</div>;
    if (error) return <div className="report-card error">{error}</div>;
    if (!data || data.length === 0) return <div className="report-card">Sin datos para los filtros seleccionados.</div>;

    if (reportType === 'pagos') {
      return (
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Estudiante</th>
                <th>Estado</th>
                <th>Forma de Pago</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={`${row.pagoId}-${row.inscripcionId}`}>
                  <td>{row.eventoTitulo}</td>
                  <td>{`${row.APELLIDOS} ${row.NOMBRES}`}</td>
                  <td><span className={`estado-badge estado-${(row.CODIGOESTADOPAGO || '').toLowerCase()}`}>{row.estadoPagoNombre || row.CODIGOESTADOPAGO}</span></td>
                  <td>{row.formaPagoNombre || row.CODIGOFORMADEPAGO}</td>
                  <td>${Number(row.MONTO || 0).toFixed(2)}</td>
                  <td>{formatDate(row.FECHA_PAGO)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const showAsistencia = reportType !== 'inscripciones' ? true : true;
    return (
      <div className="table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Estudiante</th>
              <th>Estado</th>
              <th>Nota</th>
              {showAsistencia && <th>Asistencia</th>}
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.inscripcionId}-${row.usuarioId}`}>
                <td>{row.eventoTitulo}</td>
                <td>{`${row.APELLIDOS} ${row.NOMBRES}`}</td>
                <td><span className={`estado-badge estado-${(row.CODIGOESTADOINSCRIPCION || '').toLowerCase()}`}>{row.CODIGOESTADOINSCRIPCION}</span></td>
                <td>{row.NOTA ?? '-'}</td>
                {showAsistencia && <td>{row.ASISTENCIA ? `${row.ASISTENCIA}%` : '-'}</td>}
                <td>{formatDate(row.FECHAINSCRIPCION)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <main className="main-content1">
        <div className="content-area">
          <div className="reportes-header">
            <div>
              <p className="eyebrow">Reportes administrativos</p>
              <h1>{headerTitulo}</h1>
              <p className="subtitle">Exporta listados a PDF con filtros por evento, estado y rango de fechas.</p>
            </div>
            <div className="report-actions">
              <button className="btn-secondary" onClick={runReport}>
                <FaSync /> Actualizar
              </button>
              <button className="btn-primary" onClick={generatePDF} disabled={!data.length}>
                <FaFilePdf /> Exportar PDF
              </button>
            </div>
          </div>

          <div className="reportes-panel">
            <div className="report-selector">
              {['inscripciones', 'pagos', 'asistencias', 'completacion', 'ingresos'].map((id) => (
                <button
                  key={id}
                  className={reportType === id ? 'selector active' : 'selector'}
                  onClick={() => setReportType(id)}
                >
                  <FaChartBar /> {headerTituloFor(id)}
                </button>
              ))}
            </div>

            <div className="filters-card">
              <div className="filter-row">
                <label>Evento</label>
                <select
                  value={filtros.eventoId}
                  onChange={(e) => setFiltros((s) => ({ ...s, eventoId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {eventos.map((ev) => (
                    <option key={ev.SECUENCIAL || ev.id} value={ev.SECUENCIAL || ev.id}>
                      {ev.TITULO || ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-row">
                <label>Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros((s) => ({ ...s, estado: e.target.value }))}
                >
                  {estadosDisponibles.map((op) => (
                    <option key={op.value || 'all'} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-row">
                <label>Desde</label>
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros((s) => ({ ...s, desde: e.target.value }))}
                />
              </div>
              <div className="filter-row">
                <label>Hasta</label>
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros((s) => ({ ...s, hasta: e.target.value }))}
                />
              </div>
              <div className="filter-row actions">
                <button className="btn-filter" onClick={runReport}>
                  <FaFilter /> Aplicar filtros
                </button>
              </div>
            </div>

            {renderResumen()}
            {renderTable()}
          </div>
        </div>
      </main>
    </div>
  );
};

const headerTituloFor = (id) => ({
  inscripciones: 'Inscripciones',
  pagos: 'Pagos',
  asistencias: 'Asistencias'
}[id] || 'Reporte');

export default ReportesAdmin;
