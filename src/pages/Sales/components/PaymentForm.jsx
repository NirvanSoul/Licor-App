/**
 * PaymentForm Component
 * Form for collecting payment and customer information
 */

import React from 'react';
import { User, Hash, AlertCircle } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants/salesConstants';

export default function PaymentForm({
    ticketNumber,
    ticketDate,
    customerName,
    onCustomerNameChange,
    paymentMethod,
    onPaymentMethodChange,
    paymentReference,
    onPaymentReferenceChange,
    hasLocalItems
}) {
    return (
        <div className="ticket-details-form">
            <div className="ticket-info-row">
                <span className="ticket-hash-display"># {ticketNumber}</span>
                <span className="ticket-date">{ticketDate}</span>
            </div>

            {hasLocalItems && (
                <div className="input-group-large" style={{ marginBottom: '1rem' }}>
                    <User size={36} strokeWidth={2.5} className="input-icon-external" />
                    <input
                        type="text"
                        placeholder="Nombre del Cliente (Opcional)"
                        className="ticket-input-large"
                        value={customerName}
                        onChange={(e) => onCustomerNameChange(e.target.value)}
                        autoFocus
                    />
                </div>
            )}

            <h4 className="payment-section-title">Método de Pago</h4>

            <div className="payment-methods-grid">
                {PAYMENT_METHODS.map(method => (
                    <button
                        key={method}
                        className={`option-btn ${paymentMethod === method ? 'selected' : ''}`}
                        onClick={() => onPaymentMethodChange(method)}
                        style={{ fontSize: '0.8rem', padding: '0.75rem 0.25rem' }}
                    >
                        {method}
                    </button>
                ))}
            </div>

            {paymentMethod === 'Pago Móvil' && (
                <div className="input-group-large">
                    <Hash size={36} strokeWidth={2.5} className="input-icon-external" />
                    <input
                        type="text"
                        placeholder="Referencia"
                        className="ticket-input-large"
                        value={paymentReference}
                        onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                                onPaymentReferenceChange(e.target.value);
                            }
                        }}
                        inputMode="numeric"
                    />
                </div>
            )}

            {!paymentMethod && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '1rem'
                }}>
                    <AlertCircle size={18} />
                    <span>Selecciona un método de pago para continuar.</span>
                </div>
            )}
        </div>
    );
}
