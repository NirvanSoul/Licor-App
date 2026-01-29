import React from 'react';
import { TrendingUp, Activity, Package, AlertTriangle } from 'lucide-react';

export default function SummaryCards({
    todayStats,
    currencySymbol,
    rate,
    profitStats, // New prop needed
    onOpenDaily,
    onOpenProfit
}) {
    const totalSalesBs = todayStats.totalSales * rate;

    return (
        <>
            {/* HERO CONTAINER (Left) */}
            <div className="hero-container">
                <div
                    className="dashboard-card card-hero"
                    onClick={onOpenDaily}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="label">Ventas de Hoy</div>
                    <div className="value">
                        {currencySymbol}{(todayStats?.totalSales || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="sub-value">
                        Bs {(totalSalesBs || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
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
                        padding: '1.5rem'
                    }}
                >
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#059669', marginBottom: '0.5rem' }}>Ganancia Neta</div>

                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                        {currencySymbol}{(profitStats?.weekNet || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        Bs {((profitStats?.weekNet || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="#10b981" />
                        <span>Margen Semanal: {(profitStats?.weekMargin || 0).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        </>
    );
}
