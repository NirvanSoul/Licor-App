import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export default function WasteModal({ beerTypes, onClose, onConfirm }) {
    const [wasteSelection, setWasteSelection] = useState({ beer: '', quantity: 1 });

    const handleConfirm = () => {
        if (!wasteSelection.beer) return;
        // Defaulting to "Botella" as per original logic logic
        onConfirm(wasteSelection.beer, 'Botella', wasteSelection.quantity);
        setWasteSelection({ beer: '', quantity: 1 });
    };

    return (
        <div className="pending-modal-overlay" onClick={onClose}>
            <div className="pending-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="pending-modal-header">
                    <div>
                        <h3 className="pending-modal-title" style={{ color: '#EF4444' }}>Reportar Botella Rota</h3>
                        <p className="pending-modal-subtitle">Registra botellas rotas o daños</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '0.5rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Cerveza Dañada
                    </label>
                    <div className="selector-grid" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                        {beerTypes.map(beer => (
                            <button
                                key={beer}
                                className={`option-btn ${wasteSelection.beer === beer ? 'selected' : ''}`}
                                onClick={() => setWasteSelection(prev => ({ ...prev, beer }))}
                                style={{ padding: '0.75rem', fontSize: '0.9rem' }}
                            >
                                {beer}
                            </button>
                        ))}
                    </div>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Cantidad (Unidades)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => setWasteSelection(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronDown size={20} color="var(--text-primary)" />
                        </button>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={wasteSelection.quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                    setWasteSelection(prev => ({ ...prev, quantity: Math.max(0, val) }));
                                } else if (e.target.value === '') {
                                    setWasteSelection(prev => ({ ...prev, quantity: 0 }));
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                width: '100px',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield'
                            }}
                        />
                        <button
                            onClick={() => setWasteSelection(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronUp size={20} color="var(--text-primary)" />
                        </button>
                    </div>

                    <button
                        className="action-btn"
                        disabled={!wasteSelection.beer}
                        style={{
                            width: '100%',
                            background: !wasteSelection.beer ? 'var(--bg-card-hover)' : '#EF4444',
                            color: 'white',
                            opacity: !wasteSelection.beer ? 0.5 : 1
                        }}
                        onClick={handleConfirm}
                    >
                        Confirmar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
}
