
import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNotification } from '../../../context/NotificationContext';
import { ChevronUp, ChevronDown, Check, ShoppingBag, Store, Save, X } from 'lucide-react';
import ContainerSelector from '../../../components/ContainerSelector';
import { isFuzzyMatch } from '../../../utils/searchUtils';

const BeerPriceEditor = ({ beerName, searchFilter = '' }) => {
    const {
        getEmissionsForSubtype,
        getPrice,
        updatePendingPrice,
        getPendingPrice,
        hasPendingPrice,
        getCostPrice,
        updatePendingCostPrice,
        getPendingCostPrice,
        hasPendingCostPrice,
        getUnitsPerEmission,
        currencySymbol,
        currentRate,
        beerCategories
    } = useProduct();
    const { showNotification } = useNotification();
    const { theme } = useTheme();
    const { role } = useAuth();

    // Permission: Only Owner, Manager, or Developer can see cost prices
    const canViewCost = role && ['OWNER', 'MANAGER', 'DEVELOPER'].includes(role);

    // Currency Mode State: 'USD' | 'BS'
    const [currencyMode, setCurrencyMode] = useState('USD');

    // Collapsible Logic
    const [subtype, setSubtype] = useState(beerCategories[beerName] || 'Botella');
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand if search matches
    useEffect(() => {
        if (beerName === 'Tercio') {
            setSubtype('Botella Tercio');
        } else {
            // Re-sync subtype with category when data loads
            const cat = beerCategories[beerName];
            if (cat && subtype !== cat) {
                setSubtype(cat);
            }
        }

        if (searchFilter && searchFilter.length > 1) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [searchFilter, beerName, beerCategories]);

    // Get emissions dynamic list (includes Six Pack, and custom ones)
    const emissions = React.useMemo(() => {
        const raw = getEmissionsForSubtype(subtype);
        // Sort from largest to smallest (Caja > Media Caja > Unidad, etc.)
        return [...raw].sort((a, b) => {
            const unitsA = getUnitsPerEmission(a, subtype);
            const unitsB = getUnitsPerEmission(b, subtype);
            return unitsB - unitsA;
        });
    }, [getEmissionsForSubtype, getUnitsPerEmission, subtype]);

    // Filter emissions if searching
    const filteredEmissions = emissions.filter(e => {
        if (!searchFilter) return true;
        // If the beer name itself matches deeply, show all emissions
        if (isFuzzyMatch(beerName, searchFilter)) return true;
        // Otherwise check if emission matches
        return isFuzzyMatch(e, searchFilter);
    });

    // Local state map: { 'Unidad': { standard: '', local: '', cost: '' }, ... }
    const [priceMap, setPriceMap] = useState({});

    // Load initial prices when beer/subtype changes
    useEffect(() => {
        const initialMap = {};
        const rate = currentRate || 1; // Avoid div by zero

        emissions.forEach(emi => {
            // Price Logic
            const pendingStd = getPendingPrice(beerName, emi, subtype, 'standard');
            const pendingLoc = getPendingPrice(beerName, emi, subtype, 'local');
            const stdUSD = pendingStd !== undefined ? pendingStd : getPrice(beerName, emi, subtype);
            const locUSD = pendingLoc !== undefined ? pendingLoc : getPrice(beerName, emi, subtype, 'local');
            const stdVal = currencyMode === 'USD' ? stdUSD : (stdUSD * rate);
            const locVal = currencyMode === 'USD' ? locUSD : (locUSD * rate);

            // Cost Logic
            const pendingCost = getPendingCostPrice(beerName, emi, subtype);
            const costUSD = pendingCost !== undefined ? pendingCost : getCostPrice(beerName, emi, subtype);
            const costVal = currencyMode === 'USD' ? costUSD : (costUSD * rate);

            initialMap[emi] = {
                standard: stdVal > 0 ? stdVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
                local: locVal > 0 ? locVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
                cost: costVal > 0 ? costVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
            };
        });
        setPriceMap(initialMap);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beerName, subtype, emissions, currencyMode, currentRate]);

    const handleAtmInputChange = (emission, type, e) => {
        const rawValue = e.target.value;
        const digits = rawValue.replace(/\D/g, '');
        const totalCents = parseInt(digits, 10) || 0;
        const realValue = totalCents / 100;
        const formattedDisplay = realValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        setPriceMap(prev => ({
            ...prev,
            [emission]: {
                ...prev[emission],
                [type]: formattedDisplay
            }
        }));

        const rate = currentRate || 1;
        const usdValue = currencyMode === 'USD' ? realValue : (realValue / rate);

        if (type === 'cost') {
            updatePendingCostPrice(beerName, emission, subtype, usdValue);

            // AUTO-CASCADE COST: If we update 'Caja', calculate and set cost for ALL others
            if (emission === 'Caja') {
                const caixaUnits = getUnitsPerEmission('Caja', subtype) || 1;
                const unitPriceCost = usdValue / caixaUnits;

                setPriceMap(prev => {
                    const newMap = { ...prev };
                    emissions.forEach(emi => {
                        if (emi === 'Caja') return;
                        const emiUnits = getUnitsPerEmission(emi, subtype);
                        const emiCostUSD = unitPriceCost * emiUnits;

                        // Update DB/Pending
                        updatePendingCostPrice(beerName, emi, subtype, emiCostUSD);

                        // Update local state display
                        const emiCostVal = currencyMode === 'USD' ? emiCostUSD : (emiCostUSD * rate);
                        newMap[emi] = {
                            ...newMap[emi],
                            cost: emiCostVal > 0 ? emiCostVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
                        };
                    });
                    return newMap;
                });
            }
        } else {
            const isLocal = type === 'local';
            updatePendingPrice(beerName, emission, subtype, usdValue, isLocal);
        }
    };

    // Helper to safely parse localized price strings back to numbers for calculation
    const parseCurrencyString = (str) => {
        if (!str) return 0;
        // Remove thousand separators (.) and replace decimal separator (,) with (.)
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    };

    // Helper to check if an emission has any pending changes
    const hasPendingChanges = (emission) => {
        return hasPendingPrice(beerName, emission, subtype, 'standard') ||
            hasPendingPrice(beerName, emission, subtype, 'local') ||
            hasPendingCostPrice(beerName, emission, subtype);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--accent-light)',
            position: 'relative'
        }}>
            {/* Header / Toggle Row */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="price-editor-header"
                style={{
                    marginBottom: isExpanded ? '1.5rem' : '0'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {isExpanded ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{beerName}</h3>

                    {/* Product Subtype Badge */}
                    {beerCategories[beerName]?.toLowerCase().includes('lata') && (
                        <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: beerCategories[beerName].toLowerCase().includes('grande') ? 'rgba(249, 115, 22, 0.15)' : 'rgba(251, 146, 60, 0.12)',
                            color: beerCategories[beerName].toLowerCase().includes('grande') ? '#F97316' : '#FB923C',
                            border: `1px solid ${beerCategories[beerName].toLowerCase().includes('grande') ? 'rgba(249, 115, 22, 0.3)' : 'rgba(251, 146, 60, 0.2)'}`,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            marginLeft: '4px'
                        }}>
                            {beerCategories[beerName].toLowerCase().includes('grande') ? 'Lata Grande' : 'Lata Pequeña'}
                        </span>
                    )}
                </div>

                {beerName !== 'Tercio' && (
                    <div className="price-editor-controls" onClick={(e) => e.stopPropagation()}>
                        {/* Currency Mode Toggle (Premium Pill Design) */}
                        <div className="currency-toggle-container" style={{
                            position: 'relative',
                            display: 'flex',
                            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e5e7eb',
                            borderRadius: '999px',
                            padding: '2px',
                            width: '100px',
                            height: '32px',
                            isolation: 'isolate'
                        }}>
                            {/* The Sliding Pill */}
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                bottom: '2px',
                                left: '2px',
                                width: 'calc(50% - 2px)',
                                background: '#10b981',
                                borderRadius: '999px',
                                transform: currencyMode === 'BS' ? 'translateX(100%)' : 'translateX(0)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 1
                            }} />

                            {/* USD Option */}
                            <button
                                onClick={() => {
                                    setCurrencyMode('USD');
                                    setIsExpanded(true);
                                }}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    color: currencyMode === 'USD' ? 'white' : '#6b7280',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    zIndex: 2,
                                    cursor: 'pointer',
                                    transition: 'color 0.3s'
                                }}
                            >
                                USD
                            </button>

                            {/* BS Option */}
                            <button
                                onClick={() => {
                                    setCurrencyMode('BS');
                                    setIsExpanded(true);
                                }}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    color: currencyMode === 'BS' ? 'white' : '#6b7280',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    zIndex: 2,
                                    cursor: 'pointer',
                                    transition: 'color 0.3s'
                                }}
                            >
                                BS
                            </button>
                        </div>

                        <div className="subtype-selector-container" style={{ width: '180px', display: 'flex', alignItems: 'center' }}>
                            <ContainerSelector value={subtype} onChange={(val) => {
                                if (val === 'Lata') {
                                    setSubtype(beerCategories[beerName] || 'Lata');
                                } else {
                                    setSubtype(val);
                                }
                                setIsExpanded(true);
                            }} allowedType={beerCategories[beerName]} />
                        </div>
                    </div>
                )}
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>

                    {filteredEmissions.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>
                            Sin resultados para "{searchFilter}"
                        </div>
                    )}

                    {filteredEmissions.map(emission => {
                        const isPending = hasPendingChanges(emission);
                        return (
                            <div key={emission} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                paddingBottom: '1.5rem',
                                borderBottom: '1px solid var(--accent-light)',
                                gap: '0.75rem',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{emission}</span>
                                    {isPending && (
                                        <span style={{
                                            background: 'rgba(255, 156, 87, 0.15)',
                                            color: '#E65900',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(230, 89, 0, 0.3)'
                                        }}>
                                            PENDIENTE
                                        </span>
                                    )}
                                </div>

                                <div className="price-input-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                    gap: '0.75rem'
                                }}>
                                    {/* Standard (Para Llevar) */}
                                    <div style={{
                                        background: 'var(--bg-card-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        border: hasPendingPrice(beerName, emission, subtype, 'standard')
                                            ? '2px solid rgba(255, 156, 87, 0.5)'
                                            : '1px solid transparent'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <ShoppingBag size={14} color="var(--text-secondary)" />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>PARA LLEVAR ({currencyMode === 'USD' ? currencySymbol : 'Bs.'})</span>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0,00"
                                            className="price-input"
                                            value={priceMap[emission]?.standard || ''}
                                            onChange={(e) => handleAtmInputChange(emission, 'standard', e)}
                                            style={{
                                                background: 'var(--bg-input)', border: '1px solid var(--accent-light)',
                                                borderRadius: '8px', padding: '8px', width: '100%', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '2px', opacity: 0.8 }}>
                                            {currencyMode === 'BS'
                                                ? `≈ ${currencySymbol}${(parseCurrencyString(priceMap[emission]?.standard) / (currentRate || 1)).toFixed(2)}`
                                                : `≈ Bs. ${(parseCurrencyString(priceMap[emission]?.standard) * (currentRate || 1)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
                                        </span>
                                    </div>

                                    {/* Local */}
                                    <div style={{
                                        background: 'var(--bg-card-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        border: hasPendingPrice(beerName, emission, subtype, 'local')
                                            ? '2px solid rgba(255, 156, 87, 0.5)'
                                            : '1px solid transparent'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <Store size={14} color="var(--text-secondary)" />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>LOCAL ({currencyMode === 'USD' ? currencySymbol : 'Bs.'})</span>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0,00"
                                            className="price-input"
                                            value={priceMap[emission]?.local || ''}
                                            onChange={(e) => handleAtmInputChange(emission, 'local', e)}
                                            style={{
                                                background: 'var(--bg-input)', border: '1px solid var(--accent-light)',
                                                borderRadius: '8px', padding: '8px', width: '100%', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '2px', opacity: 0.8 }}>
                                            {currencyMode === 'BS'
                                                ? `≈ ${currencySymbol}${(parseCurrencyString(priceMap[emission]?.local) / (currentRate || 1)).toFixed(2)}`
                                                : `≈ Bs. ${(parseCurrencyString(priceMap[emission]?.local) * (currentRate || 1)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
                                        </span>
                                    </div>

                                    {/* Cost (Adquisición) - ONLY VISIBLE TO MASTERS */}
                                    {canViewCost && (
                                        <div style={{
                                            background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            border: hasPendingCostPrice(beerName, emission, subtype)
                                                ? '2px solid #10b981'
                                                : (theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.1)')
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '50%', background: '#10b981',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 900 }}>$</span>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>PRECIO COSTO ({currencyMode === 'USD' ? currencySymbol : 'Bs.'})</span>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0,00"
                                                className="price-input"
                                                value={priceMap[emission]?.cost || ''}
                                                onChange={(e) => handleAtmInputChange(emission, 'cost', e)}
                                                style={{
                                                    background: 'var(--bg-input)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '8px', padding: '10px', width: '100%', fontSize: '1.1rem',
                                                    fontWeight: '800', color: theme === 'dark' ? '#10b981' : '#059669',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '2px', opacity: 0.8, fontWeight: 500 }}>
                                                {currencyMode === 'BS'
                                                    ? `≈ ${currencySymbol}${(parseCurrencyString(priceMap[emission]?.cost) / (currentRate || 1)).toFixed(2)}`
                                                    : `≈ Bs. ${(parseCurrencyString(priceMap[emission]?.cost) * (currentRate || 1)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Save button removed - Use floating FAB instead */}
                </div>
            )
            }

            <style jsx>{`
                .order-summary-card > div > div:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
                @keyframes fadeInPopup { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                
                .price-editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                }

                .price-editor-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                @media (max-width: 600px) {
                    .price-editor-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }

                    .price-editor-controls {
                        width: 100%;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    
                    .currency-toggle-container {
                        flex-shrink: 0;
                    }

                    .subtype-selector-container {
                        width: auto !important;
                        flex: 1;
                        max-width: 180px;
                    }

                    .price-input-grid {
                        grid-template-columns: 1fr !important;
                    }
                `}
            </style>
        </div >
    );
};

export default BeerPriceEditor;
