import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added missing import
import AccordionSection from '../components/AccordionSection';
import ContainerSelector from '../components/ContainerSelector'; // Added import
import { Trash2, ShoppingBag, Store, User, Hash, CheckCircle, PlusCircle, X } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { useOrder } from '../context/OrderContext';
import './SalesPage.css';

export default function SalesPage() {
    const navigate = useNavigate();
    const { beerTypes, emissionOptions, getPrice, getBsPrice, getUsdPrice, subtypes, deductStock } = useProduct(); // Context Data
    const { createOrder } = useOrder();

    const [openSection, setOpenSection] = useState('consumption');

    // Listen for Menu Reset
    useEffect(() => {
        const handleResetFlow = (e) => {
            if (e.detail === '/vender') {
                setShowResetModal(true);
            }
        };

        window.addEventListener('reset-flow', handleResetFlow);
        return () => window.removeEventListener('reset-flow', handleResetFlow);
    }, []);

    const [showResetModal, setShowResetModal] = useState(false);

    const confirmReset = () => {
        setCartItems([]);
        setOrderState({
            consumptionMode: null,
            emission: null,
            subtype: 'Botella',
            beerVariety: 'Normal',
            beerType: null,
            quantity: 1
        });
        setOpenSection('consumption');
        setTicketStep(0);
        setCustomerName('');
        setShowResetModal(false);
    };

    const [orderState, setOrderState] = useState({
        consumptionMode: null,
        emission: null,
        subtype: 'Botella',
        beerVariety: 'Normal',
        beerType: null,
        quantity: 1,
    });

    // ...

    const [cartItems, setCartItems] = useState([]); // List of confirmed items

    const calculateTotal = () => {
        let total = 0;

        // 1. Sum Cart Items (Use their OWN mode)
        cartItems.forEach(item => {
            const mode = item.consumptionMode === 'Local' ? 'local' : 'standard';
            const price = getBsPrice(item.beerType, item.emission, item.subtype, mode);
            total += price * item.quantity;
        });

        // 2. Add Current Selection (Use CURRENT global mode)
        if (orderState.beerType && orderState.emission) {
            const currentMode = orderState.consumptionMode === 'Local' ? 'local' : 'standard';
            const currentPrice = getBsPrice(orderState.beerType, orderState.emission, orderState.subtype, currentMode);
            total += currentPrice * orderState.quantity;
        }

        return total;
    };

    const calculateTotalUsd = () => {
        let total = 0;

        // 1. Sum Cart Items
        cartItems.forEach(item => {
            const mode = item.consumptionMode === 'Local' ? 'local' : 'standard';
            const price = getPrice(item.beerType, item.emission, item.subtype, mode);
            total += price * item.quantity;
        });

        // 2. Add Current Selection
        if (orderState.beerType && orderState.emission) {
            const currentMode = orderState.consumptionMode === 'Local' ? 'local' : 'standard';
            const currentPrice = getPrice(orderState.beerType, orderState.emission, orderState.subtype, currentMode);
            total += currentPrice * orderState.quantity;
        }

        return total;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const formatUsd = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const currentTotal = calculateTotal();

    const [ticketStep, setTicketStep] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [ticketNumber, setTicketNumber] = useState(null);
    const [ticketDate, setTicketDate] = useState('');

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentReference, setPaymentReference] = useState('');
    const paymentMethods = ['Pago Movil', 'Efectivo', 'Punto'];

    const [showModal, setShowModal] = useState(false);

    // Handlers
    const handleConsumptionSelect = (mode) => {
        setOrderState(prev => ({ ...prev, consumptionMode: mode }));
        setOpenSection('emission');
    };

    const handleEmissionSelect = (option) => {
        setOrderState(prev => ({ ...prev, emission: option }));
        setOpenSection('beer');
    };

    const handleBeerSelect = (option) => {
        setOrderState(prev => ({ ...prev, beerType: option }));
        setOpenSection(null);
    };

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    // --- CART ACTIONS ---
    const handleAddToCart = () => {
        if (!isSelectionComplete()) return;

        const newItem = {
            id: Date.now(),
            ...orderState
        };
        // Remove global mode from item to avoid confusion (managed globally)
        // But we keep it in the object for Calculate logic if needed, 
        // essentially snapshotting the state.

        setCartItems(prev => [...prev, newItem]);

        // Reset Selection AND Consumption Mode to start fresh
        setOrderState(prev => ({
            ...prev,
            consumptionMode: null, // Force re-selection
            emission: null,
            subtype: 'Botella',
            beerVariety: 'Normal',
            beerType: null,
            quantity: 1
        }));
        setOpenSection('consumption'); // Go back to start
    };

    const handleRemoveFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const handleInitialCreateClick = () => {
        // Validation: Must have at least 1 item (Cart or Current)
        if (cartItems.length === 0 && !isSelectionComplete()) {
            return;
        }

        // Auto-add current selection to cart if exists
        if (isSelectionComplete()) {
            handleAddToCart();
        }

        // Generate Ticket Information (Needed for Local, tracked for all)
        const randomTicket = Math.floor(1000 + Math.random() * 9000);
        setTicketNumber(randomTicket);

        const now = new Date();
        const formatter = new Intl.DateTimeFormat('es-VE', {
            timeZone: 'America/Caracas',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        setTicketDate(formatter.format(now));

        // Always proceed to Payment Step (Unified Flow)
        setTicketStep(2);
    };

    const handleFinalConfirm = () => {
        const hasLocal = cartItems.some(i => i.consumptionMode === 'Local');

        // Validation Logic for Unified Step 2
        if (ticketStep === 2) {
            // Payment Validation (Mandatory for All)
            if (!paymentMethod) {
                alert("Por favor selecciona un método de pago.");
                return;
            }
            if (paymentMethod === 'Pago Movil' && !paymentReference.trim()) {
                alert("Por favor ingresa el número de referencia.");
                return;
            }

            // Customer Name Validation (Mandatory for Local)
            if (hasLocal) {
                if (!customerName.trim()) {
                    alert("Por favor ingresa el nombre del cliente.");
                    return;
                }
            }
        }

        // --- SPLIT LOGIC ---
        // 1. Filter Items
        const localItems = cartItems.filter(i => i.consumptionMode === 'Local');

        // 2. Create Pending Ticket (if any local items)
        if (localItems.length > 0) {
            createOrder(customerName, localItems, 'Local');
        }

        // 3. Process Payment & Deduct Inventory
        cartItems.forEach(item => {
            deductStock(item.beerType, item.emission, item.subtype, item.quantity);
        });

        // 4. Show Success
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        // Reset Everything
        setCartItems([]);
        setOrderState({
            consumptionMode: null,
            emission: null,
            subtype: 'Botella',
            beerVariety: 'Normal',
            beerType: null,
            quantity: 1
        });
        setCustomerName('');
        setPaymentMethod(null);
        setPaymentReference('');
        setTicketStep(0);
        setOpenSection('consumption');
    };

    const navigateToPending = () => {
        navigate('/pendientes');
        closeModal();
    };

    const handleClearBill = () => {
        // Reset Everything immediately (No confirmation)
        setCartItems([]);
        setOrderState({
            consumptionMode: null,
            emission: null,
            subtype: 'Botella',
            beerVariety: 'Normal',
            beerType: null,
            quantity: 1
        });
        setOpenSection('consumption');
        setTicketStep(0);
        setCustomerName('');
    };

    const increaseQuantity = () => { setOrderState(prev => ({ ...prev, quantity: prev.quantity + 1 })); };
    const decreaseQuantity = () => { setOrderState(prev => ({ ...prev, quantity: prev.quantity > 1 ? prev.quantity - 1 : 1 })); };

    // Toggles


    const VarietyToggle = () => (
        <div className="toggle-switch">
            <button
                className={`toggle-option ${orderState.beerVariety === 'Normal' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOrderState(prev => ({ ...prev, beerVariety: 'Normal' })); }}
            >
                Normal
            </button>
            <button
                className={`toggle-option ${orderState.beerVariety === 'Variado' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOrderState(prev => ({ ...prev, beerVariety: 'Variado' })); }}
            >
                Variado
            </button>
        </div>
    );

    // Helpers
    const isSelectionComplete = () => {
        return orderState.consumptionMode && orderState.emission && orderState.beerType;
    };

    const getButtonText = () => {
        const hasSelection = isSelectionComplete();
        const hasCart = cartItems.length > 0;

        if (ticketStep === 0) {
            if (!hasSelection && !hasCart) return 'Selecciona Productos';
            // Valid State: Always 'Pagar Pedido' to start the checkout flow
            return 'Pagar Pedido';
        }
        if (ticketStep === 2) return 'Crear Ticket';
        return '';
    };

    // Helper to Get Final Product List for Display
    const getDisplayItems = () => {
        const items = [...cartItems];
        if (isSelectionComplete() && ticketStep === 0) {
            // Show current selection in preview (summary row)
            // We don't push it here, just render logic handles it
        }
        // If ticketStep > 0, we effectively "lock" the cart.
        // We should treat currentSelection as "Added" for the view if we are in ticket mode.
        return items;
    };

    return (
        <div className="sales-container-v2">

            {/* 1. Modo de Consumo */}
            {/* Allow changing mode for the next item even if cart is not empty */}
            <AccordionSection
                title="Modo de Consumo"
                isOpen={openSection === 'consumption'}
                onToggle={() => toggleSection('consumption')}
                selectionLabel={orderState.consumptionMode}
            >
                <div className="options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <button
                        className={`option-btn ${orderState.consumptionMode === 'Local' ? 'selected' : ''}`}
                        onClick={() => handleConsumptionSelect('Local')}
                        style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Store size={32} />
                        <span>Local</span>
                    </button>
                    <button
                        className={`option-btn ${orderState.consumptionMode === 'Para Llevar' ? 'selected' : ''}`}
                        onClick={() => handleConsumptionSelect('Para Llevar')}
                        style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <ShoppingBag size={32} />
                        <span>Para Llevar</span>
                    </button>
                </div>
            </AccordionSection>

            {/* 2. Forma de Emisión */}
            <AccordionSection
                title="Forma de Emisión"
                isOpen={openSection === 'emission'}
                onToggle={() => toggleSection('emission')}
                selectionLabel={orderState.emission ? `${orderState.emission} (${orderState.subtype})` : null}
                headerAction={
                    <div onClick={(e) => e.stopPropagation()}>
                        <ContainerSelector
                            value={orderState.subtype}
                            onChange={(val) => setOrderState(prev => ({ ...prev, subtype: val }))}
                        />
                    </div>
                }
            >
                <div className="options-grid">
                    {emissionOptions.map(opt => (
                        <button
                            key={opt}
                            className={`option-btn ${orderState.emission === opt ? 'selected' : ''}`}
                            onClick={() => handleEmissionSelect(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </AccordionSection>

            {/* 3. Tipo de Cerveza */}
            <AccordionSection
                title="Tipo de Cerveza"
                isOpen={openSection === 'beer'}
                onToggle={() => toggleSection('beer')}
                selectionLabel={orderState.beerType ? `${orderState.beerType} (${orderState.beerVariety})` : null}
                headerAction={<VarietyToggle />}
            >
                <div className="options-grid">
                    {beerTypes.map(opt => (
                        <button
                            key={opt}
                            className={`option-btn ${orderState.beerType === opt ? 'selected' : ''}`}
                            onClick={() => handleBeerSelect(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                {orderState.beerVariety === 'Variado' && (
                    <p className="text-secondary text-sm margin-top-sm" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        * Selecciona la primera cerveza. El resto se agregará en Pendientes.
                    </p>
                )}
            </AccordionSection>

            {/* Summary / Cart Card */}
            <div className="order-summary-card">

                {/* Cart List */}
                {cartItems.length > 0 && (
                    <div className="cart-list">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item-row">
                                <span className="cart-item-info">
                                    <b>{item.quantity}x</b> {item.emission} {item.beerType}
                                    <span style={{ fontSize: '0.8rem', color: item.consumptionMode === 'Local' ? '#FF9C57' : '#FF9C57', marginLeft: '6px', fontWeight: 500 }}>
                                        ({item.consumptionMode === 'Local' ? 'Local' : 'Llevar'})
                                    </span>
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{formatCurrency(getBsPrice(item.beerType, item.emission, item.subtype, item.consumptionMode === 'Local' ? 'local' : 'standard') * item.quantity)} Bs</span>
                                    {!ticketStep && (
                                        <button className="cart-delete-btn" onClick={() => handleRemoveFromCart(item.id)}>
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Current Active Selection (Builder) */}
                {/* Only verify if we are in Step 0 OR if we are just showing the final list? */}
                {/* Logic: If Step > 0, we treat Current as "Implicitly Added" for simple single-item flow, 
                    OR we force user to add it? 
                    Let's allow "Current Selection" to be visible as the "Active" item to add.
                */}

                {isSelectionComplete() && ticketStep === 0 && (
                    <>
                        <div className="summary-row">
                            <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={decreaseQuantity} className="qty-btn" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ccc', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                <span className="summary-item"><b>{orderState.quantity}x</b></span>
                                <button onClick={increaseQuantity} className="qty-btn" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ccc', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                <span className="summary-item" style={{ marginLeft: '8px' }}>
                                    {orderState.beerType} ({orderState.emission})
                                </span>
                            </div>
                            <span className="summary-price">
                                {orderState.beerType && orderState.emission ?
                                    formatCurrency(getBsPrice(orderState.beerType, orderState.emission, orderState.subtype, orderState.consumptionMode === 'Local' ? 'local' : 'standard') * orderState.quantity)
                                    : '0'} Bs
                            </span>
                        </div>

                        {orderState.beerVariety === 'Variado' && (
                            <div className="summary-row" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <span>+ Variado (Pendiente)</span>
                            </div>
                        )}

                        <button className="add-item-btn" onClick={handleAddToCart}>
                            <PlusCircle size={18} />
                            Agregar otro producto
                        </button>
                    </>
                )}



                {(cartItems.length > 0 || isSelectionComplete()) && (
                    <div className="summary-actions">
                        <button className="delete-action" onClick={handleClearBill}>
                            <Trash2 size={16} /> {ticketStep > 0 ? 'Cancelar Ticket' : (cartItems.length > 0 ? 'Cancelar Pedido' : 'Borrar Selección')}
                        </button>
                    </div>
                )}

                <div className="summary-total-container" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    {orderState.consumptionMode === 'Local' && (
                        <span style={{ fontSize: '0.7rem', color: '#1A1A1A', fontWeight: 600, marginBottom: '-2px' }}>Precio Local</span>
                    )}

                    <div className="summary-total">
                        {formatCurrency(currentTotal)} Bs
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: 'black',
                        fontWeight: 500,
                        fontStyle: 'italic',
                        fontFamily: 'Poppins, sans-serif',
                        marginTop: '-5px'
                    }}>
                        {formatUsd(calculateTotalUsd())}
                    </div>
                </div>

                {/* Step 2: Payment & Info (Unified) */}
                {ticketStep === 2 && (
                    <div className="ticket-details-form">

                        {/* Show Ticket Info only if there are Local items? Or always? */}
                        {/* Keep it consistent */}
                        <div className="ticket-info-row">
                            <span className="ticket-hash-display"># {ticketNumber}</span>
                            <span className="ticket-date">{ticketDate}</span>
                        </div>

                        {/* Customer Name Input - Show if Local items exist */}
                        {cartItems.some(i => i.consumptionMode === 'Local') && (
                            <div className="input-group-large" style={{ marginBottom: '1rem' }}>
                                <User size={36} strokeWidth={2.5} className="input-icon-external" />
                                <input
                                    type="text"
                                    placeholder="Nombre del Cliente"
                                    className="ticket-input-large"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <h4 className="payment-section-title">Método de Pago</h4>
                        <div className="payment-methods-grid">
                            {paymentMethods.map(method => (
                                <button
                                    key={method}
                                    className={`option-btn ${paymentMethod === method ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod(method)}
                                    style={{ fontSize: '0.8rem', padding: '0.75rem 0.25rem' }}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'Pago Movil' && (
                            <div className="input-group-large">
                                <Hash size={36} strokeWidth={2.5} className="input-icon-external" />
                                <input
                                    type="text"
                                    placeholder="Nro Referencia (Solo números)"
                                    className="ticket-input-large"
                                    value={paymentReference}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) {
                                            setPaymentReference(val);
                                        }
                                    }}
                                    inputMode="numeric"
                                />
                            </div>
                        )}
                    </div>
                )}

                <button
                    className={`create-ticket-btn ${ticketStep > 0 ? 'confirm-mode' : ''}`}
                    onClick={ticketStep === 0 ? handleInitialCreateClick : handleFinalConfirm}
                    disabled={!isSelectionComplete() && cartItems.length === 0}
                    style={{ opacity: (!isSelectionComplete() && cartItems.length === 0) ? 0.5 : 1, cursor: (!isSelectionComplete() && cartItems.length === 0) ? 'not-allowed' : 'pointer' }}
                >
                    {getButtonText()}
                </button>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                            <defs>
                                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#FF9C57" />
                                    <stop offset="100%" stopColor="#E65900" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <CheckCircle className="modal-icon" style={{ stroke: 'url(#icon-gradient)' }} />
                        <h3 className="modal-title">
                            {cartItems.some(i => i.consumptionMode === 'Local') && cartItems.some(i => i.consumptionMode === 'Para Llevar') ? (
                                <span>Pedido Mixto Pagado.<br />Local &rarr; Pendientes.</span>
                            ) : (
                                cartItems.some(i => i.consumptionMode === 'Local') ?
                                    <>Pedido Pagado. <br /><span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'normal' }}>Agregado a <span className="modal-link" onClick={navigateToPending}>Pendientes</span></span></> :
                                    <>¡Pedido Pagado Exitosamente!</>
                            )}
                        </h3>
                        <button className="modal-close-btn" onClick={closeModal}>
                            Cerrar y Nuevo Pedido
                        </button>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {/* Reusing existing gradient definition but we need to ensure it renders if the other modal is not open. 
                            Actually the other modal code defines the gradient in its SVG. 
                            We should define the gradient here too or move it to a shared place?
                            The other modal only renders if showModal is true. So we definitely need to define the gradient here.
                        */}
                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                            <defs>
                                <linearGradient id="reset-icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#FF9C57" />
                                    <stop offset="100%" stopColor="#E65900" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Custom Question Marks Icon */}
                        <div style={{
                            background: 'rgba(255, 156, 87, 0.15)',
                            width: '80px', height: '80px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem auto',
                            boxShadow: '0 0 0 8px rgba(255, 156, 87, 0.05)'
                        }}>
                            <span style={{ fontSize: '3rem', fontWeight: 600, background: 'linear-gradient(180deg, #FF9C57 0%, #E65900 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>?</span>
                        </div>

                        <h3 className="modal-title" style={{ marginBottom: '2rem' }}>
                            ¿Seguro que quieres empezar de nuevo?
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                            <button
                                className="modal-close-btn"
                                onClick={confirmReset}
                                style={{ background: 'linear-gradient(180deg, #FF9C57 0%, #E65900 100%)', color: 'white' }}
                            >
                                Sí
                            </button>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowResetModal(false)}
                                style={{ background: '#f5f5f7', color: '#333' }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
