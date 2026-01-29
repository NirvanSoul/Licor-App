import React from 'react';
import { User, Download, Maximize2, AlertCircle } from 'lucide-react';

export default function TransactionList({ sales, currencySymbol, getShortPayment, onExport, onShare }) {

    // Helper needed for the table view
    const displayPayment = (method) => {
        if (!method || method === 'Cash') return 'Efectivo';
        if (typeof method === 'string' && method.startsWith('Pre-Pagado - ')) return method.replace('Pre-Pagado - ', '');
        return String(method);
    };

    return (
        <div className="table-section-wrapper">
            <div className="table-container-dark">
                <div className="table-title-bar">
                    <h3 className="table-title" style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Tabla de Ventas</h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 600 }}>Últimos 60 Días</span>
                </div>

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
                                <div className="td-cell">
                                    <div className="customer-name" style={{ fontWeight: 600 }}>{sale.customerName}</div>
                                    <div className="ticket-number">#{sale.ticketNumber}</div>
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
