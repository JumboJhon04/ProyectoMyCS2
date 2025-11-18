import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PayPalButton = ({ amount, onSuccess, onError, currency = 'USD' }) => {
  // Usar credenciales de sandbox para desarrollo
  // En producción, estas deben estar en variables de entorno
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
  
  const initialOptions = {
    "client-id": clientId || "test",
    currency: currency,
    intent: "capture",
  };

  const createOrder = (data, actions) => {
    try {
      // Validar que el monto sea válido
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      return actions.order.create({
        purchase_units: [
          {
            amount: {
              value: amountValue.toFixed(2), // Asegurar 2 decimales
              currency_code: currency,
            },
          },
        ],
      });
    } catch (error) {
      console.error('❌ Error al crear orden de PayPal:', error);
      if (onError) {
        onError(error);
      }
      throw error; // Re-lanzar para que PayPal lo maneje
    }
  };

  const onApprove = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      console.log('✅ Pago de PayPal aprobado:', order);
      
      if (onSuccess) {
        onSuccess(order);
      }
    } catch (error) {
      console.error('❌ Error al procesar pago de PayPal:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const onCancel = (data) => {
    console.log('Pago cancelado por el usuario');
  };

  const onErrorPayPal = (err) => {
    console.error('Error de PayPal:', err);
    if (onError) {
      onError(err);
    }
  };

  // Si no hay client-id configurado, mostrar mensaje con instrucciones
  if (!clientId || 
      clientId === 'test' || 
      clientId === 'YOUR_PAYPAL_CLIENT_ID') {
    return (
      <div style={{ 
        padding: '1.5rem', 
        background: '#fef3c7', 
        border: '1px solid #fcd34d', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#92400e', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
          ⚠️ PayPal no está configurado
        </p>
        <p style={{ color: '#92400e', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
          Para usar PayPal, configura tu Client ID en el archivo <code style={{ background: '#fde68a', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>.env</code>
        </p>
        <div style={{ fontSize: '0.85rem', color: '#78350f', textAlign: 'left', background: '#fef3c7', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Pasos:</p>
          <ol style={{ margin: '0', paddingLeft: '1.25rem' }}>
            <li>Ve a <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#92400e', textDecoration: 'underline' }}>PayPal Developer Dashboard</a></li>
            <li>Crea una aplicación o usa una existente</li>
            <li>Copia el <strong>Client ID</strong> (Sandbox para desarrollo)</li>
            <li>Agrega en <code>.env</code>: <code style={{ background: '#fde68a', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>REACT_APP_PAYPAL_CLIENT_ID=tu_client_id</code></li>
            <li>Reinicia el servidor de desarrollo</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onErrorPayPal}
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal"
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;

