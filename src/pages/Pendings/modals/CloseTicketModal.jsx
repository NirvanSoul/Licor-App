import React, { useState } from 'react';
import { X, CheckCircle, Hash, AlertCircle } from 'lucide-react';

export default function CloseTicketModal({ order, totalUsd, totalBs, currentRate, mainCurrency, onClose, onConfirm }) {
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentReference, setPaymentReference] = useState('');
    const paymentMethods = ['Efectivo', 'Pago Móvil', 'Punto', 'Bio Pago'];

    // LOGIC UPDATE: 
    // "Carta Abierta" (Open Tab) = Contains items with emission 'Libre'.
    // "Ticket" (Prepaid) = All items are standard (Bottle/Box), no 'Libre'.
    // User requested that Tickets (Prepaid) should NOT ask for payment again.

    const isCartaAbierta = order.items && order.items.some(i => i.emission === 'Libre');

    // If it is NOT Carta Abierta, we assume it is a Ticket (Prepaid), regardless of whether paymentMethod is explicitly set in DB (handling legacy/migrated data).
    const showPaymentSelection = isCartaAbierta;

    // Helper for display
    const existingMethod = order.paymentMethod || 'Efectivo (Asumido)';

    const handleConfirm = () => {
        // If showing payment selection (Carta Abierta), use selected method.
        // If Ticket (Hidden selection), use existing method or default to Efectivo if missing.
        const finalMethod = showPaymentSelection ? (paymentMethod || null) : existingMethod;
        const finalRef = showPaymentSelection ? paymentReference : (order.reference || '');

        // Guard for Carta Abierta
        if (showPaymentSelection && !paymentMethod) return;
        if (showPaymentSelection && paymentMethod === 'Pago Móvil' && !paymentReference.trim()) return;

        onConfirm(finalMethod, finalRef);
    };

    if (!showPaymentSelection) {
        return (
            <div className="pending-modal-overlay" onClick={onClose}>
                <div className="pending-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                    <div className="pending-modal-header">
                        <div>
                            <h3 className="pending-modal-title" style={{ textAlign: 'left', width: 'auto' }}>Confirmar Entrega</h3>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                            <div style={{
                                background: 'rgba(249, 115, 22, 0.1)',
                                width: '64px', height: '64px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <CheckCircle size={32} style={{ color: '#F97316' }} />
                            </div>
                        </div>
                        <p className="pending-modal-subtitle" style={{ fontSize: '0.95rem' }}>
                            El cliente <b>{order.customerName}</b> retira su pedido.
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Método Registrado: <b style={{ color: 'var(--accent-color)' }}>{existingMethod.replace('Pre-Pagado - ', '')}</b>
                            </div>
                        </p>
                    </div>

                    <div className="actions-row">
                        <button
                            className="action-btn"
                            style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', padding: '0.75rem', justifyContent: 'center' }}
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                        <button
                            className="action-btn close-ticket-btn"
                            style={{
                                padding: '0.75rem', justifyContent: 'center',
                                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: 'white',
                            }}
                            onClick={handleConfirm}
                        >
                            Confirmar Entrega
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // OPEN TAB CLOSING (Require Payment)
    return (
        <div className="pending-modal-overlay" onClick={onClose}>
            <div className="pending-modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                <div className="pending-modal-header">
                    <div>
                        <h3 className="pending-modal-title" style={{ textAlign: 'left', width: 'auto' }}>Cerrar Ticket y Cobrar</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--accent-light)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total a cobrar ({order.customerName})</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                        ${totalUsd.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-color)', marginTop: '0.5rem' }}>
                        {totalBs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        {mainCurrency === 'USD' ? 'Tasa Dólar BCV' : (mainCurrency === 'EUR' ? 'Tasa Euro BCV' : 'Tasa Personalizada')}: {currentRate} Bs/$
                    </p>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Selecciona Método de Pago</h4>
                <div className="payment-methods-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {paymentMethods.map(method => (
                        <button
                            key={method}
                            className={`option-btn ${paymentMethod === method ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod(method)}
                            style={{ padding: '0.75rem', fontSize: '0.85rem' }}
                        >
                            {method}
                        </button>
                    ))}
                </div>

                {paymentMethod === 'Pago Móvil' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Hash size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Referencia"
                                value={paymentReference}
                                onChange={(e) => { if (/^\d*$/.test(e.target.value)) setPaymentReference(e.target.value); }}
                                inputMode="numeric"
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--accent-light)',
                                    background: 'var(--bg-app)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                )}

                {!paymentMethod && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#F59E0B', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        <AlertCircle size={18} />
                        <span>Selecciona un método para poder cobrar</span>
                    </div>
                )}

                <div className="actions-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                        className="action-btn"
                        style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="action-btn close-ticket-btn"
                        disabled={!paymentMethod || (paymentMethod === 'Pago Móvil' && !paymentReference.trim())}
                        style={{
                            opacity: (!paymentMethod || (paymentMethod === 'Pago Móvil' && !paymentReference.trim())) ? 0.5 : 1,
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            color: 'white'
                        }}
                        onClick={handleConfirm}
                    >
                        Cobrar y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
