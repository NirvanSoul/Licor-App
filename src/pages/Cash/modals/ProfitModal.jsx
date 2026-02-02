import React, { useState, useEffect, useMemo } from 'react';
import { Package, X, ChevronLeft, ChevronRight, BarChart2, Calendar, TrendingUp, ShieldAlert, ChevronDown } from 'lucide-react';

export default function ProfitModal({
    defaultStats,
    calculateProfit,
    getChartData,
    onClose,
    currencySymbol
}) {
    const [viewMode, setViewMode] = useState('semanal'); // diaria, semanal, mensual, semestral, anual
    const [isViewModeOpen, setIsViewModeOpen] = useState(false);
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [stats, setStats] = useState(defaultStats || {});
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        if (defaultStats) setStats(defaultStats);
    }, [defaultStats]);

    // Data Fetching Logic
    useEffect(() => {
        setLoading(true);
        const { start, end, interval } = getDateRange(anchorDate, viewMode);

        // 1. Get Stats (Totals)
        const newStats = calculateProfit(start, end);
        setStats(newStats);

        // 2. Get Chart Data
        const data = getChartData(start, end, interval);
        setChartData(data);

        setLoading(false);
    }, [anchorDate, viewMode, calculateProfit, getChartData]);

    // Helpers
    const getDateRange = (date, mode) => {
        const start = new Date(date);
        const end = new Date(date);
        let interval = 'day';

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        switch (mode) {
            case 'diaria':
                interval = 'hour';
                break; // start/end are same day
            case 'semanal':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                interval = 'day';
                break;
            case 'mensual':
                start.setDate(1);
                end.setMonth(start.getMonth() + 1);
                end.setDate(0); // Last day of prev month
                interval = 'day';
                break;
            case 'semestral':
                const currentMonth = start.getMonth();
                const startMonth = currentMonth < 6 ? 0 : 6;
                start.setMonth(startMonth, 1);
                end.setMonth(startMonth + 6, 0);
                interval = 'month';
                break;
            case 'anual':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                interval = 'month';
                break;
        }

        // Fix end of day time
        end.setHours(23, 59, 59, 999);

        return { start, end, interval };
    };

    const handleNavigate = (direction) => {
        const newDate = new Date(anchorDate);
        switch (viewMode) {
            case 'diaria': newDate.setDate(newDate.getDate() + direction); break;
            case 'semanal': newDate.setDate(newDate.getDate() + (direction * 7)); break;
            case 'mensual': newDate.setMonth(newDate.getMonth() + direction); break;
            case 'semestral': newDate.setMonth(newDate.getMonth() + (direction * 6)); break;
            case 'anual': newDate.setFullYear(newDate.getFullYear() + direction); break;
        }
        setAnchorDate(newDate);
    };

    const getRangeLabel = () => {
        const { start, end } = getDateRange(anchorDate, viewMode);
        const options = { month: 'short', day: 'numeric' };

        if (viewMode === 'diaria') return start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (viewMode === 'anual') return start.getFullYear().toString();
        if (viewMode === 'mensual') return start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
    };

    // Components
    const SimpleBarChart = ({ data, viewMode }) => { // Receiving viewMode
        if (!data || data.length === 0) return <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No hay datos</div>;

        const maxVal = Math.max(...data.map(d => d.value), 1);
        const peakIndex = data.findIndex(d => d.value === maxVal);

        const widthPercent = 100 / data.length;

        // Label Formatter based on View Mode
        const getLabel = (d, index) => {
            const { originalKey, label } = d;

            if (viewMode === 'diaria') {
                // originalKey is hour (0-23)
                const h = parseInt(originalKey);
                if (h === 0) return '12am';
                if (h === 6) return '6am';
                if (h === 12) return '12pm';
                if (h === 18) return '6pm';
                return '';
            }

            if (viewMode === 'semanal') {
                // originalKey is Date string. "L 16"
                if (!originalKey) return '';
                const date = new Date(originalKey);
                const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
                return days[date.getDay()];
            }

            if (viewMode === 'mensual') {
                // range 1-31. Show 1, 5, 10, 15, 20, 25, 30
                if (!originalKey) return '';
                const date = new Date(originalKey);
                const day = date.getDate();
                if (day === 1 || day % 5 === 0) return day;
                return '';
            }

            if (viewMode === 'semestral' || viewMode === 'anual') {
                // originalKey "YYYY-M". Show "E", "F", "M"...
                if (!originalKey) return '';
                const parts = originalKey.split('-');
                if (parts.length < 2) return '';
                const m = parseInt(parts[1]); // 0-11
                const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                return months[m];
            }

            // Fallback
            // Determine which labels to show to avoid clutter if generic
            const showAllLabels = data.length <= 12;
            const isPeak = index === peakIndex && d.value > 0;
            const isFirst = index === 0;
            const isLast = index === data.length - 1;

            if (showAllLabels || isPeak || isFirst || isLast || (data.length > 20 && index % 5 === 0)) {
                return label;
            }
            return '';
        };

        return (
            <div className="daily-hourly-chart-container" style={{ width: '100%', marginTop: '1rem', paddingBottom: '1rem' }}>
                {/* Bars Container */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: '180px',
                    padding: '0 4px',
                    borderBottom: '1px solid rgba(128, 128, 128, 0.2)'
                }}>
                    {data.map((d, i) => {
                        const h = (d.value / maxVal) * 100;
                        const isPeak = i === peakIndex && d.value > 0;
                        const isActive = d.value > 0;

                        return (
                            <div key={i} style={{
                                height: '100%',
                                width: `${widthPercent}%`,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div
                                    style={{
                                        width: '70%',
                                        height: `${Math.max(h, 4)}%`,
                                        background: isPeak ? '#10B981' : 'rgba(128, 128, 128, 0.4)',
                                        borderRadius: '4px 4px 0 0',
                                        opacity: isActive ? (isPeak ? 1 : 0.5) : 0.2,
                                        transition: 'all 0.3s ease',
                                        boxShadow: isPeak ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                                        cursor: 'pointer'
                                    }}
                                    title={`${d.label}: ${currencySymbol}${d.value.toFixed(2)}`}
                                    onMouseEnter={e => {
                                        if (!isPeak) e.currentTarget.style.opacity = 1;
                                        if (!isPeak) e.currentTarget.style.background = '#10B981';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isPeak) e.currentTarget.style.opacity = isActive ? 0.5 : 0.2;
                                        if (!isPeak) e.currentTarget.style.background = 'rgba(128, 128, 128, 0.4)';
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Labels Container */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    {data.map((d, i) => {
                        const isPeak = i === peakIndex && d.value > 0;
                        const labelText = getLabel(d, i);

                        return (
                            <div key={i} style={{
                                width: `${widthPercent}%`,
                                textAlign: 'center',
                                fontSize: '0.7rem',
                                fontWeight: isPeak ? '800' : '500',
                                color: isPeak ? '#10B981' : 'var(--text-secondary)',
                                opacity: labelText ? 1 : 0, // Hide but keep spacing if empty
                                whiteSpace: 'nowrap',
                                // overflow: 'visible' is default
                            }}>
                                {labelText || '.'}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const { inventoryValue, revenue, cogs, net, margin } = stats;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content weekly-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}> {/* Wider for charts */}

                {/* Header Section */}
                <div className="report-modal-header weekly-modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="weekly-title">Reporte de Caja</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Controls Row */}
                    <div className="controls-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>

                        {/* View Mode Dropdown */}
                        <div className="view-mode-container" style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsViewModeOpen(!isViewModeOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-card-hover)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    cursor: 'pointer'
                                }}
                            >
                                {viewMode}
                                <ChevronDown size={14} style={{ transform: isViewModeOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                            </button>

                            {isViewModeOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    marginTop: '4px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    zIndex: 50,
                                    width: '140px',
                                    overflow: 'hidden'
                                }}>
                                    {['diaria', 'semanal', 'mensual', 'semestral', 'anual'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => { setViewMode(mode); setIsViewModeOpen(false); }}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px 12px',
                                                background: viewMode === mode ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                color: viewMode === mode ? '#10B981' : 'var(--text-secondary)',
                                                border: 'none',
                                                borderBottom: '1px solid var(--border-light)',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Navigator */}
                        <div className="date-navigator-container weekly-nav-section" style={{ flex: 1, background: 'transparent', borderRadius: '12px' }}>
                            <button className="nav-btn" onClick={() => handleNavigate(-1)}>
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '140px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getRangeLabel()}
                            </span>
                            <button className="nav-btn" onClick={() => handleNavigate(1)}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="report-modal-body custom-scrollbar">

                    {/* Chart Section (Freed) */}
                    <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
                        {/* Integrated Net Profit Subtitle (Above Chart for visibility as "Big Number") or Below */}
                        {/* User asked for it as subtitle below chart */}

                        <SimpleBarChart data={chartData} viewMode={viewMode} />

                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ganancia Neta</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', margin: 0, lineHeight: 1 }}>
                                    {currencySymbol}{(net || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#10B981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                marginTop: '8px'
                            }}>
                                {(margin || 0).toFixed(2)}% Margen
                            </span>
                        </div>
                    </div>

                    {/* Metrics Grid (Revenue & COGS) */}
                    <div className="profit-metrics-grid">
                        <div className="dashboard-card bg-gray-soft" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className="stat-label">Ingresos Totales</span>
                                <h3 className="stat-value">{currencySymbol}{(revenue || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={20} color="var(--text-secondary)" />
                            </div>
                        </div>
                        <div className="dashboard-card bg-gray-soft" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className="stat-label">Costo Mercancía</span>
                                <h3 className="stat-value text-red">-{currencySymbol}{(cogs || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={20} color="#EF4444" />
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Disclaimer Row (Stacked on mobile too via same grid/logic) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {/* Inventory Value */}
                        <div className="dashboard-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className="stat-label" style={{ color: '#3b82f6' }}>Valor de Inventario</span>
                                <h3 className="stat-value" style={{ color: '#3b82f6' }}>{currencySymbol}{(inventoryValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={20} color="#3b82f6" />
                            </div>
                        </div>

                        <div className="info-box" style={{ padding: '0.8rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={16} />
                            <p>Cálculos basados en costos registrados. Gastos operativos no incluidos.</p>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .profit-metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .controls-row {
                    flex-wrap: nowrap;
                }
                @media (max-width: 630px) {
                    .profit-metrics-grid {
                        grid-template-columns: 1fr;
                    }
                    .controls-row {
                        flex-wrap: wrap;
                    }
                    .date-navigator-container {
                        width: 100%;
                        order: 2;
                        margin-top: 5px;
                    }
                    .view-mode-container {
                        width: 100%;
                        /* order: 1; is default */
                    }
                    .view-mode-container button {
                        width: 100%;
                        justify-content: center;
                    }
                }
                .view-mode-selector::-webkit-scrollbar {
                    display: none;
                }
                .view-mode-selector {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
