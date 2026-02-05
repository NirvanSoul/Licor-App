/**
 * StockErrorModal Component
 * Displays stock error information when inventory is insufficient
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StockErrorModal({ stockError, onClose }) {
    if (!stockError) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', maxWidth: '360px', borderRadius: '20px' }}>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <AlertCircle size={32} color="#ef4444" />
                    </div>
                    <h3 className="modal-title" style={{ color: '#ef4444', margin: 0, fontSize: '1.25rem' }}>
                        Stock Insuficiente
                    </h3>
                </div>

                <div style={{
                    background: 'var(--bg-card-hover)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    border: '1px solid var(--accent-light)'
                }}>
                    <h4 style={{
                        margin: '0 0 1rem 0',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderBottom: '1px solid var(--accent-light)',
                        paddingBottom: '0.75rem',
                        color: 'var(--text-primary)'
                    }}>
                        {stockError.product}
                    </h4>

                    <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Requerido</span>
                            <span style={{ fontWeight: 600 }}>{stockError.required} Uds</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Disponible</span>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>{stockError.available} Uds</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderTop: '1px dashed var(--accent-light)',
                            paddingTop: '0.75rem'
                        }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Faltante</span>
                            <span style={{ fontWeight: 700 }}>{stockError.required - stockError.available} Uds</span>
                        </div>
                    </div>
                </div>

                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        background: 'var(--bg-card-hover)',
                        color: 'var(--text-primary)',
                        border: 'none'
                    }}
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
