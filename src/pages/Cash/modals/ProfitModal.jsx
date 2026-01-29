import React from 'react';
import { ShieldAlert, Package, TrendingUp, DollarSign, X } from 'lucide-react';

export default function ProfitModal({
    profitStats,
    onClose,
    currencySymbol
}) {
    if (!profitStats) return null;
    const { inventoryValue, weekRevenue, weekCOGS, weekNet, weekMargin } = profitStats;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content weekly-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header weekly-modal-header">
                    <div className="weekly-header-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="icon-box-orange" style={{ background: '#10B981' }}>
                            </div>
                            <h2 className="weekly-title">Rentabilidad & Inventario</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="weekly-nav-section">
                        <p className="weekly-range">Semana Actual</p>
                    </div>
                </div>

                <div className="report-modal-body custom-scrollbar">

                    {/* Inventory Value Asset */}
                    <div className="dashboard-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--accent-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Package size={20} className="text-secondary" />
                            <span className="stat-label">Valor del Inventario (Costo)</span>
                        </div>
                        <h2 className="hero-value" style={{ color: 'var(--text-primary)' }}>
                            {currencySymbol}{inventoryValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </h2>
                        <p className="stat-subtext">Capital invertido en mercancía actual</p>
                    </div>

                    {/* Profit breakdown */}
                    <div className="profit-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="dashboard-card bg-gray-soft">
                                <span className="stat-label">Ingresos (Semana)</span>
                                <h3 className="stat-value">{currencySymbol}{weekRevenue.toFixed(0)}</h3>
                            </div>
                            <div className="dashboard-card bg-gray-soft">
                                <span className="stat-label">Costo Mercancía</span>
                                <h3 className="stat-value text-red">-{currencySymbol}{weekCOGS.toFixed(0)}</h3>
                            </div>
                        </div>

                        <div className="dashboard-card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span className="stat-label" style={{ color: '#059669', fontWeight: 700 }}>Ganancia Neta Est.</span>
                                    <h2 className="hero-value" style={{ color: '#059669' }}>
                                        {currencySymbol}{weekNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </h2>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="stat-label">Margen</span>
                                    <h3 className="stat-value" style={{ color: '#059669' }}>{weekMargin.toFixed(1)}%</h3>
                                </div>
                            </div>
                        </div>

                        <div className="info-box" style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '8px', display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <ShieldAlert size={20} />
                            <p>Esta es una estimación basada en los costos de producto registrados. Gastos operativos no incluidos.</p>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
