/**
 * MixedBuilderModal Component
 * Interactive modal for building mixed/varied beer cases
 */

import React from 'react';
import { formatCurrency } from '../utils/orderFormatters';
import { calculateMixedTotalUnits, getTargetUnits } from '../utils/mixedCaseHelpers';

export default function MixedBuilderModal({
    isOpen,
    onClose,
    emission,
    subtype,
    composition,
    onAddToMix,
    onRemoveFromMix,
    onConfirm,
    beerTypes,
    getInventory,
    getUnitsPerEmission,
    getMixedPrice,
    consumptionMode
}) {
    if (!isOpen) return null;

    const currentUnits = calculateMixedTotalUnits(composition);
    const targetUnits = getTargetUnits(emission, subtype, getUnitsPerEmission);
    const isComplete = currentUnits === targetUnits;
    const isMaxed = currentUnits >= targetUnits;

    const handleConfirm = () => {
        if (!isComplete) {
            alert(`Debes completar la caja. Llevas ${currentUnits} de ${targetUnits}.`);
            return;
        }
        onConfirm();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '400px', width: '95%' }}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="modal-title">Armar {emission}</h3>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span>Progreso</span>
                        <span>{currentUnits} / {targetUnits}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-card-hover)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, (currentUnits / targetUnits) * 100)}%`,
                            height: '100%',
                            background: isComplete ? '#34c759' : 'var(--accent-color)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Beer Grid */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {beerTypes.map(beer => {
                        const count = composition[beer] || 0;
                        const stock = getInventory(beer, subtype);

                        return (
                            <div key={beer} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                borderBottom: '1px solid var(--accent-light)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{beer}</div>
                                    <div style={{ fontSize: '0.75rem', color: stock < 10 ? '#ef4444' : 'var(--text-secondary)' }}>
                                        Disp: {stock}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => onRemoveFromMix(beer)}
                                        disabled={count === 0}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '1px solid var(--accent-light)',
                                            background: 'transparent',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ fontWeight: 700, width: '24px', textAlign: 'center' }}>{count}</span>
                                    <button
                                        onClick={() => onAddToMix(beer)}
                                        disabled={isMaxed || stock <= 0}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: (isMaxed || stock <= 0) ? 'var(--accent-light)' : 'var(--accent-color)',
                                            color: (isMaxed || stock <= 0) ? 'var(--text-muted)' : 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Live Price Preview */}
                <div style={{ textAlign: 'right', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Precio Estimado: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {formatCurrency(getMixedPrice)} Bs
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        style={{
                            background: 'var(--accent-light)',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            flex: 1,
                            maxWidth: '160px'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        className="modal-close-btn"
                        onClick={handleConfirm}
                        disabled={!isComplete}
                        style={{
                            background: isComplete ? '#34c759' : 'var(--bg-card-hover)',
                            color: isComplete ? 'white' : 'var(--text-muted)',
                            fontWeight: '700',
                            flex: 1,
                            maxWidth: '160px',
                            opacity: isComplete ? 1 : 0.6
                        }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
