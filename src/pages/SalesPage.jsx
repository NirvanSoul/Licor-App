import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccordionSection from '../components/AccordionSection';
import ContainerSelector from '../components/ContainerSelector';
import CustomConfirmationModal from '../components/CustomConfirmationModal';
import { Trash2, ShoppingBag, Store, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { useOrder } from '../context/OrderContext';
import './SalesPage.css';

// Import new modular components
import { useSalesState } from './Sales/hooks/useSalesState';
import { useCartManager } from './Sales/hooks/useCartManager';
import { useMixedBuilder } from './Sales/hooks/useMixedBuilder';
import { useTicketFlow } from './Sales/hooks/useTicketFlow';

import { calculateTotalBs, calculateTotalUsd, calculateCurrentSelectionBs } from './Sales/utils/priceCalculations';
import { validateOrderStock } from './Sales/utils/stockValidation';
import { formatCurrency, formatUsd, getBeerSelectionLabel } from './Sales/utils/orderFormatters';
import { calculateMixedPrice } from './Sales/utils/mixedCaseHelpers';

import MixedBuilderModal from './Sales/components/MixedBuilderModal';
import CartSummary from './Sales/components/CartSummary';
import PaymentForm from './Sales/components/PaymentForm';
import StockErrorModal from './Sales/components/StockErrorModal';

// --- HELPER COMPONENTS ---
const VarietyToggle = ({ beerVariety, onToggle }) => (
    <div className="toggle-switch" style={{ height: '32px', padding: '2px', minWidth: '150px' }}>
        <button
            className={`toggle-option ${beerVariety === 'Normal' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle('Normal'); }}
            style={{ fontSize: '0.75rem', flex: 1 }}
        >
            Normal
        </button>
        <button
            className={`toggle-option ${beerVariety === 'Variado' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle('Variado'); }}
            style={{ fontSize: '0.75rem', flex: 1 }}
        >
            Variado
        </button>
    </div>
);

const TercioToggle = ({ isTercio, onTercioToggle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tercio</span>
        <button
            onClick={(e) => {
                e.stopPropagation();
                onTercioToggle();
            }}
            style={{
                width: '42px',
                height: '22px',
                borderRadius: '11px',
                background: isTercio ? 'var(--text-primary)' : 'rgba(128, 128, 128, 0.2)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
            }}
        >
            <div style={{
                width: '18px',
                height: '18px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isTercio ? 'translateX(20px)' : 'translateX(0)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
                {isTercio && <Check size={10} color="var(--text-primary)" strokeWidth={4} />}
            </div>
        </button>
    </div>
);

export default function SalesPage() {
    const navigate = useNavigate();
    const {
        beerTypes, getPrice, getBsPrice, getUnitsPerEmission,
        checkStock, getInventory, getEmissionsForSubtype, currencySymbol, beerCategories
    } = useProduct();
    const { createOrder, processDirectSale } = useOrder();

    // Use custom hooks
    const {
        orderState,
        openSection,
        setOpenSection,
        showMixedBuilder,
        setShowMixedBuilder,
        handleConsumptionSelect,
        handleEmissionSelect,
        handleVarietyToggle,
        handleBeerSelect,
        handleSubtypeChange,
        handleTercioToggle,
        toggleSection,
        resetOrderState,
        increaseQuantity,
        decreaseQuantity,
        setQuantity
    } = useSalesState();

    // Stock validation wrapper
    const validateStock = () => {
        return validateOrderStock(orderState, cartItems, getInventory, getUnitsPerEmission);
    };

    const {
        cartItems,
        setCartItems,
        isSelectionComplete,
        handleAddToCart: addToCart,
        handleRemoveFromCart,
        clearCart,
        addMixedToCart
    } = useCartManager(orderState, validateStock, resetOrderState);

    const {
        mixedComposition,
        addToMix,
        removeFromMix,
        resetMixedComposition,
        getMixedValidation
    } = useMixedBuilder(orderState, checkStock);

    const {
        ticketStep,
        customerName,
        setCustomerName,
        paymentMethod,
        setPaymentMethod,
        paymentReference,
        setPaymentReference,
        ticketNumber,
        ticketDate,
        initializeTicket,
        resetTicketFlow,
        getButtonText,
        validatePayment
    } = useTicketFlow();

    // Local state for modals
    const [showResetModal, setShowResetModal] = useState(false);
    const [stockError, setStockError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Calculate totals
    const totalBs = calculateTotalBs(cartItems, orderState, getBsPrice, getUnitsPerEmission);
    const totalUsd = calculateTotalUsd(cartItems, orderState, getPrice, getUnitsPerEmission);
    const currentSelectionBs = calculateCurrentSelectionBs(orderState, getBsPrice);

    // Calculate mixed price
    const mixedPriceBs = calculateMixedPrice(
        mixedComposition,
        orderState.emission,
        orderState.subtype,
        getBsPrice,
        orderState.consumptionMode === 'Local' ? 'local' : 'standard'
    );

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

    // Notify layout when modals open/close
    useEffect(() => {
        if (showMixedBuilder || showResetModal || showModal) {
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
    }, [showMixedBuilder, showResetModal, showModal]);

    const confirmReset = () => {
        clearCart();
        resetOrderState();
        setCustomerName('');
        setShowResetModal(false);
    };

    const closeSuccessModal = () => {
        setShowModal(false);
        clearCart();
        resetOrderState();
        resetTicketFlow();
    };

    // Handle adding to cart with stock validation
    const handleAddToCartClick = () => {
        const error = addToCart(getBsPrice, getPrice);
        if (error) {
            setStockError(error);
        }
    };

    // Confirm mixed case
    const confirmMixedCase = () => {
        const validation = getMixedValidation(getUnitsPerEmission);
        if (!validation.isValid) {
            alert(`Debes completar la caja. Llevas ${validation.current} de ${validation.target}.`);
            return;
        }

        const mode = 'standard';
        const finalPriceBs = calculateMixedPrice(mixedComposition, orderState.emission, orderState.subtype, getBsPrice, mode);
        const finalPriceUsd = calculateMixedPrice(mixedComposition, orderState.emission, orderState.subtype, getPrice, mode);

        addMixedToCart(mixedComposition, finalPriceBs, finalPriceUsd);
        resetOrderState();
        resetMixedComposition();
        setShowMixedBuilder(false);
    };

    // Handle initial create click
    const handleInitialCreateClick = () => {
        if (cartItems.length === 0 && !isSelectionComplete()) return;

        if (isSelectionComplete()) {
            const error = addToCart(getBsPrice, getPrice);
            if (error) {
                setStockError(error);
                return;
            }
        }

        initializeTicket();
    };

    // Handle final confirm
    const handleFinalConfirm = () => {
        const paymentValidation = validatePayment(cartItems);
        if (!paymentValidation.valid) {
            alert(paymentValidation.message);
            return;
        }

        const localItems = cartItems.filter(i => i.consumptionMode === 'Local');
        const takeawayItems = cartItems.filter(i => i.consumptionMode === 'Para Llevar');
        const hasLocal = localItems.length > 0;
        const hasTakeAway = takeawayItems.length > 0;

        // Process Local Items (Ticket Open)
        if (localItems.length > 0 || (cartItems.length === 0 && !hasTakeAway)) {
            const finalMethod = paymentMethod ? `Pre-Pagado - ${paymentMethod}` : null;
            createOrder(customerName, localItems, 'Local', finalMethod, paymentReference);
        }

        // Process Take Away Items (Directly to Cash/PAID)
        if (takeawayItems.length > 0) {
            processDirectSale(customerName, takeawayItems, paymentMethod, paymentReference);
        }

        // Navigation / Feedback
        if (localItems.length > 0 && !hasTakeAway) {
            navigate('/pendientes');
            closeSuccessModal();
        } else {
            setShowModal(true);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        clearCart();
        resetOrderState();
        setShowDeleteConfirm(false);
    };

    return (
        <div className="sales-container-v2">

            {/* 1. Modo de Consumo */}
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
                        style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Store size={28} /> <span>Local</span>
                    </button>
                    <button
                        className={`option-btn ${orderState.consumptionMode === 'Para Llevar' ? 'selected' : ''}`}
                        onClick={() => handleConsumptionSelect('Para Llevar')}
                        style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <ShoppingBag size={28} /> <span>Para Llevar</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <ContainerSelector
                            value={orderState.subtype}
                            onChange={handleSubtypeChange}
                        />
                    </div>
                }
            >
                <div className="options-grid">
                    {getEmissionsForSubtype(orderState.subtype).map(opt => (
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
                selectionLabel={getBeerSelectionLabel(orderState)}
                headerAction={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                        <TercioToggle
                            isTercio={orderState.subtype === 'Botella Tercio'}
                            onTercioToggle={handleTercioToggle}
                        />
                        <VarietyToggle
                            beerVariety={orderState.beerVariety}
                            onToggle={(v) => {
                                handleVarietyToggle(v);
                                setOpenSection('beer');
                            }}
                        />
                    </div>
                }
            >

                {(orderState.beerVariety === 'Normal' || (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local')) ? (
                    <>
                        <div className="options-grid">
                            {beerTypes
                                .filter(beer => {
                                    const activeSubtype = orderState.subtype.toLowerCase();
                                    const category = beerCategories[beer];

                                    if (category) return category.toLowerCase().includes(activeSubtype.includes('lata') ? 'lata' : 'botella');

                                    const price = getPrice(beer, 'Unidad', orderState.subtype);
                                    if (price > 0) return true;

                                    return false;
                                })
                                .map(opt => (
                                    <button
                                        key={opt}
                                        className={`option-btn ${orderState.beerType === opt ? 'selected' : ''}`}
                                        onClick={() => handleBeerSelect(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                        </div>
                        {orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local' && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--accent-color)' }} />
                                <span>Selecciona la primera cerveza. Las demás se agregarán en Pendientes.</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        {orderState.consumptionMode === 'Para Llevar' && (
                            <>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    Arma tu caja variada ahora.
                                </p>
                                <button
                                    className="create-ticket-btn"
                                    style={{ background: 'var(--accent-color)' }}
                                    onClick={() => setShowMixedBuilder(true)}
                                    disabled={!orderState.emission}
                                >
                                    {orderState.emission ? `Armar ${orderState.emission} Variada` : 'Selecciona Emisión Primero'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </AccordionSection>

            {/* Mixed Builder Modal */}
            <MixedBuilderModal
                isOpen={showMixedBuilder}
                onClose={() => setShowMixedBuilder(false)}
                emission={orderState.emission}
                subtype={orderState.subtype}
                composition={mixedComposition}
                onAddToMix={(beer) => addToMix(beer, getUnitsPerEmission)}
                onRemoveFromMix={removeFromMix}
                onConfirm={confirmMixedCase}
                beerTypes={beerTypes}
                getInventory={getInventory}
                getUnitsPerEmission={getUnitsPerEmission}
                getMixedPrice={mixedPriceBs}
                consumptionMode={orderState.consumptionMode}
            />

            {/* Summary / Cart Card */}
            <div className="order-summary-card">
                <CartSummary
                    cartItems={cartItems}
                    onRemoveItem={handleRemoveFromCart}
                    currentSelection={currentSelectionBs}
                    orderState={orderState}
                    getBsPrice={getBsPrice}
                    getPrice={getPrice}
                    totalBs={totalBs}
                    totalUsd={totalUsd}
                    ticketStep={ticketStep}
                    isSelectionComplete={isSelectionComplete()}
                    onAddToCart={handleAddToCartClick}
                    increaseQuantity={increaseQuantity}
                    decreaseQuantity={decreaseQuantity}
                    setQuantity={setQuantity}
                    getBeerSelectionLabel={getBeerSelectionLabel}
                    currencySymbol={currencySymbol}
                />

                {/* Payment Form */}
                {ticketStep === 2 && (
                    <PaymentForm
                        ticketNumber={ticketNumber}
                        ticketDate={ticketDate}
                        customerName={customerName}
                        onCustomerNameChange={setCustomerName}
                        paymentMethod={paymentMethod}
                        onPaymentMethodChange={setPaymentMethod}
                        paymentReference={paymentReference}
                        onPaymentReferenceChange={setPaymentReference}
                        hasLocalItems={cartItems.some(i => i.consumptionMode === 'Local') || (cartItems.some(i => i.beerVariety === 'Variado' && i.consumptionMode === 'Local'))}
                    />
                )}

                {(cartItems.length > 0 || isSelectionComplete() || (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local' && orderState.emission && orderState.beerType)) && (
                    <div className="summary-actions">
                        <button className="delete-action" onClick={handleDeleteClick}>
                            <Trash2 size={16} /> {ticketStep > 0 ? 'Cancelar Ticket' : 'Limpiar Todo'}
                        </button>
                    </div>
                )}

                {/* QUICK OPEN TAB (ONLY FOR LOCAL) */}
                {orderState.consumptionMode === 'Local' && !cartItems.length && !orderState.beerType && (
                    <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                        <button
                            className="create-ticket-btn"
                            style={{
                                background: 'transparent',
                                border: '2px dashed var(--accent-light)',
                                color: 'var(--text-secondary)',
                                height: '60px'
                            }}
                            onClick={initializeTicket}
                        >
                            <Store size={20} /> Solo Abrir Carta (Sin productos)
                        </button>
                    </div>
                )}

                <button
                    className={`create-ticket-btn ${ticketStep > 0 ? 'confirm-mode' : ''}`}
                    onClick={ticketStep === 0 ? handleInitialCreateClick : handleFinalConfirm}
                    disabled={
                        (ticketStep === 0 && !cartItems.length && !isSelectionComplete() && !(orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local' && orderState.emission && orderState.beerType)) ||
                        (ticketStep === 2 && !paymentMethod && cartItems.length > 0)
                    }
                    style={{
                        opacity: (
                            (ticketStep === 0 && !cartItems.length && !isSelectionComplete() && !(orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local' && orderState.emission && orderState.beerType)) ||
                            (ticketStep === 2 && !paymentMethod && cartItems.length > 0)
                        ) ? 0.5 : 1
                    }}
                >
                    {getButtonText(cartItems)}
                </button>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <CheckCircle className="modal-icon" size={64} color="#34c759" style={{ marginBottom: '1rem' }} />
                        <h3 className="modal-title">¡Venta Exitosa!</h3>
                        <button className="modal-close-btn" onClick={closeSuccessModal}>Cerrar y Nuevo Pedido</button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            <CustomConfirmationModal
                isOpen={showDeleteConfirm}
                title="¿Eliminar Ticket?"
                message="Se perderán todos los productos seleccionados."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Stock Error Modal */}
            <StockErrorModal
                stockError={stockError}
                onClose={() => setStockError(null)}
            />

            {/* Reset Modal */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '320px', padding: '2rem' }}>
                        <h3 className="modal-title" style={{ marginBottom: '0.5rem' }}>¿Reiniciar Venta?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Se perderá la selección actual.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="modal-close-btn"
                                onClick={confirmReset}
                                style={{ margin: 0, background: 'var(--bg-card-hover)', color: '#ef4444', border: '1px solid #ef4444' }}
                            >
                                Sí, Reiniciar
                            </button>
                            <button
                                className="create-ticket-btn"
                                onClick={() => setShowResetModal(false)}
                                style={{ margin: 0, fontSize: '1rem', padding: '0.75rem' }}
                            >
                                No, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
