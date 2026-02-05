/**
 * CartSummary Component
 * Displays cart items, current selection, and totals
 */

import React from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import { formatCurrency } from '../utils/orderFormatters';

export default function CartSummary({
    cartItems,
    onRemoveItem,
    currentSelection,
    orderState,
    getBsPrice,
    getPrice,
    totalBs,
    totalUsd,
    ticketStep,
    isSelectionComplete,
    onAddToCart,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    getBeerSelectionLabel,
    currencySymbol
}) {
    const formatUsd = (amount) => {
        if (isNaN(amount)) return `${currencySymbol}0.00`;
        return `${currencySymbol}${amount.toFixed(2)}`;
    };

    return (
        <>
            {/* Cart List */}
            {(cartItems.length > 0) && (
                <div className="cart-list">
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item-row">
                            <div style={{ flex: 1 }}>
                                <span className="cart-item-info">
                                    <b>{item.quantity}x</b> {item.emission} {item.beerVariety === 'Variado' ? 'Variada' : item.beerType}
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: item.consumptionMode === 'Local' ? '#FF9C57' : '#999',
                                        marginLeft: '6px',
                                        fontWeight: 500
                                    }}>
                                        ({item.consumptionMode === 'Local' ? 'Local' : 'Llevar'})
                                    </span>
                                </span>
                                {/* Show composition details if varied */}
                                {item.beerVariety === 'Variado' && item.composition && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                                        {Object.entries(item.composition).map(([b, q]) => `${q} ${b}`).join(', ')}
                                    </div>
                                )}
                                {item.beerVariety === 'Variado' && !item.composition && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem', fontStyle: 'italic' }}>
                                        * Base: {item.displayBase || item.baseBeer} ({item.subtype})
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>
                                    {item.beerVariety === 'Variado'
                                        ? formatCurrency(item.unitPriceBs * item.quantity)
                                        : formatCurrency(getBsPrice(item.beerType, item.emission, item.subtype, item.consumptionMode === 'Local' ? 'local' : 'standard') * item.quantity)
                                    } Bs
                                </span>
                                {!ticketStep && (
                                    <button className="cart-delete-btn" onClick={() => onRemoveItem(item.id)}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Current Active Selection */}
            {isSelectionComplete && ticketStep === 0 && (orderState.beerVariety === 'Normal' || (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local')) && (
                <div className="summary-row">
                    <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={decreaseQuantity}
                            className="qty-btn"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid var(--accent-light)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={orderState.quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                width: '80px',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield',
                                padding: '0'
                            }}
                        />
                        <button
                            onClick={increaseQuantity}
                            className="qty-btn"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid var(--accent-light)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            +
                        </button>
                        <span className="summary-item" style={{ marginLeft: '8px' }}>
                            {getBeerSelectionLabel(orderState) || `${orderState.beerType} (${orderState.emission})`}
                        </span>
                    </div>
                    <span className="summary-price">
                        {formatCurrency(currentSelection)} Bs
                    </span>
                </div>
            )}

            {isSelectionComplete && ticketStep === 0 && (orderState.beerVariety === 'Normal' || (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local')) && (
                <button className="add-item-btn" onClick={onAddToCart}>
                    <PlusCircle size={18} /> Agregar otro producto
                </button>
            )}

            <div className="summary-total-container" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                {orderState.consumptionMode === 'Local' && <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600 }}>Precio Local</span>}
                <div className="summary-total">{formatCurrency(totalBs)} Bs</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, fontStyle: 'italic', marginTop: '-5px' }}>
                    {formatUsd(totalUsd)}
                </div>
            </div>
        </>
    );
}
