const nodemailer = require('nodemailer');

console.log('📧 Cargando módulo emailService...');

// Configuración SMTP para Gmail
// IMPORTANTE: Gmail requiere usar una "Contraseña de aplicación" (App Password)
// No uses tu contraseña normal de Gmail
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: 'shinjilouch@gmail.com',
    pass: 'qduebmckggosncnt' // Debe ser una Contraseña de aplicación, no la contraseña normal
  },
  tls: {
    // No rechazar conexiones no autorizadas
    rejectUnauthorized: false
  }
};

console.log('📧 Configuración SMTP creada');

// Crear transporter
const transporter = nodemailer.createTransport(smtpConfig);

console.log('📧 Transporter creado, verificando conexión...');

// Verificar conexión al inicializar (con mejor manejo de errores)
transporter.verify(function (error, success) {
  console.log('📧 Verificación de transporter ejecutada');
  if (error) {
    console.log('❌ Error en configuración de email:', error.message);
    console.log('❌ Código de error:', error.code);
    console.log('❌ Comando:', error.command);
    if (error.response) {
      console.log('❌ Respuesta del servidor:', error.response);
    }
    console.log('\n⚠️ IMPORTANTE: Para Gmail necesitas usar una "Contraseña de aplicación"');
    console.log('📝 Pasos para generar una contraseña de aplicación:');
    console.log('   1. Ve a tu cuenta de Google → Seguridad');
    console.log('   2. Activa la verificación en 2 pasos (si no está activada)');
    console.log('   3. Busca "Contraseñas de aplicaciones"');
    console.log('   4. Genera una nueva contraseña para "Correo"');
    console.log('   5. Usa esa contraseña de 16 caracteres en lugar de tu contraseña normal\n');
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

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
    
    const mailOptions = {
      from: '"Sistema de Eventos UTA" <wson1478963@gmail.com>',
      to: destinatario,
      subject: '✅ Pago Aprobado - Inscripción Confirmada',
      html: `
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
      text: `
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
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', info.messageId);
    console.log('✅ Respuesta del servidor:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    console.error('❌ Código de error:', error.code);
    console.error('❌ Comando:', error.command);
    
    if (error.response) {
      console.error('❌ Respuesta del servidor:', error.response);
    }
    
    if (error.responseCode) {
      console.error('❌ Código de respuesta:', error.responseCode);
    }
    
    // Errores comunes de Gmail
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n⚠️ ERROR DE AUTENTICACIÓN:');
      console.error('   La contraseña es incorrecta o no es una "Contraseña de aplicación"');
      console.error('   Gmail ya no permite usar contraseñas normales');
      console.error('   Debes generar una "Contraseña de aplicación" desde tu cuenta de Google\n');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️ ERROR DE CONEXIÓN:');
      console.error('   No se pudo conectar al servidor SMTP de Gmail');
      console.error('   Verifica tu conexión a internet\n');
    } else if (error.responseCode === 550 || error.responseCode === 553) {
      console.error('\n⚠️ ERROR: Dirección de correo inválida o rechazada');
    }
    
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      responseCode: error.responseCode,
      details: error 
    };
  }
};

console.log('📧 Módulo emailService exportado correctamente');

module.exports = {
  enviarEmailPagoAprobado
};

