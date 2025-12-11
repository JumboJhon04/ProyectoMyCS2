const SibApiV3Sdk = require('sib-api-v3-sdk');

console.log('📧 Cargando módulo emailService (Brevo)...');

const brevoClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = brevoClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

if (!process.env.BREVO_API_KEY) {
  console.warn('⚠️ BREVO_API_KEY no está configurada. Configúrala en las variables de entorno.');
}

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const getSender = () => {
  const email = (process.env.EMAIL_FROM || 'no-reply@eventos-uta.test').trim();
  if (!email) {
    throw new Error('EMAIL_FROM no está configurado. Define un remitente en el entorno.');
  }
  return { email, name: 'Sistema de Eventos UTA' };
};

const buildPayload = (destinatario, nombreUsuario, subject, htmlContent, textContent) => {
  const sender = getSender();
  const payload = {
    sender,
    to: [{ email: destinatario, name: nombreUsuario || destinatario }],
    subject,
    htmlContent,
    textContent
  };
  console.log('📧 Payload Brevo:', { sender: payload.sender, to: payload.to, subject: payload.subject });
  return payload;
};

const logBrevoError = (error, context) => {
  console.error(`❌ Error al enviar email (${context}):`, error.message || error);
  if (error.response && error.response.text) {
    console.error('❌ Respuesta de Brevo:', error.response.text);
  } else if (error.response && error.response.body) {
    console.error('❌ Respuesta de Brevo:', JSON.stringify(error.response.body));
  }
};

/**
 * Enviar email de notificación de pago aprobado
 * @param {string} destinatario - Correo del destinatario
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {string} tituloEvento - Título del evento
 * @param {number} monto - Monto del pago
 */
const enviarEmailPagoAprobado = async (destinatario, nombreUsuario, tituloEvento, monto) => {
  try {
    console.log('📧 Intentando enviar email a:', destinatario);
    console.log('📧 Datos:', { nombreUsuario, tituloEvento, monto });
    
    const payload = buildPayload(
      destinatario,
      nombreUsuario,
      '✅ Pago Aprobado - Inscripción Confirmada',
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .info-item {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-item:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280;
              display: inline-block;
              width: 150px;
            }
            .info-value {
              color: #1f2937;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0;">Pago Aprobado</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu inscripción ha sido confirmada</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${nombreUsuario}</strong>,</p>
            
            <p>Nos complace informarte que tu pago ha sido <strong style="color: #10b981;">aprobado exitosamente</strong>.</p>
            
            <div class="info-box">
              <div class="info-item">
                <span class="info-label">Evento:</span>
                <span class="info-value">${tituloEvento}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Monto pagado:</span>
                <span class="info-value">$${parseFloat(monto).toFixed(2)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="info-value" style="color: #10b981; font-weight: bold;">Aprobado</span>
              </div>
            </div>
            
            <p>Tu inscripción al evento ha sido confirmada. Te esperamos en el evento.</p>
            
            <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
            
            <div style="text-align: center;">
              <a href="#" class="button">Ver Detalles</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p>© ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI</p>
          </div>
        </body>
        </html>
      `,
      `
        Pago Aprobado - Inscripción Confirmada
        
        Estimado/a ${nombreUsuario},
        
        Nos complace informarte que tu pago ha sido aprobado exitosamente.
        
        Detalles del pago:
        - Evento: ${tituloEvento}
        - Monto pagado: $${parseFloat(monto).toFixed(2)}
        - Estado: Aprobado
        
        Tu inscripción al evento ha sido confirmada. Te esperamos en el evento.
        
        Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.
        
        Este es un mensaje automático, por favor no respondas a este correo.
        © ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI
      `
    );

    const info = await transactionalEmailApi.sendTransacEmail(payload);
    console.log('✅ Email enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logBrevoError(error, 'pago aprobado');
    return {
      success: false,
      error: error.message,
      details: error.response && error.response.body ? error.response.body : error
    };
  }
};
/**
 * Enviar email de notificación de cambio de estado de solicitud
 * @param {string} destinatario - Correo del destinatario
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {string} estado - Nuevo estado (Aprobado, Rechazado)
 * @param {string} mensaje - Mensaje personalizado del admin
 * @param {number} solicitudId - ID de la solicitud
 */
const enviarEmailSolicitud = async (destinatario, nombreUsuario, estado, mensaje, solicitudId) => {
  try {
    console.log('📧 Intentando enviar email de solicitud a:', destinatario);
    
    const estadoTexto = estado === 'Aprobado' ? 'Aprobada' : estado === 'Rechazado' ? 'Rechazada' : estado;
    const colorEstado = estado === 'Aprobado' ? '#10b981' : estado === 'Rechazado' ? '#ef4444' : '#667eea';
    const iconoEstado = estado === 'Aprobado' ? '✅' : estado === 'Rechazado' ? '❌' : '📋';
    
    const payload = buildPayload(
      destinatario,
      nombreUsuario,
      `${iconoEstado} Solicitud de Soporte ${estadoTexto} - #${solicitudId}`,
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${colorEstado} 0%, ${colorEstado}dd 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .status-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid ${colorEstado};
            }
            .message-box {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              border-left: 3px solid ${colorEstado};
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="status-icon">${iconoEstado}</div>
            <h1 style="margin: 0;">Solicitud ${estadoTexto}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ID: #${solicitudId}</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${nombreUsuario}</strong>,</p>
            
            <p>Te informamos que tu solicitud de soporte ha sido <strong style="color: ${colorEstado};">${estadoTexto.toLowerCase()}</strong>.</p>
            
            <div class="info-box">
              <p><strong>Estado:</strong> <span style="color: ${colorEstado}; font-weight: bold;">${estadoTexto}</span></p>
              <p><strong>ID de Solicitud:</strong> #${solicitudId}</p>
            </div>
            
            ${mensaje ? `
            <div class="message-box">
              <p><strong>Mensaje del administrador:</strong></p>
              <p>${mensaje}</p>
            </div>
            ` : ''}
            
            <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p>© ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI</p>
          </div>
        </body>
        </html>
      `,
      `
        Solicitud de Soporte ${estadoTexto} - #${solicitudId}
        
        Estimado/a ${nombreUsuario},
        
        Te informamos que tu solicitud de soporte ha sido ${estadoTexto.toLowerCase()}.
        
        Estado: ${estadoTexto}
        ID de Solicitud: #${solicitudId}
        
        ${mensaje ? `Mensaje del administrador:\n${mensaje}\n` : ''}
        
        Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.
        
        Este es un mensaje automático, por favor no respondas a este correo.
        © ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI
      `
    );

    const info = await transactionalEmailApi.sendTransacEmail(payload);
    console.log('✅ Email de solicitud enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logBrevoError(error, 'solicitud');
    return {
      success: false,
      error: error.message,
      details: error.response && error.response.body ? error.response.body : error
    };
  }
};

/**
 * Enviar certificado de aprobación al estudiante
 * @param {string} destinatario - Correo del destinatario
 * @param {string} nombreUsuario - Nombre del estudiante
 * @param {string} tituloEvento - Título del evento
 * @param {number} horas - Horas del evento
 * @param {string} fechaFinalizacion - Fecha de finalización
 * @param {string} docente - Nombre del docente
 */
const enviarEmailCertificado = async (destinatario, nombreUsuario, tituloEvento, horas, fechaFinalizacion, docente) => {
  try {
    console.log('📧 Enviando certificado a:', destinatario);
    
    const fechaFormato = new Date(fechaFinalizacion).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const payload = buildPayload(
      destinatario,
      nombreUsuario,
      '🎓 Tu Certificado de Aprobación - ' + tituloEvento,
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .cert-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .cert-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 2px solid #667eea;
              text-align: center;
            }
            .cert-title {
              font-size: 14px;
              color: #667eea;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .cert-info {
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .cert-info:last-child {
              border-bottom: none;
            }
            .cert-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .cert-value {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              margin-top: 5px;
            }
            .highlight {
              color: #667eea;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="cert-icon">🎓</div>
            <h1 style="margin: 0;">¡Felicitaciones!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Has completado exitosamente el evento</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${nombreUsuario}</strong>,</p>
            
            <p>Nos complace informarte que has <span class="highlight">completado exitosamente</span> el evento y eres acreedor a tu certificado de aprobación.</p>
            
            <div class="cert-box">
              <div class="cert-title">Certificado de Aprobación</div>
              
              <div class="cert-info">
                <div class="cert-label">Evento</div>
                <div class="cert-value">${tituloEvento}</div>
              </div>
              
              <div class="cert-info">
                <div class="cert-label">Horas Académicas</div>
                <div class="cert-value">${horas} horas</div>
              </div>
              
              <div class="cert-info">
                <div class="cert-label">Docente</div>
                <div class="cert-value">${docente || 'Docente asignado'}</div>
              </div>
              
              <div class="cert-info">
                <div class="cert-label">Fecha de Finalización</div>
                <div class="cert-value">${fechaFormato}</div>
              </div>
            </div>
            
            <p>Tu certificado está disponible en tu plataforma. Puedes descargarlo en cualquier momento desde tu panel de estudiante en la sección "Mis Cursos".</p>
            
            <p style="text-align: center;">
              <a href="#" class="button">Ver Mi Certificado</a>
            </p>
            
            <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p>© ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI</p>
          </div>
        </body>
        </html>
      `,
      `
        ¡Felicitaciones! Has Completado el Evento
        
        Estimado/a ${nombreUsuario},
        
        Nos complace informarte que has completado exitosamente el evento y eres acreedor a tu certificado de aprobación.
        
        --- CERTIFICADO DE APROBACIÓN ---
        
        Evento: ${tituloEvento}
        Horas Académicas: ${horas} horas
        Docente: ${docente || 'Docente asignado'}
        Fecha de Finalización: ${fechaFormato}
        
        Tu certificado está disponible en tu plataforma. Puedes descargarlo en cualquier momento desde tu panel de estudiante.
        
        Si tienes alguna pregunta, no dudes en contactarnos.
        
        Este es un mensaje automático, por favor no respondas a este correo.
        © ${new Date().getFullYear()} Sistema de Eventos UTA - FISEI
      `
    );

    const info = await transactionalEmailApi.sendTransacEmail(payload);
    console.log('✅ Certificado enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logBrevoError(error, 'certificado');
    return {
      success: false,
      error: error.message,
      details: error.response && error.response.body ? error.response.body : error
    };
  }
};

console.log('📧 Módulo emailService (Brevo) exportado correctamente');

module.exports = {
  enviarEmailPagoAprobado,
  enviarEmailSolicitud,
  enviarEmailCertificado
};
