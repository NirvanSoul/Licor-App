import React, { useState } from 'react';
import { useProduct } from '../context/ProductContext';
import { Package, CheckCircle } from 'lucide-react';

export default function InventoryFab() {
    const { pendingInventory, commitInventory, clearPendingInventory, getUnitsPerEmission } = useProduct();
    const [showSummary, setShowSummary] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false); // NEW: Confirmation state
    const [lastReport, setLastReport] = useState(null);

    const totalItems = Object.values(pendingInventory || {}).reduce((a, b) => a + b, 0);

    if (totalItems === 0 && !showSummary && !showConfirm) return null;

    const handleClick = () => {
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        const report = commitInventory();
        setLastReport(report);
        setShowConfirm(false);
        setShowSummary(true);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    const handleClose = () => {
        setShowSummary(false);
        setLastReport(null);
    };

    return (
        <>
            {/* Extended FAB with Text when items actice */}
            {totalItems !== 0 && !showSummary && !showConfirm && (
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
                        <Package size={24} />
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
                            {totalItems}
                        </span>
                    </div>
                    <span>Guardar Inventario</span>
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
                        background: 'white',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '320px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
                            ¿Guardar Inventario?
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Estás a punto de actualizar el stock con {totalItems} unidades.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: '#f3f4f6',
                                    color: '#4b5563',
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
                                Confirmar
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                clearPendingInventory();
                                setShowConfirm(false);
                            }}
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

            {/* Session Report Modal */}
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
                        background: 'white',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '360px',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        {/* Gradient Definition */}
                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                            <defs>
                                <linearGradient id="inventory-gradient" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
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
                            <CheckCircle size={32} style={{ stroke: 'url(#inventory-gradient)' }} />
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
                            {lastReport.totalUnits < 0 ? '¡Descargo Exitoso!' : '¡Carga Exitosa!'}
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {lastReport.totalUnits < 0
                                ? `Has descargado ${Math.abs(lastReport.totalUnits)} unidades del inventario.`
                                : 'Se ha actualizado el inventario correctamente.'}
                        </p>

                        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                REPORTE DE MOVIMIENTOS
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                {lastReport.movements.map((mov, idx) => {
                                    // Calculate Boxes for display
                                    const unitsPerCaja = getUnitsPerEmission('Caja', mov.subtype);
                                    let extraInfo = '';
                                    if (unitsPerCaja > 1) {
                                        const cajas = (Math.abs(mov.quantity) / unitsPerCaja).toFixed(1); // 1 decimal if needed
                                        // Pretty format: if .0 remove it
                                        const formattedCajas = cajas.endsWith('.0') ? cajas.slice(0, -2) : cajas;
                                        extraInfo = `${formattedCajas} Cajas`;
                                    }

                                    return (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 500, color: '#333' }}>{mov.beer} {mov.subtype}</span>
                                                {extraInfo && <span style={{ fontSize: '0.75rem', color: '#666' }}>{extraInfo}</span>}
                                            </div>
                                            <span style={{ fontWeight: 700, color: mov.quantity < 0 ? '#EF4444' : '#34c759' }}>
                                                {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                                <span>Total Unidades</span>
                                <span style={{ color: lastReport.totalUnits < 0 ? '#EF4444' : 'inherit' }}>
                                    {lastReport.totalUnits > 0 ? '+' : ''}{lastReport.totalUnits}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#ccc', marginTop: '0.5rem', textAlign: 'right' }}>
                                {lastReport.timestamp}
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            style={{
                                background: '#111827',
                                color: 'white',
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer'
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
