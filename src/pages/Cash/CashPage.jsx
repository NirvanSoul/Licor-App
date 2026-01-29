import React, { useState, useMemo, useEffect } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useProduct } from '../../context/ProductContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import './CashPage.css';

// Hook
import { useCashAnalytics } from './hooks/useCashAnalytics';

// Components
import CashHeader from './components/CashHeader';
import SummaryCards from './components/SummaryCards';
import TransactionList from './components/TransactionList';
import WeeklyChart from './components/WeeklyChart';

// Modals
import DailyDetailModal from './modals/DailyDetailModal';
import WeeklyAnalysisModal from './modals/WeeklyAnalysisModal';
import ProfitModal from './modals/ProfitModal';

export default function CashPage() {
    const { role } = useAuth();
    const { pendingOrders, loading: orderLoading } = useOrder();
    const productContext = useProduct();
    const { productLoading } = productContext || {};
    const { showNotification } = useNotification();

    // 1. Move Analytics Hook to Top (Safe with fallbacks)
    const analytics = useCashAnalytics({
        pendingOrders: pendingOrders || [],
        ...(productContext || {})
    });

    const {
        todayStats,
        todaysSales,
        weeklyStats,
        profitStats,
        lowStockConnect,
        topProducts
    } = analytics;

    // 2. UI State Hooks
    const [showDailyDetailModal, setShowDailyDetailModal] = useState(false);
    const [dailyDetailDate, setDailyDetailDate] = useState(new Date());
    const [showProfitModal, setShowProfitModal] = useState(false);
    const [showWeeklyModal, setShowWeeklyModal] = useState(false);

    // 3. Security Check (After Hooks)
    const isAuthorized = role === 'OWNER' || role === 'MANAGER' || role === 'DEVELOPER';

    // 4. Side Effects
    useEffect(() => {
        if (showDailyDetailModal || showProfitModal || showWeeklyModal) {
            document.body.style.overflow = 'hidden';
            window.dispatchEvent(new CustomEvent('modalopen'));
        } else {
            document.body.style.overflow = 'unset';
            window.dispatchEvent(new CustomEvent('modalclose'));
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.dispatchEvent(new CustomEvent('modalclose'));
        };
    }, [showDailyDetailModal, showProfitModal, showWeeklyModal]);

    useEffect(() => {
        const handleResetFlow = (e) => {
            if (e.detail === '/caja') {
                setShowDailyDetailModal(false);
                setShowProfitModal(false);
                setShowWeeklyModal(false);
                setDailyDetailDate(new Date());
            }
        };
        window.addEventListener('reset-flow', handleResetFlow);
        return () => window.removeEventListener('reset-flow', handleResetFlow);
    }, []);

    // 5. Statistics Calculation (Must be before early returns)
    const getSalesForDate = (date) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return (pendingOrders || []).filter(o => {
            if (o?.status !== 'PAID') return false;
            const d = new Date(o.closedAt || o.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === targetDate.getTime();
        });
    };

    const dailyHourlyStats = useMemo(() => {
        const sales = getSalesForDate(dailyDetailDate);
        const hourlyData = Array(24).fill(0);
        const productCounts = {};
        let totalSales = 0;

        sales.forEach(sale => {
            const date = new Date(sale.closedAt || sale.createdAt);
            const hour = date.getHours();
            const total = (sale.totalAmountUsd !== undefined && sale.totalAmountUsd !== null) ? Number(sale.totalAmountUsd) : 0;

            hourlyData[hour] += total;
            totalSales += total;

            (sale.items || []).forEach(item => {
                const name = item.beerType || item.name || 'Desconocido';
                const units = (item.quantity || 1);
                if (!productCounts[name]) productCounts[name] = 0;
                productCounts[name] += units;
            });
        });

        const sortedProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const peakHourVal = Math.max(...hourlyData, 0);
        const peakHour = peakHourVal > 0 ? hourlyData.indexOf(peakHourVal) : -1;

        const activeHours = hourlyData.map((val, idx) => ({ val, idx })).filter(h => h.val > 0);
        activeHours.sort((a, b) => a.val - b.val);
        const lowHour = activeHours.length > 0 ? activeHours[0].idx : -1;

        return {
            hourlyData,
            totalSales,
            topProducts: sortedProducts,
            peakHour,
            lowHour,
            salesCount: sales.length,
            maxHourVal: Math.max(...hourlyData, 1)
        };
    }, [dailyDetailDate, pendingOrders]);

    // 6. Early Returns (UI Rendering)
    if (!isAuthorized) {
        return (
            <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center'
            }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <ShieldAlert size={40} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Acceso Restringido
                </h2>
                <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>
                    Los reportes de caja y análisis financiero solo están disponibles para Dueños y Administradores.
                </p>
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                    <span style={{ fontWeight: 600 }}>Tu Rol Actual:</span> <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{role || 'Indefinido'}</span>
                </div>
            </div>
        );
    }

    // SILENT LOADING: Only show full-page loading if we have absolutely NO data (initial load)
    const hasData = (pendingOrders && pendingOrders.length > 0) || (productContext && Object.keys(productContext.inventory || {}).length > 0);
    if ((orderLoading || productLoading) && !hasData) {
        return <div className="p-8 text-center text-gray-500">Cargando datos maestros de caja...</div>;
    }


    // 7. Helpers
    const displayPayment = (method) => {
        if (!method || method === 'Cash') return 'Efectivo';
        if (typeof method === 'string' && method.startsWith('Pre-Pagado - ')) return method.replace('Pre-Pagado - ', '');
        return String(method);
    };

    const getShortPayment = (method) => {
        const full = displayPayment(method);
        if (full.includes('Efectivo')) return 'EF';
        if (full.includes('Pago Móvil') || full.includes('Pago Movil')) return 'PM';
        if (full.includes('Bio Pago') || full.includes('BioPago')) return 'BP';
        if (full.includes('Punto')) return 'PU';
        return full.substring(0, 2).toUpperCase();
    };

    const handleShareSale = (sale) => {
        // Logic for sharing (copied simplified version)
        const dateStr = new Date(sale.closedAt).toLocaleDateString();
        const msg = `Ticket #${sale.ticketNumber} - ${sale.customerName}\nTotal: $${sale.total.toFixed(2)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(msg).then(() => showNotification('Copiado', 'success'));
        }
    };

    const handleExport = () => {
        if (todaysSales.length === 0) {
            alert("No hay ventas para exportar hoy.");
            return;
        }

        const rate = productContext.currentRate || 0;
        const currencySymbol = productContext.currencySymbol;

        const summaryData = todaysSales.map(sale => {
            const consumptionMap = {};
            (sale.items || []).forEach(item => {
                if (!item) return;
                const name = item.beerType || item.name || 'Desconocido';
                const emission = item.emission || '';
                const subtype = item.subtype || '';
                const qty = Number(item.quantity) || 1;

                // Format: "Qty x Name [Subtype] (Emission)"
                // Example: "2 x Polar [Lata] (Media Caja)" or "1 x Polar (Unidad)"
                let details = name;
                if (subtype && subtype !== 'Botella') details += ` [${subtype}]`;
                if (emission && emission !== 'Unidad') details += ` (${emission})`;

                if (!consumptionMap[details]) consumptionMap[details] = 0;
                consumptionMap[details] += qty;
            });

            // Build consumption string with better formatting
            let consumptionStr = '';
            if (Object.keys(consumptionMap).length > 0) {
                consumptionStr = Object.entries(consumptionMap)
                    .map(([k, v]) => `${v} x ${k}`)
                    .join(', ');
            } else {
                // Fallback: if no items, show message
                consumptionStr = 'Sin items registrados';
            }

            return {
                'Ticket': sale.ticketNumber,
                'Cliente': sale.customerName,
                'Fecha': new Date(sale.closedAt).toLocaleDateString(),
                'Hora': new Date(sale.closedAt).toLocaleTimeString(),
                'Pago': displayPayment(sale.paymentMethod),
                'Ref': (sale.paymentMethod && String(sale.paymentMethod).toLowerCase().includes('pago móvil')) ? (sale.reference || '') : 'No Aplica',
                'Detalle Consumo': consumptionStr,
                'Usuario': sale.createdBy || 'Desconocido',
                [`Total (${currencySymbol})`]: parseFloat(sale.total.toFixed(2)),
                'Total (Bs)': parseFloat((sale.total * rate).toFixed(2)),
            };
        });

        const ws = XLSX.utils.json_to_sheet(summaryData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte_Diario");
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        XLSX.writeFile(wb, `Caja_${dateStr}.xlsx`);
    };

    return (
        <div className="page-container">
            <CashHeader
                date={new Date()}
            />

            {/* MAIN DASHBOARD CONTAINER (Matching Original Grid) */}
            <div className="dashboard-main-container">

                {/* HERO & PROFIT CARDS (Top Row) */}
                <SummaryCards
                    todayStats={todayStats}
                    currencySymbol={productContext.currencySymbol}
                    rate={productContext.currentRate}
                    profitStats={profitStats}
                    onOpenDaily={() => {
                        setDailyDetailDate(new Date());
                        setShowDailyDetailModal(true)
                    }}
                    onOpenProfit={() => setShowProfitModal(true)}
                />

                {/* TABLE SECTION (Full Width) */}
                <TransactionList
                    sales={todaysSales}
                    currencySymbol={productContext.currencySymbol}
                    getShortPayment={getShortPayment}
                    onExport={handleExport}
                    onShare={handleShareSale}
                />

                {/* BOTTOM ANALYTICS ROW (Weekly & Stock) */}
                <div className="analytics-grid-wrapper">
                    <div className="dashboard-grid" style={{ marginBottom: 0 }}>
                        <div className="col-span-12" style={{ marginBottom: '1.5rem' }}>
                            <WeeklyChart
                                weeklyStats={weeklyStats}
                                currencySymbol={productContext.currencySymbol}
                                onClick={() => setShowWeeklyModal(true)}
                            />
                        </div>

                        {/* Productos por Agotarse */}
                        <div className="dashboard-card col-span-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EF4444', margin: 0 }}>Productos por Agotarse</h3>
                                <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '180px', paddingRight: '4px' }} className="custom-scrollbar">
                                {(lowStockConnect || []).length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                        Inventario Saludable
                                    </div>
                                ) : (
                                    lowStockConnect.map((alert, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{alert.name}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.7, color: 'var(--text-secondary)' }}>{alert.subtype}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#EF4444', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {alert.boxes.toFixed(1)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Cajas</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{alert.qty} Uds</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="dashboard-card col-span-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Top Productos</h3>
                                <Package size={18} className="text-secondary" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {(topProducts || []).length === 0 ? <span className="text-secondary text-sm">Sin datos aún</span> :
                                    topProducts.map((p, i) => (
                                        <div key={i} className="top-product-item">
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div className="rank-badge">{i + 1}</div>
                                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.name}</span>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.count}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showDailyDetailModal && (
                <DailyDetailModal
                    date={dailyDetailDate}
                    onClose={() => setShowDailyDetailModal(false)}
                    navigateDate={(dir) => {
                        const d = new Date(dailyDetailDate);
                        d.setDate(d.getDate() + dir);
                        setDailyDetailDate(d);
                    }}
                    dailyHourlyStats={dailyHourlyStats}
                    currencySymbol={productContext.currencySymbol}
                    isToday={(d) => d.toDateString() === new Date().toDateString()}
                />
            )}

            {showWeeklyModal && (
                <WeeklyAnalysisModal
                    weeklyStats={weeklyStats}
                    onClose={() => setShowWeeklyModal(false)}
                    currencySymbol={productContext.currencySymbol}
                    rate={productContext.currentRate}
                />
            )}

            {showProfitModal && (
                <ProfitModal
                    profitStats={profitStats}
                    onClose={() => setShowProfitModal(false)}
                    currencySymbol={productContext.currencySymbol}
                />
            )}

        </div>
    );
}
