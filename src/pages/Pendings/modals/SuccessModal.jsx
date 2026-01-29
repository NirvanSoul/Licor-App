import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuccessModal({ closedOrderInfo, onClose }) {
    if (!closedOrderInfo) return null;

    return (
        <div className="pending-modal-overlay">
            <div className="pending-modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(52, 199, 89, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CheckCircle size={48} color="#34c759" />
                    </div>
                </div>
                <h3 className="pending-modal-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ticket Cerrado</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    El ticket <b>#{closedOrderInfo.ticketNumber}</b> de <b>{closedOrderInfo.customerName}</b> ha sido procesado exitosamente.
                </p>
                <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Registrado</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34c759' }}>{closedOrderInfo.totalBs.toLocaleString('es-VE')} Bs</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>${closedOrderInfo.totalUsd.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        className="action-btn"
                        style={{
                            background: 'linear-gradient(135deg, #34c759 0%, #28a745 100%)',
                            color: 'white', justifyContent: 'center', fontWeight: 700
                        }}
                        onClick={onClose}
                    >
                        Continuar
                    </button>
                    <button
                        className="action-btn"
                        style={{
                            background: 'transparent',
                            color: 'var(--text-secondary)', justifyContent: 'center',
                            border: '1px solid var(--accent-light)'
                        }}
                        onClick={() => {
                            window.location.href = '/caja';
                        }}
                    >
                        Ver Detalles en Caja
                    </button>
                </div>
            </div>
        </div>
    );
}
