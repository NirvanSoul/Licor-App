import React, { useState } from 'react';
import { useProduct } from '../context/ProductContext';
import { Save, CheckCircle, DollarSign } from 'lucide-react';

export default function PriceFab() {
    const {
        pendingPrices,
        commitPriceChanges,
        clearPendingPrices,
        currencySymbol
    } = useProduct();

    const [showConfirm, setShowConfirm] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [lastReport, setLastReport] = useState(null);

    // Count total changes
    const totalChanges = Object.keys(pendingPrices || {}).length;

    if (totalChanges === 0 && !showSummary && !showConfirm) return null;

    const handleClick = () => {
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        const report = await commitPriceChanges();
        setLastReport(report);
        setShowConfirm(false);
        setShowSummary(true);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    const handleDiscard = () => {
        clearPendingPrices();
        setShowConfirm(false);
    };

    const handleClose = () => {
        setShowSummary(false);
        setLastReport(null);
    };

    return (
        <>
            {/* Floating Action Button */}
            {totalChanges > 0 && !showSummary && !showConfirm && (
                <button
                    onClick={handleClick}
                    style={{
                        position: 'fixed',
                        bottom: '120px',
                        right: '1rem',
                        background: 'linear-gradient(180deg, #FF9C57 0%, #E65900 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '50px',
                        border: 'none',
                        boxShadow: '0 8px 20px rgba(255, 156, 87, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        zIndex: 1000,
                        cursor: 'pointer',
                        fontWeight: 600,
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <Save size={24} />
                        <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#fff',
                            color: '#E65900',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {totalChanges}
                        </span>
                    </div>
                    <span>Guardar Cambios</span>
                </button>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(3px)',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '320px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        color: 'var(--text-primary)'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            ¿Guardar Precios?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Vas a actualizar {totalChanges} precio{totalChanges !== 1 ? 's' : ''}. Los cambios serán visibles para todos los usuarios inmediatamente.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-secondary)',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleConfirm}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(180deg, #FF9C57 0%, #E65900 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(255, 156, 87, 0.2)'
                                }}
                            >
                                Continuar
                            </button>
                        </div>
                        <button
                            onClick={handleDiscard}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            Descartar Cambios
                        </button>
                    </div>
                </div>
            )}

            {/* Success Summary Modal */}
            {showSummary && lastReport && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        color: 'var(--text-primary)'
                    }}>
                        {/* Gradient Definition */}
                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                            <defs>
                                <linearGradient id="price-gradient" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#FF9C57" />
                                    <stop offset="100%" stopColor="#E65900" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div style={{
                            background: 'rgba(255, 156, 87, 0.15)',
                            width: '64px', height: '64px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem auto',
                            boxShadow: '0 0 0 8px rgba(255, 156, 87, 0.05)'
                        }}>
                            <CheckCircle size={32} style={{ stroke: 'url(#price-gradient)' }} />
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            ¡Precios Actualizados!
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Se han actualizado {lastReport.totalChanges} precio{lastReport.totalChanges !== 1 ? 's' : ''} correctamente.
                        </p>

                        <div style={{ background: 'var(--bg-input)', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--accent-light)', paddingBottom: '0.5rem' }}>
                                RESUMEN DE CAMBIOS
                            </div>

                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                                {lastReport.changes.map((change, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center', padding: '8px 0', borderBottom: idx < lastReport.changes.length - 1 ? '1px solid var(--accent-light)' : 'none' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{change.beer}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {change.emission} • {change.subtype} • {change.type}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.85rem' }}>
                                                {currencySymbol}{change.oldPrice.toFixed(2)}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ color: '#34c759', fontWeight: 'bold' }}>
                                                {currencySymbol}{change.newPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                                {lastReport.timestamp}
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            style={{
                                background: 'linear-gradient(180deg, #FF9C57 0%, #E65900 100%)',
                                color: 'white',
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)'
                            }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
