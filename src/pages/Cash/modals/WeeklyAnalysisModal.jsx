import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeeklyAnalysisModal({
    weeklyStats,
    onClose,
    currencySymbol,
    rate = 0 // Make sure rate is passed or defaulted
}) {
    const [weekOffset, setWeekOffset] = useState(0);

    const selectedWeek = weeklyStats.getWeekData(weekOffset);
    const formatDate = (date) => date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

    return (
        <div className="report-modal-overlay" onClick={() => { onClose(); setWeekOffset(0); }}>
            <div className="report-modal-content weekly-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header weekly-modal-header">
                    <div className="weekly-header-top">
                        <h2 className="weekly-title">
                            {weekOffset === 0 ? 'Esta Semana' : weekOffset === 1 ? 'Semana Pasada' : `Hace ${weekOffset} semanas`}
                        </h2>
                        <button className="close-btn" onClick={() => { onClose(); setWeekOffset(0); }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="weekly-nav-section">
                        <button
                            className="nav-btn"
                            onClick={() => setWeekOffset(prev => prev + 1)}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <p className="weekly-range">
                            {formatDate(selectedWeek.start)} - {formatDate(selectedWeek.end)}
                        </p>
                        <button
                            className="nav-btn"
                            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                            disabled={weekOffset === 0}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="report-modal-body">
                    {/* Hero Highlights */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', color: 'white', border: 'none', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Total Ventas</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                                {currencySymbol}{selectedWeek.total.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
                                Bs {(selectedWeek.total * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
                                {weekOffset === 0 ? 'Semana Actual' : 'Semana Seleccionada'}
                            </div>
                        </div>
                        <div className="dashboard-card" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Máximo Diario</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                                {currencySymbol}{selectedWeek.max.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, opacity: 0.9 }}>
                                Bs {(selectedWeek.max * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Mejor venta de esta semana
                            </div>
                        </div>
                    </div>

                    {/* 7-Day Chart (Refined Style) */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Desempeño Diario</h3>
                    <div className="weekly-chart-distribution" style={{ width: '100%', marginBottom: '2.5rem' }}>
                        {/* Bars Container */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            height: '120px',
                            padding: '0 10px',
                            borderBottom: '1px solid rgba(128, 128, 128, 0.2)'
                        }}>
                            {selectedWeek.data.map((val, idx) => {
                                const h = (val / (selectedWeek.max || 1)) * 100;
                                const isPeak = val === selectedWeek.max && val > 0;
                                return (
                                    <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                                        <div
                                            style={{
                                                width: '24px',
                                                height: `${Math.max(h, 5)}%`,
                                                background: isPeak ? '#fb923c' : 'rgba(128, 128, 128, 0.4)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'all 0.3s ease',
                                                boxShadow: isPeak ? '0 0 15px rgba(251, 146, 60, 0.4)' : 'none',
                                                position: 'relative'
                                            }}
                                        >
                                            {val > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-25px',
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: isPeak ? '#fb923c' : 'var(--text-secondary)',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {val > 999 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Labels Container */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px 0' }}>
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, idx) => {
                                const isPeak = selectedWeek.data[idx] === selectedWeek.max && selectedWeek.max > 0;
                                return (
                                    <div key={idx} style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: isPeak ? '#f97316' : 'var(--text-secondary)'
                                    }}>
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Daily Breakdown */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Listado de Ventas</h3>
                    <div className="weekly-breakdown-list" style={{ border: 'none', background: 'transparent' }}>
                        {selectedWeek.data.map((total, idx) => {
                            const dayName = weeklyStats.labels[idx];
                            if (total === 0) return null;
                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.02)',
                                    borderRadius: '12px',
                                    marginBottom: '8px',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '36px', height: '36px',
                                            borderRadius: '10px',
                                            background: total === selectedWeek.max ? 'rgba(251, 146, 60, 0.2)' : 'rgba(0,0,0,0.05)',
                                            color: total === selectedWeek.max ? '#f97316' : 'var(--text-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.9rem'
                                        }}>
                                            {dayName.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{dayName}</div>
                                            {total === selectedWeek.max && (
                                                <div style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>Pico de Venta</div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: total === selectedWeek.max ? '#fb923c' : 'inherit' }}>
                                            {currencySymbol}{total.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            Bs {(total * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
