import React, { useState, useEffect } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useProduct } from '../../context/ProductContext';
import { useNotification } from '../../context/NotificationContext';
import { Store, History, Clock } from 'lucide-react';
import './PendingPage.css';

import PendingHeader from './components/PendingHeader';
import TicketCard from './components/TicketCard';

// Modals
import OpenTicketModal from './modals/OpenTicketModal';
import RenameModal from './modals/RenameModal';
import AddItemModal from './modals/AddItemModal';
import WasteModal from './modals/WasteModal';
import CloseTicketModal from './modals/CloseTicketModal';
import SuccessModal from './modals/SuccessModal';

export default function PendingPage() {
    const { pendingOrders, addItemToOrder, closeOrder, createOrder, calculateOrderTotal, updateOrderName } = useOrder();
    const { beerTypes, getPrice, currencySymbol, reportWaste, mainCurrency, currentRate, getUnitsPerEmission } = useProduct();
    const { showNotification } = useNotification();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrders, setExpandedOrders] = useState({});

    // Modal States
    const [showOpenTabModal, setShowOpenTabModal] = useState(false);
    const [showWasteModal, setShowWasteModal] = useState(false);

    const [renamingOrder, setRenamingOrder] = useState(null);
    const [selectedOrderForAdd, setSelectedOrderForAdd] = useState(null);

    // Closing State
    const [closingOrderData, setClosingOrderData] = useState(null); // { id, totalUsd, totalBs }
    const [closedOrderResult, setClosedOrderResult] = useState(null); // { ticketNumber, totalBs, totalUsd, customerName } (Success)

    // Listen for Menu Reset
    useEffect(() => {
        const handleResetFlow = (e) => {
            if (e.detail === '/pendientes') {
                setSearchTerm('');
                setShowOpenTabModal(false);
                setShowWasteModal(false);
                setRenamingOrder(null);
                setSelectedOrderForAdd(null);
                setClosingOrderData(null);
                setClosedOrderResult(null);
                setExpandedOrders({});
            }
        };
        window.addEventListener('reset-flow', handleResetFlow);
        return () => window.removeEventListener('reset-flow', handleResetFlow);
    }, []);

    // Notify layout when modals open/close
    useEffect(() => {
        if (showOpenTabModal || showWasteModal || renamingOrder || selectedOrderForAdd || closingOrderData || closedOrderResult) {
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
    }, [showOpenTabModal, showWasteModal, renamingOrder, selectedOrderForAdd, closingOrderData, closedOrderResult]);

    // --- LOGIC ---

    const toggleOrder = (id) => {
        setExpandedOrders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Filter Logic
    const openOrders = pendingOrders.filter(o => o.status === 'OPEN');

    const filteredOrders = openOrders.filter(order => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase().trim();
        const name = (order.customerName || '').toLowerCase();
        const ticket = (order.ticketNumber || '').toString();
        return name.includes(term) || ticket.includes(term);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = [];
    const previousOrders = [];

    filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt || Date.now());
        orderDate.setHours(0, 0, 0, 0);
        if (orderDate.getTime() === today.getTime()) {
            todaysOrders.push(order);
        } else {
            previousOrders.push(order);
        }
    });

    // --- HANDLERS ---

    const handleOpenTicket = (name) => {
        const fallbackName = name.trim() || 'Anónimo';
        createOrder(fallbackName, [], 'Local', null, '');
        setShowOpenTabModal(false);
        if (showNotification) showNotification('Carta abierta exitosamente', 'success');
    };

    const handleWasteReport = async (beer, subtype, qty) => {
        await reportWaste(beer, subtype, qty);
        setShowWasteModal(false);
    };

    const handleRename = async (id, newName) => {
        await updateOrderName(id, newName);
        setRenamingOrder(null);
    };

    const handleCloseTicket = async (paymentMethod, reference) => {
        if (!closingOrderData) return;

        await closeOrder(closingOrderData.id, paymentMethod, reference);

        // Prepare success modal
        const order = pendingOrders.find(o => o.id === closingOrderData.id);
        if (order) {
            setClosedOrderResult({
                ticketNumber: order.ticketNumber,
                totalBs: closingOrderData.totalBs,
                totalUsd: closingOrderData.totalUsd,
                customerName: order.customerName
            });
        }
        setClosingOrderData(null);
    };

    // --- RENDER HELPERS ---

    const renderList = (orders) => (
        orders.map(order => (
            <TicketCard
                key={order.id}
                order={order}
                isExpanded={expandedOrders[order.id]}
                onToggle={toggleOrder}
                onRename={(o) => setRenamingOrder(o)}
                currencySymbol={currencySymbol}
                calculateOrderTotal={calculateOrderTotal}
                getUnitsPerEmission={getUnitsPerEmission}
                onCloseTicket={(id, totalUsd, totalBs) => setClosingOrderData({ id, totalUsd, totalBs })}
                onAddItem={(o) => setSelectedOrderForAdd(o)}
            />
        ))
    );

    return (
        <div className="page-container">
            <PendingHeader
                openOrdersCount={openOrders.length}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onOpenTicket={() => setShowOpenTabModal(true)}
                onOpenWaste={() => setShowWasteModal(true)}
            />

            <div className="orders-content">
                {todaysOrders.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            <Store size={20} className="text-success" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tickets Activos (Hoy)</h2>
                        </div>
                        <div className="orders-grid">
                            {renderList(todaysOrders)}
                        </div>
                    </div>
                )}

                {previousOrders.length > 0 && (
                    <div className="previous-orders-section" style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#F59E0B' }}>
                            <History size={20} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tickets Pendientes</h2>
                        </div>
                        <div className="orders-grid">
                            {renderList(previousOrders)}
                        </div>
                        <hr style={{ margin: '2rem 0', borderColor: 'var(--accent-light)', opacity: 0.3 }} />
                    </div>
                )}

                {todaysOrders.length === 0 && previousOrders.length === 0 && (
                    <div className="empty-state">
                        <Clock size={48} className="text-muted mb-4" />
                        <p className="text-secondary">
                            {searchTerm ? 'No se encontraron tickets' : 'No hay cuentas abiertas hoy'}
                        </p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {showOpenTabModal && (
                <OpenTicketModal
                    onClose={() => setShowOpenTabModal(false)}
                    onConfirm={handleOpenTicket}
                />
            )}

            {showWasteModal && (
                <WasteModal
                    beerTypes={beerTypes}
                    onClose={() => setShowWasteModal(false)}
                    onConfirm={handleWasteReport}
                />
            )}

            {renamingOrder && (
                <RenameModal
                    order={renamingOrder}
                    onClose={() => setRenamingOrder(null)}
                    onRename={handleRename}
                />
            )}




            {selectedOrderForAdd && (
                <AddItemModal
                    order={selectedOrderForAdd}
                    beerTypes={beerTypes}
                    currencySymbol={currencySymbol}
                    getPrice={getPrice}
                    onAdd={(id, item) => {
                        addItemToOrder(id, item);
                        // setSelectedOrderForAdd(null); // Optional: keep open
                    }}
                    onClose={() => setSelectedOrderForAdd(null)}
                />
            )}

            {closingOrderData && (
                <CloseTicketModal
                    order={pendingOrders.find(o => o.id === closingOrderData.id) || {}}
                    totalUsd={closingOrderData.totalUsd}
                    totalBs={closingOrderData.totalBs}
                    currentRate={currentRate}
                    mainCurrency={mainCurrency}
                    onClose={() => setClosingOrderData(null)}
                    onConfirm={handleCloseTicket}
                />
            )}

            <SuccessModal
                closedOrderInfo={closedOrderResult}
                onClose={() => setClosedOrderResult(null)}
            />

        </div>
    );
}
// Note: I will need to verify where `setSelectedOrder` was called to connect `TicketCard` properly.
// I'll add a check step for that.
