import React, { useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import HourlyChart from '../components/HourlyChart';

export default function DailyDetailModal({
    date,
    onClose,
    navigateDate,
    dailyHourlyStats,
    currencySymbol,
    isToday
}) {
    if (!dailyHourlyStats) return null;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content weekly-modal-content" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="report-modal-header weekly-modal-header">
                    <div className="weekly-header-top">
                        <h2 className="weekly-title">Reporte Diario</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="weekly-nav-section">
                        <button className="nav-btn" onClick={() => navigateDate(-1)}>
                            <ChevronLeft size={20} />
                        </button>
                        <p className="weekly-range" style={{ textTransform: 'capitalize' }}>
                            {date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <button
                            className="nav-btn"
                            onClick={() => navigateDate(1)}
                            disabled={isToday(date)}
                            style={{ opacity: isToday(date) ? 0.3 : 1 }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="report-modal-body custom-scrollbar">
                    {/* Hero Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', color: 'white', border: 'none', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Ventas Totales</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                                {currencySymbol}{(dailyHourlyStats?.totalSales || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
                                {dailyHourlyStats.salesCount} Tickets
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
                                {isToday(date) ? 'Cierre en Curso' : 'Día Cerrado'}
                            </div>
                        </div>

                        <div className="dashboard-card" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(128, 128, 128, 0.1)', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora Pico</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ADE80' }}>
                                {dailyHourlyStats.peakHour >= 0 ? `${dailyHourlyStats.peakHour}:00` : '--'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 600, opacity: 0.9 }}>
                                Mayor Flujo
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Hora Baja: {dailyHourlyStats.lowHour >= 0 ? `${dailyHourlyStats.lowHour}:00` : '--'}
                            </div>
                        </div>
                    </div>

                    {/* Hourly Chart */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Desempeño por Hora</h3>
                    <div className="chart-wrapper-box" style={{ marginBottom: '2.5rem', background: 'transparent', padding: 0, boxShadow: 'none' }}>
                        <HourlyChart dailyHourlyStats={dailyHourlyStats} />
                    </div>

                    {/* Top Products */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Productos Top</h3>
                    <div className="products-section">
                        {dailyHourlyStats.topProducts.length === 0 ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay actividad registrada.</div>
                        ) : (
                            dailyHourlyStats.topProducts.map((p, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', padding: '1rem',
                                    background: 'rgba(128, 128, 128, 0.05)', borderRadius: '12px', marginBottom: '8px', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: i === 0 ? 'rgba(251, 146, 60, 0.2)' : 'rgba(128, 128, 128, 0.1)',
                                            color: i === 0 ? '#f97316' : 'var(--text-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.9rem'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                                            {i === 0 && <div style={{ fontSize: '0.65rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>Más Vendido</div>}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        {p.count} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Uds</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
