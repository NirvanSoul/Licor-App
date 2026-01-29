import React from 'react';
import { Calendar } from 'lucide-react';

export default function WeeklyChart({ weeklyStats, onClick, currencySymbol }) {
    const compactLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const nonZeroValues = weeklyStats.data.filter(v => v > 0);
    const effectiveMax = nonZeroValues.length > 0 ? Math.max(...nonZeroValues) : 1;

    return (
        <div
            className="dashboard-card weekly-chart-card"
            style={{ height: '100%', cursor: 'pointer' }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Desempeño Semanal</h3>
                </div>
                <Calendar size={16} className="text-secondary" />
            </div>

            <div className="chart-container">
                {weeklyStats.data.map((val, idx) => {
                    const height = (val / effectiveMax) * 100;
                    const isActive = idx === weeklyStats.currentDayIndex;
                    return (
                        <div key={idx} className="chart-bar-wrapper">
                            <div
                                className={`chart-bar ${isActive ? 'bar-active' : ''}`}
                                style={{
                                    height: `${Math.max(height, 6)}%`,
                                    opacity: (val === 0 && !isActive) ? 0.3 : 1,
                                    animation: isActive ? 'pulse-orange 2s infinite' : 'none'
                                }}
                                data-value={`${currencySymbol}${val.toFixed(0)}`}
                            />
                            <span className="bar-label" style={{
                                fontWeight: isActive ? '800' : '600',
                                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                                marginTop: '4px'
                            }}>
                                {compactLabels[idx]}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
