import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { useProduct } from '../context/ProductContext';
import { Clock, Plus, Beer, MoreVertical, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import TicketGrid from '../components/TicketGrid';
import './PendingPage.css'; // We will create this

export default function PendingPage() {
    const { pendingOrders, addItemToOrder, closeOrder } = useOrder();
    const { getBsPrice, beerTypes } = useProduct();
    const [selectedOrder, setSelectedOrder] = useState(null); // For "Add Item" modal

    // Collapsible State (Store expanded IDs)
    // Default: All Expanded? Or Start Empty? 
    // Let's default to Empty or tracking clicks. 
    // User asked for "collapsable", usually implies initially closed or togglable.
    const [expandedOrders, setExpandedOrders] = useState({});

    const toggleOrder = (id) => {
        setExpandedOrders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Filter only OPEN orders
    const openOrders = pendingOrders.filter(o => o.status === 'OPEN');

    const calculateOrderTotalUsd = (items) => {
        return items.reduce((acc, item) => {
            // Price is unit price * quantity
            // We need to ensure item.price is stored or calculate it?
            // OrderContext stores items with price.
            // Let's assume item has price. If not, use getPrice?
            // Implementation Plan said items have price.
            // Let's check SalesPage logic... we added "localItems".
            // SalesPage cartItems have: beerType, emission, subtype... they DO NOT have 'price' property explicitly set!
            // Wait, calculateTotal in SalesPage uses getPrice on the fly.
            // So items in OrderContext likely lack 'price' if we just pushed cartItem.
            // We should fix SalesPage to include price OR calculate it here.
            // Robustness: Calculate here using Context.

            // Actually, prices might change! A pending ticket should arguably lock the price?
            // OR should it reflect current prices?
            // Usually bars update prices daily. If I opened a tab yesterday, well...
            // Let's assume we re-calculate for now to keep it simple, or better yet,
            // we should have saved the price at moment of sale.
            // Checking SalesPage... "const localItems = cartItems..."
            // Cart items don't have price. 
            // FIX: We will calculate it here for display.

            return acc + (item.price || 0) * item.quantity;
        }, 0);
    };

    // Calculate USD total using the helper from context (re-calc)
    // To be safe, let's inject price if missing, or use getPrice
    const { getPrice } = useProduct();

    const getOrderTotal = (items) => {
        return items.reduce((acc, item) => {
            const p = item.price || getPrice(item.beerType, item.emission, item.subtype, 'local');
            return acc + (p * item.quantity);
        }, 0);
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="text-2xl font-bold text-gray-800">Cuentas Abiertas</h1>
                <div className="header-badges">
                    <span className="badge-active">{openOrders.length} Activas</span>
                </div>
            </header>

            <div className="orders-grid">
                {openOrders.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay cuentas abiertas</p>
                    </div>
                ) : (
                    openOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <div
                                className="order-header"
                                onClick={() => toggleOrder(order.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="collapse-icon">
                                        {expandedOrders[order.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="customer-name">{order.customerName}</h3>
                                        <span className="ticket-number">#{order.ticketNumber}</span>
                                    </div>
                                </div>
                                <span className="time-badge">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Collapsible Content */}
                            {expandedOrders[order.id] && (
                                <>
                                    <div className="order-items-list">
                                        {order.items.map((item, idx) => (
                                            <div key={idx}>
                                                {/* Use TicketGrid for all items in Local orders, or just crates? 
                                                    User wants "big rectangle", implying grid for everything in this view.
                                                */}
                                                <TicketGrid
                                                    orderId={order.id}
                                                    item={item}
                                                    itemIndex={idx}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-footer">
                                        <div className="total-row">
                                            <span className="label">Total Estimado</span>
                                            <span className="amount">${getOrderTotal(order.items).toFixed(2)}</span>
                                        </div>
                                        <div className="actions-row">
                                            <button className="action-btn add" onClick={() => setSelectedOrder(order)}>
                                                <Plus size={18} /> Agregar
                                            </button>
                                            <button className="action-btn pay" onClick={() => closeOrder(order.id, 'Cash')}>
                                                Cobrar
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Quick Add Modal */}
            {selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 className="text-xl font-bold" style={{ fontSize: '1.25rem', color: '#111827' }}>Agregar Producto</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Ciente: {selectedOrder.customerName}</p>
                            </div>
                            <button className="icon-btn" onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6B7280" />
                            </button>
                        </div>

                        <div className="quick-add-form">
                            <h4 style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem', fontWeight: 600 }}>Selecciona Cerveza (1 Unidad - Botella)</h4>

                            <div className="selector-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: '0.75rem'
                            }}>
                                {beerTypes.map(beer => (
                                    <button
                                        key={beer}
                                        className="option-btn"
                                        onClick={() => {
                                            addItemToOrder(selectedOrder.id, {
                                                beerType: beer,
                                                subtype: 'Botella',
                                                emission: 'Unidad',
                                                quantity: 1,
                                                price: getPrice(beer, 'Unidad', 'Botella', 'local'),
                                                consumptionMode: 'Local'
                                            });
                                            // Optional: Close modal or keep open for more?
                                            // Let's keep open for rapid entry but show feedback?
                                            // Ideally toast. For now, let's flicker a border or something?
                                            // Simpler: Just close.
                                            setSelectedOrder(null);
                                        }}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB',
                                            background: 'white',
                                            fontWeight: 600,
                                            color: '#374151',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(249, 115, 22, 0.1)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                                    >
                                        {beer}
                                    </button>
                                ))
                                }</div>
                            <p className="text-sm text-center" style={{ marginTop: '1.5rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                                Se agregará 1 Botella (Local) al ticket existente.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
