import React, { useState } from 'react';
import { User, X } from 'lucide-react';

export default function RenameModal({ order, onClose, onRename }) {
    const [newNameValue, setNewNameValue] = useState(order.customerName);

    const handleRename = () => {
        onRename(order.id, newNameValue.trim() || 'Anónimo');
    };

    return (
        <div className="pending-modal-overlay" onClick={onClose}>
            <div className="pending-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="pending-modal-header">
                    <div>
                        <h3 className="pending-modal-title">Renombrar Ticket</h3>
                        <p className="pending-modal-subtitle">Ticket #{order.ticketNumber}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '0.5rem 0' }}>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <User size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            autoFocus
                            className="ticket-input-large"
                            value={newNameValue}
                            onChange={(e) => setNewNameValue(e.target.value)}
                            placeholder="Nombre del Cliente (Opcional)"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                            }}
                            style={{ paddingLeft: '40px', width: '100%' }}
                        />
                    </div>

                    <button
                        className="action-btn"
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                            color: 'white'
                        }}
                        onClick={handleRename}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
