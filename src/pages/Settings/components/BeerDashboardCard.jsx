
import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext';
import { ChevronUp, ChevronDown, Check, ShoppingBag, Store } from 'lucide-react';
import ContainerSelector from '../../../components/ContainerSelector';
import { isFuzzyMatch, getGlobalSearchScore } from '../../../utils/searchUtils';

const BeerDashboardCard = ({ beerName, searchFilter = '' }) => {
    const {
        emissionOptions,
        getPrice,
        getInventory,
        currentRate,
        prices,
        beerCategories,
        getCostPrice,
        getUnitsPerEmission
    } = useProduct();

    // 1. State Hooks
    const [subtype, setSubtype] = useState('Botella');
    const [isExpanded, setIsExpanded] = useState(false);
    const normalizedQuery = searchFilter.toLowerCase();

    // 2. Derived Data (Emissions)
    const emissionsFromList = Array.isArray(emissionOptions)
        ? emissionOptions.filter(emission => getPrice(beerName, emission, subtype) > 0)
        : [];

    const discoveredEmissions = Object.keys(prices || {}).reduce((acc, key) => {
        if (!key.startsWith(beerName + '_')) return acc;
        if (!key.includes(subtype)) return acc;
        const emissionPart = key.replace(beerName + '_', '').split('_')[0];
        if (emissionPart) acc.push(emissionPart);
        return acc;
    }, []);

    const allActiveEmissions = Array.from(new Set([...emissionsFromList, ...discoveredEmissions]))
        .sort((a, b) => {
            const unitsA = getUnitsPerEmission(a, subtype);
            const unitsB = getUnitsPerEmission(b, subtype);
            return unitsB - unitsA;
        });
    // 3. Search Relevance & Visibility
    const searchScore = getGlobalSearchScore(beerName, normalizedQuery, allActiveEmissions);
    const isVisible = normalizedQuery.length < 2 || searchScore > 0;

    // 4. Effects (Auto-expand & Subtype switching)
    useEffect(() => {
        if (beerName === 'Tercio') {
            setSubtype('Botella Tercio');
            return;
        }

        if (!normalizedQuery) return;

        // Auto-expand ONLY if it's a strong match (Name match 80+, or Emission match 70+)
        if (searchScore >= 70) {
            setIsExpanded(true);
        }

        if (isFuzzyMatch('lata', normalizedQuery) || normalizedQuery.includes('lata')) {
            setSubtype(prev => prev.includes('Lata') ? prev : 'Lata Pequeña');
        } else if (isFuzzyMatch('botella', normalizedQuery) || normalizedQuery.includes('botella')) {
            setSubtype('Botella');
        }
    }, [normalizedQuery, searchScore, beerName]);

    // 5. Filtered Emissions for Display
    const filteredEmissions = allActiveEmissions.filter(emission => {
        if (normalizedQuery.length < 2) return true;
        const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
        const matchesThisEmission = terms.some(term => isFuzzyMatch(emission, term));
        const queryHasEmissionTerm = terms.some(term =>
            allActiveEmissions.some(e => term.length > 2 && isFuzzyMatch(e, term))
        );
        if (queryHasEmissionTerm) return matchesThisEmission;
        return true;
    });

    const formatBs = (usd) => {
        const rate = currentRate || 0;
        return (usd * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
    };

    if (!isVisible) return null;
    if (filteredEmissions.length === 0 && normalizedQuery.length > 2) return null;

    return (
        <div className="order-summary-card" style={{ padding: '1.5rem', transition: 'all 0.3s ease' }}>
            {/* Clickable Header for Collapse */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isExpanded ? '1.5rem' : '0',
                    cursor: 'pointer'
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

                {/* Hide selector for Tercio as requested */}
                {beerName !== 'Tercio' && (
                    <div style={{ width: '200px' }} onClick={(e) => e.stopPropagation()}>
                        <ContainerSelector value={subtype} onChange={(val) => {
                            setSubtype(val);
                            setIsExpanded(true);
                        }} allowedType={beerCategories[beerName]} />
                    </div>
                )}
            </div>

            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    {filteredEmissions.length > 0 ? (
                        filteredEmissions.map(emission => {
                            const standardPrice = getPrice(beerName, emission, subtype);
                            const rawLocal = getPrice(beerName, emission, subtype, 'local');
                            const localPrice = rawLocal > 0 ? rawLocal : standardPrice;
                            const stock = getInventory(beerName, subtype);

                            return (
                                <div key={emission} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    paddingBottom: '1.5rem',
                                    borderBottom: '1px solid var(--accent-light)',
                                    gap: '1rem'
                                }}>
                                    {/* Header: Emission + Stock */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{emission}</span>
                                            {subtype !== 'Botella' && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {subtype}
                                                </span>
                                            )}
                                        </div>
                                        {stock > 0 && emission === 'Caja' && (() => {
                                            const unitsPerBox = getUnitsPerEmission('Caja', subtype) || 1;
                                            const boxes = Math.floor(stock / unitsPerBox);
                                            const remainder = stock % unitsPerBox;

                                            let displayStock = '';
                                            if (boxes > 0 && remainder > 0) {
                                                displayStock = `${boxes} Cajas + ${remainder} Uds`;
                                            } else if (boxes > 0) {
                                                displayStock = `${boxes} Caja${boxes !== 1 ? 's' : ''}`;
                                            } else {
                                                displayStock = `${remainder} Uds`;
                                            }

                                            return (
                                                <span style={{
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                                }}>
                                                    {displayStock} Disp.
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Price Grid: Llevar vs Local */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                        gap: '0.75rem'
                                    }}>
                                        {/* Para Llevar */}
                                        <div style={{
                                            background: 'var(--bg-card-hover)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', gap: '4px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <ShoppingBag size={14} color="var(--text-secondary)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>PARA LLEVAR</span>
                                            </div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${standardPrice}</span>
                                            <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 600 }}>{formatBs(standardPrice)}</span>
                                        </div>

                                        {/* Consumo Local */}
                                        <div style={{
                                            background: 'var(--bg-card-hover)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            border: rawLocal > 0 ? '1px solid var(--accent-light)' : '1px dashed transparent'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <Store size={14} color="var(--text-secondary)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>LOCAL</span>
                                            </div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${localPrice}</span>
                                            <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 600 }}>{formatBs(localPrice)}</span>
                                        </div>

                                        {/* Cost Price (Adquisición) */}
                                        <div style={{
                                            background: 'rgba(16, 185, 129, 0.05)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            border: '1px solid rgba(16, 185, 129, 0.1)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <Check size={14} color="#10b981" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>COSTO</span>
                                            </div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                                                ${getCostPrice(beerName, emission, subtype).toFixed(2)}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Precio Adquisición</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>
                            Sin resultados para "{searchFilter}"
                        </div>
                    )}
                </div>
            )}
            <style jsx>{`
                .order-summary-card > div > div:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default BeerDashboardCard;
