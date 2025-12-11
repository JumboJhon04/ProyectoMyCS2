const { pool } = require('../config/database');
const { buildImageUrl } = require('../utils/imageUrlHelper');

const buildDateFilters = (from, to, column, filters, params) => {
  if (from) {
    filters.push(`DATE(${column}) >= ?`);
    params.push(from);
  }
  if (to) {
    filters.push(`DATE(${column}) <= ?`);
    params.push(to);
  }
};

const reporteInscripciones = async (req, res) => {
  const { eventoId, estado, desde, hasta } = req.query;
  const filters = [];
  const params = [];

  if (eventoId) {
    filters.push('i.SECUENCIALEVENTO = ?');
    params.push(eventoId);
  }

  if (estado) {
    filters.push('i.CODIGOESTADOINSCRIPCION = ?');
    params.push(estado);
  }

  buildDateFilters(desde, hasta, 'i.FECHAINSCRIPCION', filters, params);

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const [rows] = await pool.execute(
      `SELECT
        i.SECUENCIAL AS inscripcionId,
        i.SECUENCIALEVENTO AS eventoId,
        e.TITULO AS eventoTitulo,
        e.CODIGOTIPOEVENTO,
        e.ESTADO AS estadoEvento,
        e.NOTAAPROBACION,
        e.ASISTENCIAMINIMA,
        i.SECUENCIALUSUARIO AS usuarioId,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA,
        u.CORREO,
        i.NOTA,
        i.ASISTENCIA,
        i.CODIGOESTADOINSCRIPCION,
        i.FECHAINSCRIPCION
      FROM inscripcion i
      INNER JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      INNER JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
      ${where}
      ORDER BY i.FECHAINSCRIPCION DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Error al generar reporte de inscripciones:', error);
    res.status(500).json({ error: 'Error al generar reporte de inscripciones' });
  }
};

const reportePagos = async (req, res) => {
  const { eventoId, estado, desde, hasta } = req.query;
  const filters = [];
  const params = [];

  if (eventoId) {
    filters.push('i.SECUENCIALEVENTO = ?');
    params.push(eventoId);
  }

  if (estado) {
    filters.push('p.CODIGOESTADOPAGO = ?');
    params.push(estado);
  }

  buildDateFilters(desde, hasta, 'p.FECHA_PAGO', filters, params);

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const [rows] = await pool.execute(
      `SELECT
        p.SECUENCIAL AS pagoId,
        p.SECUENCIALINSCRIPCION AS inscripcionId,
        p.CODIGOFORMADEPAGO,
        fp.NOMBRE AS formaPagoNombre,
        p.COMPROBANTE_URL,
        p.CODIGOESTADOPAGO,
        ep.NOMBRE AS estadoPagoNombre,
        p.MONTO,
        p.FECHA_PAGO,
        p.FECHA_APROBACION,
        i.SECUENCIALUSUARIO AS usuarioId,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        u.CEDULA,
        i.SECUENCIALEVENTO AS eventoId,
        e.TITULO AS eventoTitulo,
        e.CODIGOTIPOEVENTO,
        i.CODIGOESTADOINSCRIPCION
      FROM pago p
      INNER JOIN inscripcion i ON p.SECUENCIALINSCRIPCION = i.SECUENCIAL
      INNER JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      INNER JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
      LEFT JOIN forma_pago fp ON p.CODIGOFORMADEPAGO = fp.CODIGO
      LEFT JOIN estado_pago ep ON p.CODIGOESTADOPAGO = ep.CODIGO
      ${where}
      ORDER BY p.FECHA_PAGO DESC`,
      params
    );

    const data = rows.map((pago) => ({
      ...pago,
      COMPROBANTE_URL: buildImageUrl(pago.COMPROBANTE_URL, req)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al generar reporte de pagos:', error);
    res.status(500).json({ error: 'Error al generar reporte de pagos' });
  }
};

const reporteAsistencias = async (req, res) => {
  const { eventoId, estado, desde, hasta } = req.query;
  const filters = [];
  const params = [];

  if (eventoId) {
    filters.push('i.SECUENCIALEVENTO = ?');
    params.push(eventoId);
  }

  if (estado) {
    filters.push('i.CODIGOESTADOINSCRIPCION = ?');
    params.push(estado);
  }

  buildDateFilters(desde, hasta, 'i.FECHAINSCRIPCION', filters, params);

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const [rows] = await pool.execute(
      `SELECT
        i.SECUENCIAL AS inscripcionId,
        i.SECUENCIALEVENTO AS eventoId,
        e.TITULO AS eventoTitulo,
        e.HORAS,
        e.NOTAAPROBACION,
        e.ASISTENCIAMINIMA,
        i.SECUENCIALUSUARIO AS usuarioId,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        i.NOTA,
        i.ASISTENCIA,
        i.CODIGOESTADOINSCRIPCION,
        i.FECHAINSCRIPCION
      FROM inscripcion i
      INNER JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      INNER JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
      ${where}
      ORDER BY e.TITULO ASC, u.APELLIDOS ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Error al generar reporte de asistencias:', error);
    res.status(500).json({ error: 'Error al generar reporte de asistencias' });
  }
};

const detalleCertificado = async (req, res) => {
  const { eventoId, estudianteId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT
        e.SECUENCIAL AS eventoId,
        e.TITULO,
        e.HORAS,
        e.NOTAAPROBACION,
        e.ASISTENCIAMINIMA,
        e.FECHAFIN,
        e.FECHAINICIO,
        e.ESTADO AS estadoEvento,
        e.Docente,
        doc.NOMBRES AS docenteNombres,
        doc.APELLIDOS AS docenteApellidos,
        i.SECUENCIAL AS inscripcionId,
        i.NOTA,
        i.ASISTENCIA,
        i.CODIGOESTADOINSCRIPCION,
        i.FECHAINSCRIPCION,
        u.SECUENCIAL AS usuarioId,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA
      FROM inscripcion i
      INNER JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
      INNER JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      LEFT JOIN usuario doc ON e.Docente = doc.SECUENCIAL
      WHERE i.SECUENCIALEVENTO = ? AND i.SECUENCIALUSUARIO = ?
      LIMIT 1`,
      [eventoId, estudianteId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada para este evento' });
    }

    const registro = rows[0];
    const notaMinima = Number(registro.NOTAAPROBACION || 0);
    const asistenciaMinima = Number(registro.ASISTENCIAMINIMA || 0);
    const nota = Number(registro.NOTA || 0);
    const asistencia = Number(registro.ASISTENCIA || 0);

    const cumpleNota = nota >= notaMinima;
    const cumpleAsistencia = asistencia >= asistenciaMinima;
    const eventoFinalizado = registro.estadoEvento === 'FINALIZADO';

    const eligible = cumpleNota && cumpleAsistencia && eventoFinalizado;

    res.json({
      success: true,
      data: {
        ...registro,
        docenteNombreCompleto: registro.docenteNombres || registro.docenteApellidos
          ? `${registro.docenteNombres || ''} ${registro.docenteApellidos || ''}`.trim()
          : null,
        elegible: eligible,
        razones: {
          nota: cumpleNota,
          asistencia: cumpleAsistencia,
          cursoFinalizado: eventoFinalizado
        }
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener datos de certificado:', error);
    res.status(500).json({ error: 'Error al obtener datos de certificado' });
  }
};

module.exports = {
  reporteInscripciones,
  reportePagos,
  reporteAsistencias,
  detalleCertificado
};
