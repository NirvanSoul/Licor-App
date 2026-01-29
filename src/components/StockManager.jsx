
import React, { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useOrder } from '../context/OrderContext';
import { Minus, Plus, Box, Package, ChevronDown, ChevronUp, Layers, Trash2, AlertTriangle, Check, Search } from 'lucide-react';
import ContainerSelector from './ContainerSelector';
import { getGlobalSearchScore } from '../utils/searchUtils';

// --- REAL TIME STOCK CALCULATION HELPER ---
const getReservedQuantity = (pendingOrders, getUnitsPerEmission, beer, subtype) => {
    if (!pendingOrders) return 0;
    let reserved = 0;
    pendingOrders.forEach(order => {
        if (order.status !== 'OPEN') return;
        order.items.forEach(item => {
            if (item.name === beer && item.subtype === subtype) {
                const emission = item.emission || 'Unidad';
                const units = getUnitsPerEmission(emission, subtype);
                reserved += (item.quantity * units);
            }
        });
    });
    return reserved;
};

// --- STOCK CONTROL ROW COMPONENT ---
const StockRow = ({ beer, subtype, emission, icon: Icon }) => {
    const {
        getInventory,
        getUnitsPerEmission,
        pendingInventory,
        updatePendingInventory,
        getPendingInventory,
        setPendingInventoryValue,
        getCostPrice
    } = useProduct();

    const { pendingOrders } = useOrder();

    const currentStock = getInventory(beer, subtype);
    const reservedStock = getReservedQuantity(pendingOrders, getUnitsPerEmission, beer, subtype);
    const effectiveStock = currentStock - reservedStock;

    // Cost Calculation
    const currentCost = getCostPrice(beer, emission, subtype);
    // Always show unit cost for reference, unless this IS the unit
    const unitCost = emission === 'Unidad' ? currentCost : getCostPrice(beer, 'Unidad', subtype);

    // Pending Input
    const pendingCount = getPendingInventory(beer, subtype, emission);
    const isNegative = pendingCount < 0;
    const isPositive = pendingCount > 0;
    const activeColor = isNegative ? '#EF4444' : (isPositive ? '#34c759' : 'var(--text-primary)');

    const relevantPending = pendingInventory || {};
    const allPendingForSubtype = Object.entries(relevantPending).reduce((sum, [key, qty]) => {
        if (key.startsWith(`${beer}_${subtype}_`)) {
            const parts = key.split('_');
            const em = parts[parts.length - 1];
            return sum + (qty * getUnitsPerEmission(em, subtype));
        }
        return sum;
    }, 0);

    const previewTotal = effectiveStock + allPendingForSubtype;

    return (
        <div className="stock-row" style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            borderBottom: '1px solid #f0f0f0',
            gap: '0.75rem',
            background: 'transparent',
            borderRadius: '12px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={20} className="text-gray-500" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{emission}</span>
                    </div>
                    {/* Cost Display Badge */}
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-app)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        <span style={{ opacity: 0.8, fontWeight: 400 }}>Costo de Inventario:</span>
                        <span style={{ fontWeight: 700 }}>${currentCost.toFixed(2)}</span>
                    </div>
                </div>

                {/* Stock Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#666' }}>
                        Actual: {(() => {
                            if (emission === 'Unidad') return effectiveStock;
                            const perBox = getUnitsPerEmission(emission, subtype) || 1;
                            const boxes = Math.floor(effectiveStock / perBox);
                            const rem = effectiveStock % perBox;
                            if (boxes === 0) return `${rem} Ud${rem !== 1 ? 's' : ''}`;
                            if (rem === 0) return `${boxes} ${emission}${boxes !== 1 ? 's' : ''}`;
                            return `${boxes} ${emission}${boxes !== 1 ? 's' : ''} + ${rem} Ud${rem !== 1 ? 's' : ''}`;
                        })()}
                    </span>
                    {reservedStock > 0 && (
                        <span style={{ fontSize: '0.70rem', color: '#F59E0B', background: '#FFFBEB', padding: '2px 4px', borderRadius: '4px' }}>
                            (Res: {(() => {
                                if (emission === 'Unidad') return reservedStock;
                                const perBox = getUnitsPerEmission(emission, subtype) || 1;
                                const boxes = Math.floor(reservedStock / perBox);
                                const rem = reservedStock % perBox;
                                if (boxes === 0) return `${rem} Ud`;
                                if (rem === 0) return `${boxes}`;
                                return `${boxes} + ${rem}u`;
                            })()})
                        </span>
                    )}

                    {allPendingForSubtype !== 0 && (
                        <>
                            <span style={{ color: '#ccc' }}>&rarr;</span>
                            <span style={{ color: (allPendingForSubtype < 0 ? '#EF4444' : '#34c759'), fontWeight: 700 }}>
                                {(() => {
                                    if (emission === 'Unidad') return previewTotal;
                                    const perBox = getUnitsPerEmission(emission, subtype) || 1;
                                    const val = Math.abs(previewTotal);
                                    const sign = previewTotal < 0 ? '-' : '';
                                    const boxes = Math.floor(val / perBox);
                                    const rem = val % perBox;

                                    if (boxes === 0) return `${sign}${rem} Ud${rem !== 1 ? 's' : ''}`;
                                    if (rem === 0) return `${sign}${boxes} ${emission}${boxes !== 1 ? 's' : ''}`;
                                    return `${sign}${boxes} ${emission}${boxes !== 1 ? 's' : ''} + ${rem} Ud${rem !== 1 ? 's' : ''}`;
                                })()}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Input Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
                <div className="stock-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-app)', padding: '6px 12px', borderRadius: '16px' }}>
                    <button
                        onClick={() => updatePendingInventory(beer, subtype, emission, -1)}
                        style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--accent-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Minus size={22} color="var(--text-primary)" />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 1rem', minWidth: '110px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>
                            {isNegative ? 'RETIRAR' : 'AGREGAR'}
                        </span>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={pendingCount === 0 ? '' : Math.abs(pendingCount)}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : parseInt(raw.slice(0, 6), 10);
                                if (isNaN(val)) return;

                                if (val === 0) {
                                    setPendingInventoryValue(beer, subtype, emission, 0);
                                    return;
                                }

                                const sign = pendingCount < 0 ? -1 : 1;
                                setPendingInventoryValue(beer, subtype, emission, val * sign);
                            }}
                            onFocus={(e) => e.target.select()}
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: activeColor,
                                textAlign: 'center',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                padding: '0',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield'
                            }}
                            placeholder="0"
                        />
                    </div>

                    <button
                        onClick={() => updatePendingInventory(beer, subtype, emission, 1)}
                        style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--accent-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plus size={22} color="var(--text-primary)" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function StockManager({ initialSearch }) {
    const {
        beerTypes,
        getInventory,
        getUnitsPerEmission,
        pendingInventory,
        updatePendingInventory,
        getPendingInventory,
        setPendingInventoryValue,
        inventoryHistory,
        breakageHistory = [],
        beerCategories
    } = useProduct();

    const { pendingOrders } = useOrder();

    const [historyOpen, setHistoryOpen] = useState(false);
    const [wasteSectionOpen, setWasteSectionOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [globalStockSubtype, setGlobalStockSubtype] = useState('Botella');
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');

    // Auto-expand search results
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            // Optional: You could collapse everything here, but usually it's better 
            // to keep the manual toggles. However, for a "clean" feel, let's only 
            // expand when there's an active search.
            return;
        }

        const newExpanded = {};
        beerTypes.forEach(beer => {
            const score = getGlobalSearchScore(beer, searchQuery);
            if (score >= 80) {
                newExpanded[beer] = true;
            }
        });

        if (Object.keys(newExpanded).length > 0) {
            setExpandedSections(prev => ({ ...prev, ...newExpanded }));
        }
    }, [searchQuery, beerTypes]);

    // Auto-expand and search on initial guide
    useEffect(() => {
        if (initialSearch) {
            setSearchQuery(initialSearch);
            setExpandedSections(prev => ({ ...prev, [initialSearch]: true }));

            // Set subtype if needed
            const category = beerCategories[initialSearch] || 'Botella';
            const defaultSub = category.toLowerCase().includes('lata') ? 'Lata Pequeña' : 'Botella';
            setGlobalStockSubtype(defaultSub);
        }
    }, [initialSearch, beerCategories]);

    // Summary Items (Only for normal inventory)
    const summaryItems = [];
    if (pendingInventory) {
        Object.entries(pendingInventory).forEach(([key, count]) => {
            if (count === 0) return;
            const parts = key.split('_');
            const emission = parts.pop();
            const subtype = parts.pop();
            const beer = parts.join('_');
            summaryItems.push({ beer, subtype, emission, count });
        });
    }

    const toggleSection = (beer) => {
        setExpandedSections(prev => ({ ...prev, [beer]: !prev[beer] }));
    };

    const handleGlobalSubtypeChange = (subtype) => {
        setGlobalStockSubtype(subtype);
    };

    // Merge History for the big modal
    const safeInvHistory = Array.isArray(inventoryHistory) ? inventoryHistory : [];
    const safeBreakHistory = Array.isArray(breakageHistory) ? breakageHistory : [];
    const allHistory = [...safeInvHistory, ...safeBreakHistory].sort((a, b) => b.id - a.id);

    // Recent Waste for the footer section
    const recentWaste = safeBreakHistory.slice(0, 5);

    return (
        <div className="stock-manager-container" style={{ paddingBottom: '120px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title text-lg font-bold" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Box size={20} />
                        Gestión de Inventario
                    </h3>
                    <button
                        onClick={() => setHistoryOpen(true)}
                        style={{
                            padding: '8px 12px',
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--accent-light)',
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

                {/* Search Bar */}
                <div className="app-search-container" style={{ marginBottom: '1.5rem' }}>
                    <Search className="app-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar en inventario..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="app-search-input"
                    />
                </div>

                {/* GLOBAL SUBTYPE SELECTOR (NEW) */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '1rem',
                    borderRadius: '16px',
                    border: '1px solid var(--accent-light)',
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Formato a Cargar:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: globalStockSubtype === 'Botella Tercio' ? '#34C759' : 'var(--text-secondary)' }}>Tercio (24 Uds)</span>
                            <div
                                onClick={() => setGlobalStockSubtype(globalStockSubtype === 'Botella Tercio' ? 'Botella' : 'Botella Tercio')}
                                style={{ width: '38px', height: '20px', background: globalStockSubtype === 'Botella Tercio' ? '#34C759' : '#ccc', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                            >
                                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: globalStockSubtype === 'Botella Tercio' ? '20px' : '2px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                    </div>

                    {globalStockSubtype !== 'Botella Tercio' && (
                        <ContainerSelector
                            value={globalStockSubtype}
                            onChange={(val) => setGlobalStockSubtype(val)}
                        />
                    )}
                </div>
            </div>

            <div className="stock-grid" style={{ display: 'grid', gap: '1rem' }}>
                {Array.isArray(beerTypes) && beerTypes
                    .filter(beer => {
                        // 1. Search Query Filter
                        const matchesSearch = !searchQuery || beer.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchesSearch) return false;

                        // 2. Subtype Category Filter
                        const category = (beerCategories[beer] || 'Botella').toLowerCase();
                        const selectedSub = globalStockSubtype.toLowerCase();

                        // Logic: If selected is "Botella..." -> show beers with "botella" category
                        // If selected is "Lata..." -> show beers with "lata" category
                        if (selectedSub.includes('botella')) {
                            return category.includes('botella');
                        } else if (selectedSub.includes('lata')) {
                            return category.includes('lata');
                        }

                        return true;
                    })
                    .map(beer => {
                        const isExpanded = expandedSections[beer];
                        const hasPending = pendingInventory && Object.keys(pendingInventory).some(k => k.startsWith(beer + '_'));

                        // Use the product's actual category if it matches the current global filter type
                        const productCategory = beerCategories[beer] || 'Botella';
                        const activeSubtype = (globalStockSubtype === 'Lata' && productCategory.includes('Lata'))
                            ? productCategory
                            : (globalStockSubtype === 'Botella' && productCategory.includes('Botella'))
                                ? productCategory
                                : globalStockSubtype;

                        return (
                            <div key={beer} className="beer-stock-card" style={{
                                background: 'var(--bg-card)', borderRadius: '16px',
                                border: '1px solid var(--accent-light)',
                                overflow: 'hidden',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                            }}>
                                <div
                                    onClick={() => toggleSection(beer)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: 'var(--bg-card-hover)',
                                        borderBottom: isExpanded ? '1px solid var(--accent-light)' : 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        {beer}

                                        {/* Product Subtype Badge */}
                                        {productCategory.toLowerCase().includes('lata') && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: productCategory.toLowerCase().includes('grande') ? 'rgba(249, 115, 22, 0.15)' : 'rgba(251, 146, 60, 0.12)',
                                                color: productCategory.toLowerCase().includes('grande') ? '#F97316' : '#FB923C',
                                                border: `1px solid ${productCategory.toLowerCase().includes('grande') ? 'rgba(249, 115, 22, 0.3)' : 'rgba(251, 146, 60, 0.2)'}`,
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {productCategory.toLowerCase().includes('grande') ? 'Lata Grande' : 'Lata Pequeña'}
                                            </span>
                                        )}

                                        {hasPending && !isExpanded && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                                        )}
                                    </span>
                                    {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                                </div>

                                {isExpanded && (
                                    <div style={{ padding: '1rem ' }}>
                                        <div>
                                            {['Caja', 'Unidad'].map(emission => (
                                                <StockRow
                                                    key={`${beer}-${emission}-${activeSubtype}`}
                                                    beer={beer}
                                                    subtype={activeSubtype}
                                                    emission={emission}
                                                    icon={emission === 'Caja' ? Package : Layers}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* SUMMARY SECTION */}
            {summaryItems.length > 0 && (
                <div className="inventory-summary" style={{
                    marginTop: '2rem',
                    background: 'var(--bg-card-active)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    color: 'var(--text-primary)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--accent-light)'
                }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--accent-light)', paddingBottom: '0.5rem' }}>
                        Resumen de Movimientos
                    </h4>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {summaryItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', fontSize: '0.9rem' }}>
                                <div style={{ fontWeight: 500 }}>
                                    {item.beer} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>{item.subtype}</span>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 400, color: '#9CA3AF' }}></div>
                                <div style={{ textAlign: 'right', fontWeight: 700, color: item.count < 0 ? '#EF4444' : '#34D399' }}>
                                    {item.count > 0 ? '+' : ''}{item.count} {item.emission}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DEDICATED WASTE SECTION */}
            <div style={{ marginTop: '2rem', marginBottom: '5rem', border: '1px solid var(--accent-light)', borderRadius: '16px', overflow: 'hidden' }}>
                <div
                    onClick={() => setWasteSectionOpen(!wasteSectionOpen)}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: '#EF4444'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Trash2 size={20} />
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Mermas / Daños Recientes</span>
                    </div>
                    {wasteSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {wasteSectionOpen && (
                    <div style={{ background: 'var(--bg-card)', padding: '1rem' }}>
                        {recentWaste.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
                                No hay reportes de merma recientes.
                            </p>
                        ) : (
                            recentWaste.map(report => (
                                <div key={report.id} style={{
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid var(--accent-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {report.timestamp}
                                        </div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {report.movements[0]?.beer} ({report.movements[0]?.subtype})
                                        </div>
                                    </div>
                                    <div style={{
                                        color: '#EF4444',
                                        fontWeight: 700,
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem'
                                    }}>
                                        -{report.totalUnits} Uds
                                    </div>
                                </div>
                            ))
                        )}
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Reporta mermas desde la pantalla de Ventas &gt; Pendientes.
                        </div>
                    </div>
                )}
            </div>

            {/* UNIFIED HISTORY MODAL */}
            {historyOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, backdropFilter: 'blur(2px)', padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '24px',
                        width: '100%', maxWidth: '400px', maxHeight: '80vh',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--accent-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Historial Completo</h3>
                            <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>&times;</button>
                        </div>
                        <div style={{ padding: '1rem', overflowY: 'auto', background: 'var(--bg-app)' }}>
                            {allHistory.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>No hay registros recientes.</p>
                            ) : (
                                allHistory.map((report) => {
                                    const isWaste = report.type === 'WASTE';
                                    return (
                                        <div key={report.id} style={{
                                            background: 'var(--bg-card)', borderRadius: '12px', padding: '1rem',
                                            marginBottom: '0.8rem', border: '1px solid var(--accent-light)',
                                            borderLeft: isWaste ? '4px solid #BE123C' : '4px solid var(--accent)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{report.timestamp}</span>
                                                <span style={{
                                                    background: isWaste ? '#FFE4E6' : (report.totalUnits < 0 ? '#FEE2E2' : '#e0f2fe'),
                                                    color: isWaste ? '#BE123C' : (report.totalUnits < 0 ? '#991B1B' : '#0284c7'),
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600
                                                }}>
                                                    {isWaste ? 'MERMA' : (report.totalUnits > 0 ? '+' : '') + report.totalUnits + ' Uds'}
                                                </span>
                                            </div>
                                            <div style={{ borderTop: '1px solid var(--accent-light)', paddingTop: '0.5rem' }}>
                                                {report.movements.map(m => (
                                                    <div key={Math.random()} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ color: 'var(--text-primary)' }}>{m.beer} {m.subtype} ({m.emission})</span>
                                                        <span style={{ fontWeight: 600, color: isWaste || m.quantity < 0 ? '#EF4444' : '#34c759' }}>
                                                            {isWaste ? '-' : (m.quantity > 0 ? '+' : '')}{m.quantity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--accent-light)', background: 'var(--bg-card)' }}>
                            <button onClick={() => setHistoryOpen(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--accent)', color: 'var(--bg-card)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
