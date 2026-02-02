import React, { useState } from 'react';
import { User, X } from 'lucide-react';

export default function OpenTicketModal({ onClose, onConfirm }) {
    const [newTabName, setNewTabName] = useState('');

    const handleConfirm = () => {
        // Enforce validations if needed, though name is optional
        onConfirm(newTabName);
    };

    return (
        <div className="pending-modal-overlay" onClick={onClose}>
            <div className="pending-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="pending-modal-header" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h3 className="pending-modal-title" style={{ textAlign: 'left', width: 'auto' }}>Abrir Carta</h3>
                        <p className="pending-modal-subtitle">Ingrese el nombre del cliente (Opcional)</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <User size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Nombre del Cliente (Opcional)"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
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

                <div className="actions-row">
                    <button
                        className="action-btn"
                        style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', padding: '0.75rem', justifyContent: 'center' }}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="action-btn"
                        onClick={handleConfirm}
                        style={{
                            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem',
                            justifyContent: 'center',
                            opacity: 1
                        }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
