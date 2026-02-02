import React, { useState } from 'react';
import { TrendingUp, Activity, Package, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function SummaryCards({
    todayStats,
    currencySymbol,
    rate,
    profitStats, // New prop needed
    onOpenDaily,
    onOpenProfit
}) {
    const [showValues, setShowValues] = useState(true);
    const totalSalesBs = todayStats.totalSales * rate;

    const SensitiveValue = ({ value, subValue, primaryColor = 'inherit', secondaryColor = 'inherit' }) => {
        if (!showValues) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', filter: 'blur(4px)', opacity: 0.7, userSelect: 'none' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: primaryColor }}>$***,**</div>
                    <div style={{ fontSize: '0.85rem', color: secondaryColor }}>Bs ***,***.**</div>
                </div>
            );
        }
        return (
            <>
                <div className="value" style={{ color: primaryColor }}>
                    {currencySymbol}{(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="sub-value" style={{ color: secondaryColor }}>
                    Bs {(subValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </>
        );
    };

    return (
        <>
            {/* HERO CONTAINER (Left) */}
            <div className="hero-container" style={{ position: 'relative' }}>
                <div
                    className="dashboard-card card-hero"
                    onClick={onOpenDaily}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="label">Ventas de Hoy</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowValues(!showValues);
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>

                    <SensitiveValue
                        value={todayStats?.totalSales}
                        subValue={totalSalesBs}
                        primaryColor="white"
                        secondaryColor="rgba(255,255,255,0.9)"
                    />

                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
                        <Activity size={18} />
                        <span>Resumen Diario</span>
                        <TrendingUp size={16} />
                    </div>
                </div>
            </div>

            {/* PROFIT CONTAINER (Right) */}
            <div className="chart-container-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div
                    className="dashboard-card"
                    onClick={onOpenProfit}
                    style={{
                        cursor: 'pointer',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '120px',
                        padding: '1.5rem',
                        position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#059669' }}>Ganancia Neta</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowValues(!showValues);
                            }}
                            style={{
                                background: 'rgba(5, 150, 105, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#059669',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(5, 150, 105, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(5, 150, 105, 0.1)'}
                        >
                            {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>

                    {!showValues ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', filter: 'blur(4px)', opacity: 0.7, userSelect: 'none', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>$***,**</div>
                            <div style={{ width: '100px', height: '20px', background: 'gray', borderRadius: '10px' }}></div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                                {currencySymbol}{(profitStats?.net || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                width: 'fit-content',
                                color: '#059669',
                                fontWeight: 600,
                                marginBottom: '1rem'
                            }}>
                                Bs {((profitStats?.net || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </>
                    )}

                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="#10b981" />
                        <span>Margen Semanal: {showValues ? (profitStats?.margin || 0).toFixed(2) : '**'}%</span>
                    </div>
                </div>
            </div>
        </>
    );
}
