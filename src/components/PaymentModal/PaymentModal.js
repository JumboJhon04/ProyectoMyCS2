import React, { useState, useEffect } from 'react';

import API_URL from '../../config/api';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, inscripcionId, monto, onPaymentSuccess }) => {
  const [formasPago, setFormasPago] = useState([]);
  const [selectedFormaPago, setSelectedFormaPago] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [montoInput, setMontoInput] = useState(monto || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFormasPago();
      setMontoInput(monto || '');
    }
  }, [isOpen, monto]);

  const fetchFormasPago = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pagos/formas-pago`);
      const data = await response.json();
      if (data.success) {
        setFormasPago(data.data);
        if (data.data.length > 0) {
          setSelectedFormaPago(data.data[0].CODIGO);
        }
      }
    } catch (err) {
      console.error('Error al cargar formas de pago:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setComprobante(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedFormaPago) {
      setError('Debes seleccionar un método de pago');
      setLoading(false);
      return;
    }

    if (!montoInput || parseFloat(montoInput) <= 0) {
      setError('El monto debe ser mayor a 0');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('inscripcionId', inscripcionId);
      formData.append('formaPago', selectedFormaPago);
      formData.append('monto', montoInput);
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await fetch(`${API_URL}/api/pagos`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el pago');
      }

      alert('Pago registrado correctamente. Está pendiente de aprobación.');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Registrar Pago</h2>
          <button className="payment-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="payment-modal-form">
          <div className="payment-form-group">
            <label>Método de Pago *</label>
            <select
              value={selectedFormaPago}
              onChange={(e) => setSelectedFormaPago(e.target.value)}
              required
            >
              <option value="">Selecciona un método</option>
              {formasPago.map((fp) => (
                <option key={fp.CODIGO} value={fp.CODIGO}>
                  {fp.NOMBRE}
                </option>
              ))}
            </select>
          </div>

          <div className="payment-form-group">
            <label>Monto *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={montoInput}
              onChange={(e) => setMontoInput(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="payment-form-group">
            <label>Comprobante de Pago</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
            />
            <small>Formatos permitidos: PDF, JPG, PNG, GIF, WEBP (máx. 10MB)</small>
            {comprobante && (
              <div className="file-selected">
                📄 {comprobante.name}
              </div>
            )}
          </div>

          {error && (
            <div className="payment-error">
              {error}
            </div>
          )}

          <div className="payment-modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;

