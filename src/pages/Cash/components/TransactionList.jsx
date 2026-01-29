import React, { useState, useRef, useEffect } from 'react';
import { User, Download, Maximize2, AlertCircle, X, ChevronDown } from 'lucide-react';

export default function TransactionList({ sales, currencySymbol, getShortPayment, onExport, onShare, onDelete, range, onRangeChange }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const rangeLabels = {
        '7': 'Última Semana',
        '30': 'Último Mes',
        '60': 'Últimos 2 Meses',
        '180': 'Últimos 6 Meses',
        '365': 'Último Año'
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper needed for the table view
    const displayPayment = (method) => {
        if (!method || method === 'Cash') return 'Efectivo';
        if (typeof method === 'string' && method.startsWith('Pre-Pagado - ')) return method.replace('Pre-Pagado - ', '');
        return String(method);
    };

    const handleDelete = (id) => {
        if (window.confirm("¿Seguro que deseas eliminar esta venta de forma PERMANENTE? \n\nEsta acción revertirá el inventario y ajustará las ganancias.")) {
            onDelete(id);
        }
    };

    return (
        <div className="table-section-wrapper">
            <div className="table-container-dark">
                <div className="table-title-bar">
                    <h3 className="table-title" style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Tabla de Ventas</h3>

                    <div style={{ position: 'relative' }} ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                padding: '6px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                borderBottom: isDropdownOpen ? '1px solid white' : '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {rangeLabels[range] || 'Seleccionar Rango'}
                            <ChevronDown
                                size={16}
                                style={{
                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.3s ease'
                                }}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: '#1A1A1A',
                                border: '1px solid rgba(249, 115, 22, 0.3)',
                                borderRadius: '16px',
                                width: '200px',
                                overflow: 'hidden',
                                zIndex: 1000,
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                animation: 'dropdownFadeIn 0.2s ease-out'
                            }}>
                                {Object.entries(rangeLabels).map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => {
                                            onRangeChange(value);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            background: range === value ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                                            border: 'none',
                                            color: range === value ? '#F97316' : 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '0.85rem',
                                            fontWeight: range === value ? 800 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                                            e.currentTarget.style.color = '#F97316';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = range === value ? 'rgba(249, 115, 22, 0.1)' : 'transparent';
                                            e.currentTarget.style.color = range === value ? '#F97316' : 'rgba(255, 255, 255, 0.8)';
                                        }}
                                    >
                                        {label}
                                        {range === value && (
                                            <div style={{ width: '6px', height: '6px', background: '#F97316', borderRadius: '50%' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes dropdownFadeIn {
                        from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                <div className="table-header-row">
                    <div className="th-cell">Cliente</div>
                    <div className="th-cell">Fecha</div>
                    <div className="th-cell">Pago</div>
                    <div className="th-cell consumption-cell">Consumo</div>
                    <div className="th-cell user-header">Usuario</div>
                </div>

                <div className="table-body-scroll">
                    {sales.length > 0 ? (
                        sales.map((sale) => (
                            <div key={sale.id} className="table-row">
                                <div className="td-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        onClick={() => handleDelete(sale.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#EF4444',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.7,
                                            transition: 'opacity 0.2s, transform 0.2s',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'scale(1)'; }}
                                        title="Eliminar venta permanentemente"
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                    <div>
                                        <div className="customer-name" style={{ fontWeight: 600 }}>{sale.customerName}</div>
                                        <div className="ticket-number">#{sale.ticketNumber}</div>
                                    </div>
                                </div>
                                <div className="td-cell date-cell">
                                    <div className="date-text">{new Date(sale.closedAt).toLocaleDateString()}</div>
                                    <div className="time-text">{new Date(sale.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className="td-cell">
                                    <span className="badge-payment">
                                        <span className="long-method">{displayPayment(sale.paymentMethod)}</span>
                                        <span className="short-method">{getShortPayment(sale.paymentMethod)}</span>
                                    </span>
                                </div>
                                <div className="td-cell consumption-cell">
                                    {sale.items.map(item => {
                                        const qty = item.quantity || 1;
                                        const name = item.beerType || item.name;
                                        const emission = item.emission || 'Unidad';
                                        const subtype = item.subtype || 'Botella';
                                        const formatStr = subtype !== 'Botella' ? `[${subtype}] ` : '';
                                        return `${qty} ${name} ${formatStr}(${emission})`;
                                    }).join(', ')}
                                </div>
                                <div className="td-cell user-cell">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={14} className="text-secondary" />
                                        <span className="user-name">{sale.createdBy || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No hay ventas registradas hoy.
                        </div>
                    )}
                </div>

                <div className="table-footer">
                    <div className="footer-info">
                        <AlertCircle size={16} style={{ color: '#fb923c' }} />
                        <span>Descarga el Excel para ver un reporte completo</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onExport}
                            style={{
                                padding: '0.6rem 1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={18} />
                            <span>Excel</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
