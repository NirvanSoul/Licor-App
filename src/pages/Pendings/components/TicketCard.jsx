import React from 'react';
import { ChevronDown, ChevronUp, Pencil, Beer } from 'lucide-react';
import TicketGrid from '../../../components/TicketGrid'; // Adjust path depending on file location

export default function TicketCard({
    order,
    isExpanded,
    onToggle,
    onRename,
    currencySymbol,
    calculateOrderTotal,
    getUnitsPerEmission,
    onCloseTicket,
    onAddItem
}) {
    const isOpenTab = order.items.some(i => i.emission === 'Libre');
    const isComplete = order.items.every(item => {
        if (item.emission === 'Libre') return true;
        const targetUnits = getUnitsPerEmission(item.emission, item.subtype) * (item.quantity || 1);
        const filledUnits = (item.slots || []).filter(s => s !== null).length;
        return filledUnits >= targetUnits;
    });

    const { totalBs, totalUsd, details } = calculateOrderTotal(order.items, order.type);

    return (
        <div className={`order-card ${isExpanded ? 'expanded' : ''}`}>
            <div className="order-header" onClick={() => onToggle(order.id)}>
                <div className="order-title-group">
                    <div className="collapse-icon">
                        {isExpanded ? <ChevronUp size={20} className="text-secondary" /> : <ChevronDown size={20} className="text-secondary" />}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 className="customer-name">{order.customerName}</h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename(order);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                            >
                                <Pencil size={14} />
                            </button>
                            {isOpenTab && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    fontWeight: '700'
                                }}>
                                    Carta Abierta
                                </span>
                            )}
                        </div>
                        <span className="ticket-number">#{order.ticketNumber}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                    <span style={{ color: 'white', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ color: 'white', fontSize: '0.7rem', fontFamily: 'Poppins, sans-serif', fontWeight: 400, marginTop: '2px' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="order-items-list">
                        {order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                                <div key={idx}>
                                    <TicketGrid
                                        orderId={order.id}
                                        item={item}
                                        itemIndex={idx}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: '2rem 1rem',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-app)',
                                borderRadius: '12px',
                                border: '1px dashed var(--accent-light)',
                                marginBottom: '1rem'
                            }}>
                                <Beer size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Carta abierta sin productos</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Usa "Añadir Producto" para comenzar</p>
                            </div>
                        )}

                        <button
                            className="action-btn"
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                                background: 'transparent',
                                border: '1px dashed var(--accent-light)',
                                color: 'var(--text-primary)',
                                justifyContent: 'center',
                                padding: '0.75rem'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddItem(order);
                            }}
                        >
                            + Agregar Producto
                        </button>
                    </div>

                    <div className="order-footer">
                        <div className="total-row">
                            <span className="label">Total Estimado</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {(details || []).map((d, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(52, 199, 89, 0.15)',
                                            color: '#34c759',
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontWeight: 600
                                        }}>
                                            {d}
                                        </span>
                                    ))}
                                </div>
                                <span className="amount">{currencySymbol}{totalUsd.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="actions-row" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                            <button
                                className={`action-btn close-ticket-btn ${!isComplete ? 'disabled' : ''}`}
                                disabled={!isComplete}
                                onClick={() => {
                                    onCloseTicket(order.id, totalUsd, totalBs);
                                }}
                                style={{
                                    flex: 1,
                                    opacity: isComplete ? 1 : 0.5,
                                    cursor: isComplete ? 'pointer' : 'not-allowed',
                                    filter: isComplete ? 'none' : 'grayscale(0.5)'
                                }}
                            >
                                {isComplete ? 'Cerrar Ticket' : 'Llenar Ticket'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
