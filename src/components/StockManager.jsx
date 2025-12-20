import React, { useState } from 'react';
import { useProduct } from '../context/ProductContext';
import { Minus, Plus, Box, Package, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function StockManager() {
    const {
        beerTypes,
        getInventory,
        emissionOptions,
        getUnitsPerEmission,
        pendingInventory,        // Use Global State
        updatePendingInventory, // Use Global Action
        commitInventory,        // Use Global Commit
        inventoryHistory        // Access History
    } = useProduct();

    const [historyOpen, setHistoryOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    // NEW MODE: 'add' (Entrada) vs 'remove' (Salida)
    const [mode, setMode] = useState('add'); // 'add' | 'remove'

    const toggleSection = (beer) => {
        setExpandedSections(prev => ({ ...prev, [beer]: !prev[beer] }));
    };

    // Helper to access pending value safely
    const getPending = (beer, subtype) => pendingInventory[`${beer}_${subtype}`] || 0;

    // Helper to render a stock control row
    const StockRow = ({ beer, subtype, icon: Icon }) => {
        const currentStock = getInventory(beer, subtype);
        const pending = getPending(beer, subtype);

        // Calculate "New Total" for preview
        const previewTotal = currentStock + pending;

        // Visual styles based on mode
        const isRemove = mode === 'remove';
        const activeColor = isRemove ? '#EF4444' : '#34c759';
        const bgActive = isRemove ? '#FEF2F2' : '#e8fceb';

        return (
            <div className="stock-row" style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                borderBottom: '1px solid #f0f0f0',
                gap: '0.75rem',
                background: pending !== 0 ? (isRemove ? '#fff5f5' : '#fafffb') : 'transparent',
                transition: 'background 0.3s'
            }}>
                {/* Header: Name + Live Stock Preview */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={20} className="text-gray-500" />
                        <span style={{ fontSize: '1rem', color: '#111827', fontWeight: 600 }}>{subtype}</span>
                    </div>

                    {/* Stock Display: Current -> New */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#666' }}>Actual: {currentStock}</span>
                        {pending !== 0 && (
                            <>
                                <span style={{ color: '#ccc' }}>&rarr;</span>
                                <span style={{ color: activeColor, fontWeight: 700 }}>
                                    {previewTotal}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: activeColor, background: bgActive, padding: '2px 6px', borderRadius: '4px' }}>
                                    ({pending > 0 ? '+' : ''}{pending})
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Input Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>

                    {/* Manual Unit Adjuster (Siempre Visible - Equivale a UNIDADES) */}
                    <div className="stock-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                // Logic: Update(-1) removes 1 unit.
                                updatePendingInventory(beer, subtype, -1);
                            }}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Minus size={18} color="#4B5563" />
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600 }}>
                                {isRemove ? 'RETIRAR' : 'AGREGAR'}
                            </span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: pending < 0 ? '#EF4444' : '#000', minWidth: '40px', textAlign: 'center' }}>
                                {pending}
                            </span>
                        </div>

                        <button
                            onClick={() => updatePendingInventory(beer, subtype, 1)}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Plus size={18} color="#4B5563" />
                        </button>
                    </div>

                    {/* Quick Add Buttons (Solo CAJAS) */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Array.isArray(emissionOptions) && emissionOptions.map(emissionName => {
                            // SKIP "Unidad" as it's the default main input
                            if (emissionName === 'Unidad') return null;

                            // FILTRO AÑADIDO: Solo permitir 'Caja'
                            if (emissionName !== 'Caja') return null;

                            const amount = getUnitsPerEmission(emissionName, subtype);
                            // Safe check: ensure amount is a number and > 1
                            if (!amount || amount <= 1) return null;

                            // If mode is remove, quick button removes a box
                            const clickAmount = isRemove ? -amount : amount;

                            return (
                                <button
                                    key={emissionName}
                                    onClick={() => updatePendingInventory(beer, subtype, clickAmount)}
                                    style={{
                                        fontSize: '0.8rem',
                                        padding: '8px 12px',
                                        background: isRemove ? '#FEF2F2' : '#e0f2fe',
                                        color: isRemove ? '#991B1B' : '#0369a1',
                                        border: isRemove ? '1px solid #FECACA' : '1px solid #bae6fd',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        lineHeight: 1.2,
                                        minWidth: '80px'
                                    }}
                                >
                                    <span>{isRemove ? '-' : '+'}1 {emissionName}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({amount} Uds)</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Calculate Summary Data
    const summaryItems = Object.entries(pendingInventory).map(([key, count]) => {
        if (count === 0) return null;
        const [beer, subtype] = key.split('_');

        let bestEmission = 'Caja';
        let unitsPerBest = getUnitsPerEmission('Caja', subtype);

        if (unitsPerBest <= 1) {
            const validEmissions = Array.isArray(emissionOptions)
                ? emissionOptions.filter(e => getUnitsPerEmission(e, subtype) > 1)
                : [];
            if (validEmissions.length > 0) {
                validEmissions.sort((a, b) => getUnitsPerEmission(b, subtype) - getUnitsPerEmission(a, subtype));
                bestEmission = validEmissions[0];
                unitsPerBest = getUnitsPerEmission(bestEmission, subtype);
            }
        }

        const displayUnits = unitsPerBest > 1 ? (count / unitsPerBest).toFixed(1) : 0;

        return { beer, subtype, count, displayUnits, bestEmission, unitsPerBest };
    }).filter(Boolean);

    // Render History Item helper
    const renderMovement = (mov) => {
        const unitsPerCaja = getUnitsPerEmission('Caja', mov.subtype);
        let extraInfo = '';
        if (unitsPerCaja > 1) {
            const cajas = (Math.abs(mov.quantity) / unitsPerCaja).toFixed(1);
            const formattedCajas = cajas.endsWith('.0') ? cajas.slice(0, -2) : cajas;
            extraInfo = `${formattedCajas} Cajas`;
        }
        const isNegative = mov.quantity < 0;
        return (
            <div key={mov.beer + mov.subtype} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#333' }}>
                    {mov.beer} {mov.subtype}
                    {extraInfo && <span style={{ color: '#888', marginLeft: '6px', fontSize: '0.75rem' }}>({extraInfo})</span>}
                </span>
                <span style={{ fontWeight: 600, color: isNegative ? '#EF4444' : '#34c759' }}>
                    {isNegative ? '' : '+'}{mov.quantity}
                </span>
            </div>
        );
    };

    return (
        <div className="stock-manager-container" style={{ paddingBottom: '120px' }}>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title text-lg font-bold" style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Box size={20} />
                        Gestión de Inventario
                    </h3>
                    <button
                        onClick={() => setHistoryOpen(true)}
                        style={{
                            padding: '8px 12px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#475569',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Historial
                    </button>
                </div>

                {/* MODE TOGGLE */}
                <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '12px', display: 'flex' }}>
                    <button
                        onClick={() => setMode('add')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: mode === 'add' ? 'white' : 'transparent',
                            color: mode === 'add' ? '#166534' : '#6b7280',
                            boxShadow: mode === 'add' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Entrada (Agregar)
                    </button>
                    <button
                        onClick={() => setMode('remove')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: mode === 'remove' ? 'white' : 'transparent',
                            color: mode === 'remove' ? '#991B1B' : '#6b7280',
                            boxShadow: mode === 'remove' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <Trash2 size={16} /> Salida (Retirar)
                    </button>
                </div>
            </div>

            <div className="stock-grid" style={{ display: 'grid', gap: '1rem' }}>
                {Array.isArray(beerTypes) && beerTypes.map(beer => {
                    const isExpanded = expandedSections[beer];
                    const pendingForBeer = Object.entries(pendingInventory).reduce((sum, [key, val]) => {
                        return key.startsWith(beer + '_') ? sum + val : sum;
                    }, 0);

                    return (
                        <div key={beer} className="beer-stock-card" style={{
                            background: 'white', borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                        }}>
                            {/* Collapsible Header */}
                            <div
                                onClick={() => toggleSection(beer)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: '#f9fafb',
                                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {beer}
                                    {pendingForBeer !== 0 && !isExpanded && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: pendingForBeer > 0 ? '#dcfce7' : '#fee2e2',
                                            color: pendingForBeer > 0 ? '#166534' : '#991b1b',
                                            padding: '2px 8px',
                                            borderRadius: '12px'
                                        }}>
                                            {pendingForBeer > 0 ? '+' : ''}{pendingForBeer}
                                        </span>
                                    )}
                                </span>
                                {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                            </div>

                            {/* Content */}
                            {isExpanded && (!emissionOptions || emissionOptions.length === 0 ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No hay tipos de emisión configurados.</div>
                            ) : (
                                <div>
                                    {emissionOptions.map(emission => {
                                        if (emission === 'Unidad' || emission === 'Libre') return null;

                                        return (
                                            <StockRow
                                                key={`${beer}-${emission}`}
                                                beer={beer}
                                                subtype={emission}
                                                icon={emission && typeof emission === 'string' && emission.toLowerCase().includes('lata') ? Box : Package}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* NEW SUMMARY SECTION */}
            {summaryItems.length > 0 && (
                <div className="inventory-summary" style={{
                    marginTop: '2rem',
                    background: '#111827',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>
                        Resumen de {mode === 'remove' ? 'Retiro' : 'Carga'}
                    </h4>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {summaryItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', fontSize: '0.9rem' }}>
                                <div style={{ fontWeight: 500 }}>
                                    {item.beer} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>{item.subtype}</span>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 400, color: '#9CA3AF' }}>
                                    {item.count} Uds
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 700, color: item.count < 0 ? '#EF4444' : '#34D399' }}>
                                    {item.displayUnits != 0 ? `${item.displayUnits} ${item.bestEmission}s` : '-'}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #374151', textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        Confirmar cambios con el botón flotante.
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(2px)',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Historial de Movimientos</h3>
                            <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ padding: '1rem', overflowY: 'auto', background: '#f8fafc' }}>
                            {inventoryHistory.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>No hay registros recientes.</p>
                            ) : (
                                inventoryHistory.map((report) => (
                                    <div key={report.id} style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '0.8rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                                {report.timestamp}
                                            </span>
                                            <span style={{
                                                background: report.totalUnits < 0 ? '#FEE2E2' : '#e0f2fe',
                                                color: report.totalUnits < 0 ? '#991B1B' : '#0284c7',
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600
                                            }}>
                                                {report.totalUnits > 0 ? '+' : ''}{report.totalUnits} Uds
                                            </span>
                                        </div>
                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                            {report.movements.map(m => renderMovement(m))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '1rem', borderTop: '1px solid #eee', background: 'white' }}>
                            <button
                                onClick={() => setHistoryOpen(false)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#000', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
